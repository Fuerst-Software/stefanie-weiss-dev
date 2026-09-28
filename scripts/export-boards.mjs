// Pulls all published boards from boards.solutions and writes them as static pages:
//   board/<slug>/index.html  +  board/<slug>/image.<ext>
// Runs in GitHub Actions (see .github/workflows/board-pages.yml). No dependencies.
import { mkdir, writeFile, readFile, readdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const API = process.env.BOARDS_API || 'https://api.fuerst-software.com/api';
const EMBED_KEY = process.env.BOARDS_EMBED_KEY || 'ek_mrvy1jwa3f1vx';
const CONSENT_KEY = process.env.CONSENT_KEY || 'stefanie_cookie_v2';
const OUT = 'board';
const MANIFEST = `${OUT}/manifest.json`;

async function getJson(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(120000) });
  if (!res.ok) throw new Error(`${url} → HTTP ${res.status}`);
  return res.json();
}

const { boards, media = [] } = await getJson(`${API}/export/site/${EMBED_KEY}?consentKey=${CONSENT_KEY}`);
const MEDIA_DIR = `${OUT}/media`;
if (!Array.isArray(boards) || !boards.length) {
  // Never wipe the folder because of an empty/odd API answer
  console.log('Keine Boards erhalten — nichts geändert.');
  process.exit(0);
}

const manifest = existsSync(MANIFEST) ? JSON.parse(await readFile(MANIFEST, 'utf8')) : {};
const next = {};

// Images inside board content — named by content hash, so an existing file never changes
await mkdir(MEDIA_DIR, { recursive: true });
for (const name of media) {
  if (!/^[0-9a-f]{20}\.(png|jpg|webp|gif)$/.test(name) || existsSync(`${MEDIA_DIR}/${name}`)) continue;
  const res = await fetch(`${API}/export/media/${EMBED_KEY}/${name}`, { signal: AbortSignal.timeout(120000) });
  if (res.ok) await writeFile(`${MEDIA_DIR}/${name}`, Buffer.from(await res.arrayBuffer()));
}
for (const name of await readdir(MEDIA_DIR)) {
  if (!media.includes(name)) await rm(`${MEDIA_DIR}/${name}`);
}

for (const b of boards) {
  if (!/^[a-z0-9-]{1,120}$/.test(b.slug) || b.slug === 'media') continue;
  const dir = `${OUT}/${b.slug}`;
  await mkdir(dir, { recursive: true });
  await writeFile(`${dir}/index.html`, b.html);

  if (b.image) {
    const file = `${dir}/image.${b.image}`;
    // Only re-download the (large) image when the board changed
    if (!existsSync(file) || manifest[b.slug] !== b.updatedAt) {
      const res = await fetch(`${API}/export/image/${b.embedId}`, { signal: AbortSignal.timeout(120000) });
      if (res.ok) await writeFile(file, Buffer.from(await res.arrayBuffer()));
    }
  }
  next[b.slug] = b.updatedAt;
}

// Remove pages of boards that were unpublished or renamed
for (const entry of await readdir(OUT, { withFileTypes: true })) {
  if (entry.isDirectory() && entry.name !== 'media' && !(entry.name in next)) await rm(`${OUT}/${entry.name}`, { recursive: true });
}

await writeFile(MANIFEST, JSON.stringify(next, null, 2) + '\n');
console.log(`${Object.keys(next).length} Board-Seiten geschrieben.`);
