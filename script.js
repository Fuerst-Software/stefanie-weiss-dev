/* =========================
   Navigation
========================= */

const header = document.getElementById("site-nav");
const toggle = document.querySelector(".nav__toggle");
const menu = document.getElementById("navmenu");

function openMenu() {
  if (!menu || !toggle) return;

  menu.classList.add("open");
  document.body.classList.add("menu-open");
  toggle.setAttribute("aria-expanded", "true");
  toggle.setAttribute("aria-label", "Menü schließen");
}

function closeMenu() {
  if (!menu || !toggle) return;

  menu.classList.remove("open");
  document.body.classList.remove("menu-open");
  toggle.setAttribute("aria-expanded", "false");
  toggle.setAttribute("aria-label", "Menü öffnen");
}

if (toggle && menu) {
  toggle.addEventListener("click", () => {
    menu.classList.contains("open") ? closeMenu() : openMenu();
  });

  menu.addEventListener("click", (event) => {
    if (event.target.closest("a")) closeMenu();
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
  });
}

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", (event) => {
    const href = link.getAttribute("href");
    if (!href || href === "#") return;

    const target = document.querySelector(href);
    if (!target) return;

    event.preventDefault();
    closeMenu();

    const top = target.getBoundingClientRect().top + window.scrollY - 86;

    window.scrollTo({
      top,
      behavior: "smooth"
    });
  });
});

window.addEventListener(
  "scroll",
  () => {
    if (header) {
      header.classList.toggle("is-scrolled", window.scrollY > 10);
    }
  },
  { passive: true }
);

const yearEl = document.getElementById("year");

if (yearEl) {
  yearEl.textContent = new Date().getFullYear();
}

/* =========================
   Boards Live Embed
========================= */

(() => {
  const BOARD_URL = "https://boards.com/a/d66CB.bHdUCh";

  const iframe = document.getElementById("boardsFrame");
  const loader = document.getElementById("boardLoader");
  const fallback = document.getElementById("boardFallback");
  const reloadBtn = document.getElementById("reloadBoard");

  if (!iframe || !loader || !fallback) return;

  let didLoad = false;
  let loadTimer = null;

  function makeUrl() {
    const separator = BOARD_URL.includes("?") ? "&" : "?";
    return `${BOARD_URL}${separator}embed=1&view=web&t=${Date.now()}`;
  }

  function showLoader() {
    loader.classList.remove("is-hidden");
    fallback.hidden = true;
    didLoad = false;
  }

  function hideLoader() {
    loader.classList.add("is-hidden");
  }

  function showFallback() {
    hideLoader();
    fallback.hidden = false;
  }

  function loadBoard() {
    showLoader();

    iframe.removeAttribute("src");

    setTimeout(() => {
      iframe.src = makeUrl();
    }, 80);

    clearTimeout(loadTimer);

    loadTimer = setTimeout(() => {
      if (!didLoad) {
        showFallback();
      }
    }, 7000);
  }

  iframe.addEventListener("load", () => {
    didLoad = true;
    hideLoader();

    clearTimeout(loadTimer);

    /*
      Wichtig:
      Wenn Boards per X-Frame-Options/CSP blockiert,
      kann der Browser das Iframe blockieren.
      JS darf dann aus Sicherheitsgründen NICHT zuverlässig in den Frame schauen.
    */
  });

  iframe.addEventListener("error", () => {
    showFallback();
  });

  reloadBtn?.addEventListener("click", () => {
    loadBoard();
  });

  loadBoard();
})();

/* =========================
   Kontaktformular
========================= */

(() => {
  const form = document.getElementById("contactForm");
  const statusBox = document.getElementById("cf-toast");

  if (!form || !statusBox) return;

  function showStatus(message, ok = true) {
    statusBox.hidden = false;
    statusBox.textContent = message;
    statusBox.className = ok ? "toast toast--ok" : "toast toast--err";
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!form.checkValidity()) {
      showStatus("Bitte alle Pflichtfelder korrekt ausfüllen.", false);
      form.reportValidity();
      return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    const oldText = submitBtn ? submitBtn.textContent : "";

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Wird gesendet…";
    }

    try {
      const formData = new FormData(form);
      formData.append("_subject", "Neue Anfrage über Stefanie Weiss Website");
      formData.append("_template", "table");
      formData.append("_captcha", "false");

      const response = await fetch("https://formsubmit.co/ajax/mama.moments@gmx.de", {
        method: "POST",
        body: formData,
        headers: {
          Accept: "application/json"
        }
      });

      if (!response.ok) {
        throw new Error("Formular konnte nicht gesendet werden.");
      }

      showStatus("Danke! Deine Anfrage ist eingegangen – ich melde mich zeitnah.", true);
      form.reset();
    } catch (error) {
      console.error(error);
      showStatus("Leider konnte die Nachricht nicht gesendet werden. Bitte versuche es später erneut.", false);
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = oldText;
      }
    }
  });
})();

/* =========================
   Cookie Consent
========================= */

(() => {
  const COOKIE_KEY = "stefanie_cookie_settings_v1";

  const banner = document.getElementById("cookie-banner");
  const acceptBtn = document.getElementById("cookie-accept");
  const declineBtn = document.getElementById("cookie-decline");

  if (!banner || !acceptBtn || !declineBtn) return;

  function setConsent(type) {
    const data = {
      type,
      date: new Date().toISOString()
    };

    localStorage.setItem(COOKIE_KEY, JSON.stringify(data));

    document.cookie =
      "cookie_consent=" +
      type +
      "; path=/; max-age=" +
      60 * 60 * 24 * 365 +
      "; SameSite=Lax";

    hideBanner();

    window.dispatchEvent(
      new CustomEvent("cookieconsentchange", {
        detail: { consent: type }
      })
    );
  }

  function getConsent() {
    try {
      return JSON.parse(localStorage.getItem(COOKIE_KEY));
    } catch {
      return null;
    }
  }

  function showBanner() {
    banner.hidden = false;

    requestAnimationFrame(() => {
      banner.style.opacity = "1";
      banner.style.transform = "translateX(-50%) translateY(0)";
    });
  }

  function hideBanner() {
    banner.style.opacity = "0";
    banner.style.transform = "translateX(-50%) translateY(16px)";

    setTimeout(() => {
      banner.hidden = true;
    }, 260);
  }

  banner.style.transition = "opacity .28s ease, transform .28s ease";
  banner.style.opacity = "0";
  banner.style.transform = "translateX(-50%) translateY(16px)";

  const savedConsent = getConsent();

  if (!savedConsent) {
    setTimeout(showBanner, 700);
  } else if (savedConsent.type === "accepted") {
    window.dispatchEvent(
      new CustomEvent("cookieconsentchange", {
        detail: { consent: "accepted" }
      })
    );
  }

  acceptBtn.addEventListener("click", () => setConsent("accepted"));
  declineBtn.addEventListener("click", () => setConsent("essential"));
})();