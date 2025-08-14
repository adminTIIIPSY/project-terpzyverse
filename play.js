// Parse query params
const params = new URLSearchParams(location.search);
const provider = params.get("provider") || "Unknown";
const gameId   = params.get("game")     || "unknown_game";

// Simple currency dropdown reuse (same behavior as home)
const btn = document.getElementById("balanceDropdown");
const menu = document.getElementById("balanceMenu");
btn.addEventListener("click", () => {
  menu.style.display = menu.style.display === "block" ? "none" : "block";
});
document.addEventListener("click",(e)=>{
  if (!menu.contains(e.target) && e.target!==btn) menu.style.display="none";
});
menu.querySelectorAll("li").forEach(li=>{
  li.addEventListener("click",()=>{
    const cur = li.getAttribute("data-currency");
    btn.textContent = `${cur} ▾`;
    document.getElementById("activeBalanceAmount").textContent =
      cur==="GC" ? "50.00" : cur==="SC" ? "3.25" : "0.42";
    menu.style.display="none";
  });
});

// Map gameId -> display name (optional)
// If you keep GAMES in app.js and serve both pages together, you can also pass name via query.
const NAME_GUESS = gameId
  .split("_")
  .slice(1)
  .join(" ")
  .replace(/\b\w/g, c => c.toUpperCase());

// Provider adapters (Phase 1: all route to our local mock)
const adapterMap = {
  "Pragmatic": ({ game, mode }) => `/play-placeholder.html?title=${encodeURIComponent(NAME_GUESS)}&provider=Pragmatic&mode=${mode}`,
  "Hacksaw":   ({ game, mode }) => `/play-placeholder.html?title=${encodeURIComponent(NAME_GUESS)}&provider=Hacksaw&mode=${mode}`,
  "3 Oaks":    ({ game, mode }) => `/play-placeholder.html?title=${encodeURIComponent(NAME_GUESS)}&provider=3%20Oaks&mode=${mode}`,
  "BGaming":   ({ game, mode }) => `/play-placeholder.html?title=${encodeURIComponent(NAME_GUESS)}&provider=BGaming&mode=${mode}`,
  "Relax":     ({ game, mode }) => `/play-placeholder.html?title=${encodeURIComponent(NAME_GUESS)}&provider=Relax&mode=${mode}`,
};

// Default adapter if provider key missing
function getLaunchUrl({ provider, game, mode }) {
  const fn = adapterMap[provider];
  return fn
    ? fn({ game, mode })
    : `/play-placeholder.html?title=${encodeURIComponent(NAME_GUESS)}&provider=${encodeURIComponent(provider)}&mode=${mode}`;
}

// Render header crumbs/meta
document.getElementById("crumbProvider").textContent = provider;
document.getElementById("crumbGame").textContent = NAME_GUESS || gameId;
document.getElementById("gameTitle").textContent = NAME_GUESS || gameId;
document.getElementById("metaProvider").textContent = provider;

// Load initial frame
let mode = "real"; // or "demo"
const frame = document.getElementById("gameFrame");
function loadFrame(){ frame.src = getLaunchUrl({ provider, game: gameId, mode }); }
loadFrame();

// Wire buttons
document.getElementById("switchDemo").addEventListener("click", () => {
  mode = mode === "real" ? "demo" : "real";
  document.getElementById("metaMode").textContent = mode === "real" ? "Real Mode" : "Demo Mode";
  loadFrame();
});
document.getElementById("reloadBtn").addEventListener("click", loadFrame);
document.getElementById("backBtn").addEventListener("click", () => history.length > 1 ? history.back() : location.href='index.html');

// (Optional) Listen to postMessage from providers/mocks
window.addEventListener("message", (e) => {
  // Example: handle "game:opened", "balance:request", etc.
  // console.log("message from game:", e.data);
});
