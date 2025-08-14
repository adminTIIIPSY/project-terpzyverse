// --- Minimal data (replace / extend as you add providers) ---
const PROVIDERS = ["All","Featured","Pragmatic","Hacksaw","3 Oaks","BGaming","Relax"];

const GAMES = [
  // Pragmatic
  game("pragmatic_sweetbonanza","Sweet Bonanza","Pragmatic",96.5,"Medium",["Bonus Buy"],"/assets/slots/pragmatic/sweet-bonanza.jpg", true),
  game("pragmatic_gateofolympus","Gates of Olympus","Pragmatic",96.3,"High",["Bonus Buy","Megaways"],"/assets/slots/pragmatic/gates-olympus.jpg", true),
  game("pragmatic_dochouse","Dog House","Pragmatic",96.5,"Medium",[], "/assets/slots/pragmatic/dog-house.jpg"),

  // Hacksaw
  game("hacksaw_chaoscrew","Chaos Crew","Hacksaw",96.3,"High",["Bonus Buy","High Vol"],"/assets/slots/hacksaw/chaos-crew.jpg", true),
  game("hacksaw_wanted","Wanted Dead or a Wild","Hacksaw",96.4,"High",["Bonus Buy"],"/assets/slots/hacksaw/wanted.jpg"),

  // 3 Oaks
  game("3oaks_goldtiger","Gold Tiger","3 Oaks",96.2,"Medium",["Hold&Spin"],"/assets/slots/3oaks/gold-tiger.jpg", true),
  game("3oaks_buffalo","Buffalo Bomb","3 Oaks",96.1,"Medium",["Hold&Spin"],"/assets/slots/3oaks/buffalo-bomb.jpg"),

  // BGaming (example)
  game("bgaming_elvisfrog","Elvis Frog","BGaming",96.0,"Medium",["Bonus Buy"],"/assets/slots/bgaming/elvis-frog.jpg"),

  // Relax (example)
  game("relax_moneytrain2","Money Train 2","Relax",96.4,"High",["Bonus Buy"],"/assets/slots/relax/money-train-2.jpg"),
];

function game(id,name,provider,rtp,volatility,tags,thumb,featured=false){
  return { id, name, provider, rtp, volatility, tags, thumb, featured, popularity: Math.random() }
}

// --- Basic state ---
let state = {
  currency: "GC",
  search: "",
  tag: "",
  sort: "popular",
  providerFilter: "All",
  gridPage: 1, // pagination
  pageSize: 18
};

// --- Helpers ---
const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));

function money(val){ return Number(val).toFixed(2); }
function setActiveCurrency(cur){
  state.currency = cur;
  $("#balanceDropdown").textContent = `${cur} ▾`;
  // In real app, load correct balance from Firestore:
  const mock = cur==="GC" ? 50 : (cur==="SC" ? 3.25 : 0.42);
  $("#activeBalanceAmount").textContent = money(mock);
}

function cardHTML(g){
  const providerBadge = `<span class="badge">${g.provider}</span>`;
  return `
    <article class="card" data-id="${g.id}" data-provider="${g.provider}">
      ${providerBadge}
      <img src="${g.thumb}" alt="${g.name}">
      <div class="meta">
        <div class="name">${g.name}</div>
        <div class="tag">${g.tags[0] || g.volatility}</div>
      </div>
    </article>
  `;
}

function fillRow(elId, items){
  const el = document.getElementById(elId);
  el.innerHTML = items.map(cardHTML).join("");
}

function smoothScrollRow(rowId, dir){
  const el = document.getElementById(rowId);
  const delta = dir === "left" ? -320 : 320;
  el.scrollBy({ left: delta, behavior: "smooth" });
}

// --- Provider Chips ---
function renderProviderChips(){
  const wrap = $("#providerChips");
  wrap.innerHTML = PROVIDERS.map(p => 
    `<button class="chip${p==="All"?" active":""}" data-provider="${p}">${p}</button>`
  ).join("");
}

// --- Featured & Provider Rows ---
function renderFeatured(){
  const featured = GAMES.filter(g=>g.featured).slice(0,12);
  fillRow("featuredRow", featured);
}
function renderProviderRows(){
  fillRow("rowPragmatic", GAMES.filter(g=>g.provider==="Pragmatic").slice(0,12));
  fillRow("rowHacksaw",  GAMES.filter(g=>g.provider==="Hacksaw").slice(0,12));
  fillRow("row3Oaks",    GAMES.filter(g=>g.provider==="3 Oaks").slice(0,12));
}

