// Twitch Bonus Autoclaim — todo local. No hace ninguna petición de red.
(() => {
  "use strict";

  // Evita doble ejecución si el script se inyecta dos veces en la misma pestaña
  if (window.__twitchBonusAutoclaim) return;
  window.__twitchBonusAutoclaim = true;

  const CHECK_INTERVAL_MS = 5000;   // comprobación de respaldo
  const MIN_DELAY_MS = 800;         // retardo aleatorio antes de pulsar
  const MAX_DELAY_MS = 2500;
  const LOG = (...a) => console.debug("[Bonus Autoclaim]", ...a);

  // aria-label del botón en distintos idiomas de Twitch
  const LABEL_RE = /claim bonus|reclamar|bonificaci|bonus|récupérer|resgatar|abholen/i;

  let enabled = true;
  let pending = false;
  let observer = null;
  let intervalId = null;

  // Si la extensión se recarga/actualiza, este script queda "huérfano":
  // sigue en la página pero ya no puede hablar con la extensión.
  function alive() {
    try { return !!chrome.runtime?.id; } catch { return false; }
  }

  function shutdown() {
    observer?.disconnect();
    clearInterval(intervalId);
    LOG("Extensión recargada; este script se detiene (la nueva instancia toma el relevo).");
  }

  function findBonusButton() {
    // 1) Icono característico del cofre
    const icon = document.querySelector(".claimable-bonus__icon");
    if (icon) {
      const btn = icon.closest("button");
      if (btn) return btn;
    }

    // 2) Botones dentro del resumen de puntos con aria-label de "reclamar"
    const summary = document.querySelector(
      '[data-test-selector="community-points-summary"], .community-points-summary'
    );
    if (summary) {
      for (const btn of summary.querySelectorAll("button[aria-label]")) {
        if (LABEL_RE.test(btn.getAttribute("aria-label"))) return btn;
      }
    }
    return null;
  }

  function recordClaim() {
    try {
      chrome.storage.local.get({ claims: 0 }, ({ claims }) => {
        chrome.storage.local.set({ claims: claims + 1, lastClaim: Date.now() });
      });
    } catch (e) {
      LOG("No se pudo guardar el contador:", e);
    }
  }

  function tryClaim() {
    if (!alive()) return shutdown();
    if (!enabled || pending) return;
    const btn = findBonusButton();
    if (!btn) return;

    pending = true;
    const delay = MIN_DELAY_MS + Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS);
    setTimeout(() => {
      pending = false;
      if (!alive()) return shutdown();
      if (!enabled) return;
      const again = findBonusButton();
      if (!again || !again.isConnected) return;
      again.click();
      LOG("Cofre reclamado");
      recordClaim();
    }, delay);
  }

  chrome.storage.local.get({ enabled: true }, (data) => {
    enabled = data.enabled;
    if (enabled) tryClaim();
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && changes.enabled) {
      enabled = changes.enabled.newValue;
      if (enabled) tryClaim();
    }
  });

  // Reacciona en cuanto aparece el cofre
  observer = new MutationObserver(() => tryClaim());
  observer.observe(document.body, { childList: true, subtree: true });

  // Respaldo por si algún cambio no dispara el observer
  intervalId = setInterval(tryClaim, CHECK_INTERVAL_MS);
  LOG("Activo");
})();
