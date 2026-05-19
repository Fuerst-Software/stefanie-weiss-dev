/* Cookie Consent – Stefanie Weiss (dark/amber)
   - Speichert Einwilligung (localStorage)
   - Buttons: Nur essenziell / Alle akzeptieren
   - Helper: window.hasConsent('analytics'|'marketing')
*/
(() => {
  const STORAGE_KEY = 'swConsent';
  const CONSENT_VERSION = 1; // Anheben, wenn Text/Umfang geändert wird

  const $ = (s, r = document) => r.querySelector(s);
  const banner = $('#cookie-banner');
  if (!banner) return;

  const getConsent = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  };

  const setConsent = (data) => {
    const payload = {
      v: CONSENT_VERSION,
      t: new Date().toISOString(),
      essential: true,
      analytics: !!data.analytics,
      marketing: !!data.marketing
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    window.swConsent = payload;
  };

  // globaler Helper
  window.hasConsent = (key) => {
    try {
      const c = window.swConsent || getConsent();
      return !!(c && c[key] === true);
    } catch { return false; }
  };

  const showIfNeeded = () => {
    const c = getConsent();
    const need = !c || (c && c.v !== CONSENT_VERSION);
    if (need) {
      banner.style.display = 'block';
      const acceptBtn = $('#cookie-accept', banner);
      acceptBtn && acceptBtn.focus({ preventScroll: true });
    } else {
      window.swConsent = c;
    }
  };

  const acceptBtn = $('#cookie-accept', banner);
  const declineBtn = $('#cookie-decline', banner);

  acceptBtn?.addEventListener('click', () => {
    setConsent({ analytics: true, marketing: true });
    banner.style.display = 'none';
    // Beispiel: Analytics erst NACH Einwilligung laden:
    // loadAnalytics();
  });

  declineBtn?.addEventListener('click', () => {
    setConsent({ analytics: false, marketing: false });
    banner.style.display = 'none';
  });

  // Optional: Lazy-Laden von Scripts nach Einwilligung
  // function loadAnalytics(){
  //   if (!hasConsent('analytics')) return;
  //   const s = document.createElement('script');
  //   s.src = 'https://example.com/analytics.js';
  //   s.async = true;
  //   document.head.appendChild(s);
  // }

  document.addEventListener('DOMContentLoaded', showIfNeeded);
})();
