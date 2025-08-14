// Minimal shared data for the Casino grid + Continue section
const GAMES = [
  { id:"pragmatic_gateofolympus", name:"Gates of Olympus", provider:"Pragmatic", rtp:96.3, volatility:"High", tags:["Bonus Buy","Megaways"], thumb:"/assets/slots/pragmatic/gates-olympus.jpg", featured:true },
  { id:"hacksaw_chaoscrew", name:"Chaos Crew", provider:"Hacksaw", rtp:96.3, volatility:"High", tags:["Bonus Buy"], thumb:"/assets/slots/hacksaw/chaos-crew.jpg", featured:true },
  { id:"3oaks_goldtiger", name:"Gold Tiger", provider:"3 Oaks", rtp:96.2, volatility:"Medium", tags:["Hold&Spin"], thumb:"/assets/slots/3oaks/gold-tiger.jpg", featured:true },
  { id:"bgaming_elvisfrog", name:"Elvis Frog", provider:"BGaming", rtp:96.0, volatility:"Medium", tags:["Bonus Buy"], thumb:"/assets/slots/bgaming/elvis-frog.jpg" },
  { id:"relax_moneytrain2", name:"Money Train 2", provider:"Relax", rtp:96.4, volatility:"High", tags:["Bonus Buy"], thumb:"/assets/slots/relax/money-train-2.jpg" },
  { id:"pragmatic_dochouse", name:"Dog House", provider:"Pragmatic", rtp:96.5, volatility:"Medium", tags:[], thumb:"/assets/slots/pragmatic/dog-house.jpg" },
];

const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));

function money(n){ return Number(n).toFixed(2); }
function setYear(){ const y = new Date().getFullYear(); $$("#year").forEach(el=>el.textContent=y); if ($("#year")) $("#year").textContent = y; }
setYear();

// Currency dropdown behavior (copied)
(function wireCurrency(){
  const btn = $("#balanceDropdown");
  const menu = $("#balanceMenu");
  if (!btn || !menu) return;
  btn.addEventListener("click", () => {
    menu.style.display = menu.style.display === "block" ? "none" : "block";
  });
  document.addEventListener("click",(e)=>{
    if (!menu.contains(e.target) && e.target!==btn) menu.style.display="none";
  });
  $$("#balanceMenu li").forEach(li=>{
    li.addEventListener("click",()=>{
      const cur = li.getAttribute("data-currency");
      btn.textContent = `${cur} ▾`;
      $("#activeBalanceAmount").textContent = cur==="GC" ? "50.00" : cur==="SC" ? "3.25" : "0.42";
      menu.style.display="none";
    });
  });
})();

function cardHTML(g){
  return `
    <article class="card" data-id="${g.id}">
      <span class="badge">${g.provider}</span>
      <img src="${g.thumb}" alt="${g.name}">
      <div class="meta">
        <div class="name">${g.name}</div>
        <div class="tag">${g.tags[0] || g.volatility}</div>
      </div>
    </article>
  `;
}

// CASINO page widgets
function renderFeaturedRow(){
  const row = $("#featRow"); if (!row) return;
  const featured = GAMES.filter(g=>g.featured).slice(0,12);
  row.innerHTML = featured.map(cardHTML).join("");
  $$(".nav-btn").forEach(b=>{
    b.addEventListener("click",()=> {
      const el = document.getElementById(b.dataset.target);
      const delta = b.dataset.dir === "left" ? -320 : 320;
      el.scrollBy({left:delta, behavior:"smooth"});
    });
  });
}

