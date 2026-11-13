const $ = (id) => document.getElementById(id);

// Textos según el idioma del navegador (_locales/en o _locales/es)
document.documentElement.lang = chrome.i18n.getUILanguage();
for (const el of document.querySelectorAll("[data-i18n]")) {
  el.textContent = chrome.i18n.getMessage(el.dataset.i18n);
}

function render() {
  chrome.storage.local.get({ enabled: true, claims: 0, lastClaim: null }, (d) => {
    $("enabled").checked = d.enabled;
    $("claims").textContent = d.claims;
    $("last").textContent = d.lastClaim ? new Date(d.lastClaim).toLocaleString() : "—";
  });
}

$("enabled").addEventListener("change", (e) => {
  chrome.storage.local.set({ enabled: e.target.checked });
});

$("reset").addEventListener("click", () => {
  chrome.storage.local.set({ claims: 0, lastClaim: null }, render);
});

chrome.storage.onChanged.addListener(render);
render();
