// Al instalar, actualizar o recargar la extensión, Chrome no inyecta el content
// script en las pestañas ya abiertas. Lo hacemos aquí, solo en pestañas de Twitch.
// Sin red, sin datos: solo ejecuta content.js en esas pestañas.
chrome.runtime.onInstalled.addListener(async () => {
  const tabs = await chrome.tabs.query({ url: "https://www.twitch.tv/*" });
  for (const tab of tabs) {
    chrome.scripting
      .executeScript({ target: { tabId: tab.id }, files: ["content.js"] })
      .catch(() => {}); // pestaña descartada o no lista: se inyectará al recargarla
  }
});