let gridPage = 1, pageSize = 18, search="", sort="popular", tag="";
function applyFilters(){
  let list = [...GAMES];
  if (search) list = list.filter(g => g.name.toLowerCase().includes(search.toLowerCase()));
  if (tag) list = list.filter(g => g.tags.includes(tag));
  switch(sort){
    case "popular": list.sort((a,b)=>a.id.localeCompare(b.id)); break;
    case "new": list.sort((a,b)=>b.id.localeCompare(a.id)); break;
    case "rtp": list.sort((a,b)=>b.rtp - a.rtp); break;
    case "volatility": list.sort((a,b)=>a.volatility.localeCompare(b.volatility)); break;
  }
  return list;
}
function renderGrid(reset=false){
  const grid = $("#grid"); if (!grid) return;
  if (reset) { gridPage = 1; grid.innerHTML=""; }
  const list = applyFilters();
  const slice = list.slice(0, gridPage * pageSize);
  grid.innerHTML = slice.map(cardHTML).join("");
  const more = $("#loadMore"); if (more) more.style.display = slice.length < list.length ? "inline-flex" : "none";
}

// Continue row for Poker page
function getContinue(){
  try { return JSON.parse(localStorage.getItem("continueGames")||"[]"); } catch { return []; }
}
function renderContinue(){
  const row = $("#continueRow"); if (!row) return;
  const ids = getContinue();
  const items = ids.map(id => GAMES.find(g=>g.id===id)).filter(Boolean);
  row.innerHTML = items.length ? items.map(cardHTML).join("") : `<div class="muted">No recent games yet.</div>`;
}

function openGame(id){
  const g = GAMES.find(x=>x.id===id);
  if (!g) return;
  const url = `/play.html?provider=${encodeURIComponent(g.provider)}&game=${encodeURIComponent(g.id)}`;
  const list = getContinue(); localStorage.setItem("continueGames", JSON.stringify([g.id, ...list.filter(x=>x!==g.id)].slice(0,5)));
  location.href = url;
}

function initCasino(){
  renderFeaturedRow();
  renderGrid(true);
  const s = $("#searchInput"), so=$("#sortSelect"), t=$("#tagSelect");
  if (s) s.addEventListener("input", e=>{ search=e.target.value.trim(); renderGrid(true); });
  if (so) so.addEventListener("change", e=>{ sort=e.target.value; renderGrid(true); });
  if (t) t.addEventListener("change", e=>{ tag=e.target.value; renderGrid(true); });
  const more=$("#loadMore"); if (more) more.addEventListener("click", ()=>{ gridPage++; renderGrid(false); });
}

function initPoker(){
  renderContinue();
}

function initCrash(){
  // tiny animated line to make the preview feel alive
  const c = document.getElementById("crashChart");
  if (!c) return;
  const ctx = c.getContext("2d");
  let x=0, y=c.height-10, growing=true, crashed=false, t=0;

  function step(){
    ctx.clearRect(0,0,c.width,c.height);
    ctx.beginPath(); ctx.moveTo(0, c.height-10);
    const speed = 2;
    x += speed;
    if (!crashed){
      const amp = 60; const freq = 0.02;
      y = c.height - 10 - Math.log(1 + t*0.06)*40 - Math.sin(t*freq)*amp*0.2;
      t += 1;
      // random crash
      if (Math.random() < 0.003 || x >= c.width-10){ crashed = true; }
    } else {
      y = c.height - 10;
    }
    ctx.lineTo(x,y);
    ctx.strokeStyle = crashed ? "#ff6262" : "#15e1a7";
    ctx.lineWidth = 3; ctx.stroke();
    if (x < c.width-2) requestAnimationFrame(step);
  }
  step();

  const bet = document.getElementById("bet");
  const auto = document.getElementById("auto");
  const place = document.getElementById("placeBet");
  const cash = document.getElementById("cashOut");
  if (place) place.onclick = ()=>alert(`Bet placed: ${bet.value} · Auto cashout ${auto.value}x (preview)`);
  if (cash) cash.onclick = ()=>alert(`Cashed out (preview)`);
}

// Click any card to open play
document.addEventListener("click", e=>{
  const card = e.target.closest(".card");
  if (card) openGame(card.getAttribute("data-id"));
});

// Init per page
(function(){
  if (window.CATEGORY === "CASINO") initCasino();
  if (window.CATEGORY === "POKER") initPoker();
  if (window.CATEGORY === "CRASH") initCrash();
})();
