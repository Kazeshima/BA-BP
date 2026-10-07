// Applies the saved theme before first paint to avoid a light/dark flash.
// Kept as an external file so it works under the desktop app's strict CSP (script-src 'self').
(() => {
  let theme = "system";
  try {
    theme = JSON.parse(localStorage.getItem("ba-draft:settings") || "{}").state?.theme || "system";
  } catch {}
  if (theme === "system") theme = matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  document.documentElement.dataset.theme = theme;
})();