// --- All Grid with filters/pagination ---
function applyFilters(){
  let list = [...GAMES];

  if (state.providerFilter !== "All") {
    if (state.providerFilter === "Featured") list = list.filter(g=>g.featured);
    else list = list.filter(g=>g.provider === state.providerFilter);
  }
  if (state.search) {
    const q = state.search.toLowerCase();
    list = list.filter(g => g.name.toLowerCase().includes(q));
  }
  if (state.tag) list = list.filter(g => g.tags.includes(state.tag));

  switch(state.sort){
    case "popular":   list.sort((a,b)=>b.popularity-a.popularity); break;
    case "new":       list.sort((a,b)=>b.id.localeCompare(a.id)); break;
    case "rtp":       list.sort((a,b)=>b.rtp-a.rtp); break;
    case "volatility":list.sort((a,b)=>a.volatility.localeCompare(b.volatility)); break;
  }
  return list;
}
function renderGrid(reset=false){
  const grid = $("#allGrid");
  if (reset) { state.gridPage = 1; grid.innerHTML=""; }
  const list = applyFilters();
  const slice = list.slice(0, state.gridPage * state.pageSize);
  grid.innerHTML = slice.map(cardHTML).join("");
  $("#loadMore").style.display = slice.length < list.length ? "inline-flex" : "none";
}
function loadMore(){ state.gridPage++; renderGrid(false); }

// --- Continue Playing (localStorage mock now; later Firestore) ---
function getContinue(){
  try { return JSON.parse(localStorage.getItem("continueGames")||"[]"); }
  catch { return []; }
}
function pushContinue(id){
  const now = getContinue();
  const exists = now.find(x=>x===id);
  const next = [id, ...now.filter(x=>x!==id)].slice(0,5);
  localStorage.setItem("continueGames", JSON.stringify(next));
}
function renderContinue(){
  const ids = getContinue();
  const items = ids.map(id => GAMES.find(g=>g.id===id)).filter(Boolean);
  const row = $("#continueRow");
  if (!items.length){
    row.innerHTML = `<div class="muted">No recent games yet. Try a slot below.</div>`;
    return;
  }
  row.innerHTML = items.map(cardHTML).join("");
}

// --- Routing to play (adapter-ready) ---
function launchGame(game){
  // Phase 1: simple route
  const url = `/play?provider=${encodeURIComponent(game.provider)}&game=${encodeURIComponent(game.id)}`;
  pushContinue(game.id);
  window.location.href = url;
}

// --- Events ---
function wireEvents(){
  // Currency menu
  const btn = $("#balanceDropdown");
  const menu = $("#balanceMenu");
  btn.addEventListener("click", () => {
    menu.style.display = menu.style.display === "block" ? "none" : "block";
  });
  document.addEventListener("click",(e)=>{
    if (!menu.contains(e.target) && e.target!==btn) menu.style.display="none";
  });
  $$("#balanceMenu li").forEach(li=>{
    li.addEventListener("click",()=>{
      setActiveCurrency(li.getAttribute("data-currency"));
      menu.style.display="none";
    });
  });

  // Row scrollers
  $$(".nav-btn").forEach(b=>{
    b.addEventListener("click",()=>{
      smoothScrollRow(b.dataset.target, b.dataset.dir);
    });
  });

  // Provider chips
  $("#providerChips").addEventListener("click", e=>{
    const chip = e.target.closest(".chip");
    if (!chip) return;
    $$("#providerChips .chip").forEach(c=>c.classList.remove("active"));
    chip.classList.add("active");
    state.providerFilter = chip.dataset.provider;
    renderGrid(true);
  });

  // Filters
  $("#searchInput").addEventListener("input", e=>{
    state.search = e.target.value.trim();
    renderGrid(true);
  });
  $("#sortSelect").addEventListener("change", e=>{
    state.sort = e.target.value;
    renderGrid(true);
  });
  $("#tagSelect").addEventListener("change", e=>{
    state.tag = e.target.value;
    renderGrid(true);
  });
  $("#loadMore").addEventListener("click", loadMore);

  // Card clicks (rows + grid)
  document.body.addEventListener("click", e=>{
    const card = e.target.closest(".card");
    if (!card) return;
    const id = card.getAttribute("data-id");
    const game = GAMES.find(g=>g.id===id);
    if (game) launchGame(game);
  });

  // Store / promos (stub routes)
  $("#storeBtn").addEventListener("click", ()=>window.location.href="/store.html");
  $("#promosBtn").addEventListener("click", ()=>window.location.href="/promos.html");
}

// --- Init ---
function init(){
  document.getElementById("year").textContent = new Date().getFullYear();
  setActiveCurrency("GC");
  renderProviderChips();
  renderFeatured();
  renderProviderRows();
  renderGrid(true);
  renderContinue();
  wireEvents();
}
init();

/* Optional Firebase hooks (no errors if Firebase isn't present)
   You can drop your config here and load balances / continue list from Firestore. */
if (window.firebase) {
  // Example shape:
  // const app = firebase.initializeApp({...});
  // const db = firebase.firestore();
  // // Load balances, recent games, etc.
}
