// ——— Setup & State ———
const qs = new URLSearchParams(location.search);
const initialMode = (qs.get("mode") || "holdem").toLowerCase(); // holdem | omaha | roe
const initialCurrency = (qs.get("currency") || "GC").toUpperCase(); // GC | SC

const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));

// Topbar currency dropdown reuse
(function wireCurrency(){
  const btn = $("#balanceDropdown");
  const menu = $("#balanceMenu");
  btn.addEventListener("click", () => menu.style.display = menu.style.display === "block" ? "none" : "block");
  document.addEventListener("click",(e)=>{ if (!menu.contains(e.target) && e.target!==btn) menu.style.display="none"; });
  $$("#balanceMenu li").forEach(li=>{
    li.addEventListener("click",()=>{
      const cur = li.getAttribute("data-currency");
      btn.textContent = `${cur} ▾`;
      $("#activeBalanceAmount").textContent = cur==="GC" ? "50.00" : cur==="SC" ? "3.25" : "0.42";
      menu.style.display="none";
    });
  });
  const y = new Date().getFullYear(); $$("#year").forEach(el=>el.textContent=y);
})();

// ——— Data ———
// Stakes pulled from your specs (condensed and labeled)
const STAKES = {
  GC: {
    micro: [
      { blinds:"0.02/0.05", buyin:"1–5" },
      { blinds:"0.05/0.10", buyin:"5–10" },
      { blinds:"0.10/0.20", buyin:"10–20" },
    ],
    medium: [
      { blinds:"0.25/0.50", buyin:"25–50" },
      { blinds:"0.50/1.00", buyin:"50–100" },
      { blinds:"1.00/2.00", buyin:"100–200" },
    ],
    large: [
      { blinds:"2.00/5.00", buyin:"200–500" },
      { blinds:"5.00/10.00", buyin:"500–1000" },
      { blinds:"10.00/20.00", buyin:"1000–2000" },
    ]
  },
  SC: {
    micro: [
      { blinds:"0.02/0.05", buyin:"1–5" },
      { blinds:"0.05/0.10", buyin:"3–6" },
      { blinds:"0.10/0.20", buyin:"5–10" },
    ],
    medium: [
      { blinds:"0.25/0.50", buyin:"25–50" },
      { blinds:"0.50/1.00", buyin:"50–100" },
      { blinds:"1.00/2.00", buyin:"100–300" },
    ],
    large: [
      { blinds:"5.00/10.00", buyin:"500–1000" },
    ]
  }
};

// Generate tables for each stakes bucket
function genTables(currency, mode){
  const cfg = STAKES[currency];
  const out = [];
  const isOmaha = mode === "omaha";
  const supports9 = (mode === "holdem" || mode === "roe"); // Omaha limited to 6-max per your spec

  const buckets = ["micro","medium","large"];
  for (const bucket of buckets){
    (cfg[bucket] || []).forEach((s, i) => {
      // We'll make one 6-max and one 9-max (if allowed) per blind level
      out.push(makeTable(currency, mode, bucket, s, 6, i+1));
      if (supports9) out.push(makeTable(currency, mode, bucket, s, 9, i+1));
    });
  }
  return out;
}

function makeTable(currency, mode, bucket, s, maxPlayers, idx){
  const id = `${currency}_${mode}_${bucket}_${s.blinds.replace(/\./g,'').replace(/\//g,'-')}_${maxPlayers}p`;
  return {
    id,
    name: `${modeName(mode)} ${bucketTitle(bucket)} ${maxPlayers}-max #${idx}`,
    currency,
    mode,
    maxPlayers,
    blinds: s.blinds + (currency==="SC" ? " sc" : " gc"),
    buyin: s.buyin + (currency==="SC" ? " sc" : " gc"),
    players: seedPlayers(maxPlayers), // random fill
  };
}

function modeName(m){
  return m==="holdem" ? "Hold’em" : m==="omaha" ? "Omaha Hi/Lo" : "R.O.E.";
}
function bucketTitle(b){ return b[0].toUpperCase() + b.slice(1); }

// Random seat fill to preview occupancy
function seedPlayers(max){
  const arr = Array.from({length:max}, (_,i)=>({ seat:i+1, name:null }));
  const taken = Math.floor(Math.random()*Math.ceil(max*0.6)); // up to ~60% filled
  for (let i=0;i<taken;i++){
    const open = arr.filter(a=>!a.name);
    const pick = open[Math.floor(Math.random()*open.length)];
    if (pick) pick.name = sampleName();
  }
  return arr;
}
function sampleName(){
  const names = ["AceWolf","NovaCat","LuminaX","TerpzyPro","ChipStack","Glowbit","OrbitRon","CardQueen","Blaze9","StarForge"];
  return names[Math.floor(Math.random()*names.length)];
}

// ——— UI State ———
let state = {
  currency: initialCurrency, // GC | SC
  mode: initialMode,         // holdem | omaha | roe
  stakes: "all",             // micro | medium | large | all
  maxPlayers: "all",         // "6" | "9" | "all"
  search: ""
};

// Seed tables
let TABLES = [
  ...genTables("GC","holdem"),
  ...genTables("GC","omaha"),
  ...genTables("GC","roe"),
  ...genTables("SC","holdem"),
  ...genTables("SC","omaha"),
  ...genTables("SC","roe"),
];

// ——— Rendering ———
function render(){
  const body = $("#tableBody");
  let list = TABLES.filter(t => t.currency===state.currency && t.mode===state.mode);

  if (state.stakes !== "all") {
    list = list.filter(t => t.id.includes(`_${state.stakes}_`));
  }
  if (state.maxPlayers !== "all") {
    list = list.filter(t => String(t.maxPlayers) === state.maxPlayers);
  }
  if (state.search) {
    const q = state.search.toLowerCase();
    list = list.filter(t => (t.name + " " + t.blinds + " " + t.buyin).toLowerCase().includes(q));
  }

  body.innerHTML = list.map(rowHTML).join("");
}

function rowHTML(t){
  const seatsHtml = t.players.map(p => {
    const label = p.name ? `Seat ${p.seat}` : "Seat Empty";
    const cls = "seat " + (p.name ? "taken" : "");
    const action = p.name ? "" : `onclick="joinSeat('${t.id}', ${p.seat})"`;
    return `<button class="${cls}" ${action}>${label}</button>`;
  }).join("");

  return `
    <tr class="row">
      <td><strong>${t.name}</strong></td>
      <td><span class="badge-soft">${t.blinds}</span></td>
      <td><span class="badge-soft">${t.buyin}</span></td>
      <td>${t.maxPlayers}-max</td>
      <td><div class="seats">${seatsHtml}</div></td>
      <td>
        <div class="right">
          <span class="muted">${occupied(t)}/${t.maxPlayers} seated</span>
          <button class="pill" onclick="openTable('${t.id}')">View Table</button>
        </div>
      </td>
    </tr>
  `;
}

function occupied(t){ return t.players.filter(p=>p.name).length; }

// ——— Actions ———
window.joinSeat = function(tableId, seat){
  const t = TABLES.find(x=>x.id===tableId);
  if (!t) return;
  const s = t.players.find(p=>p.seat===seat);
  if (!s || s.name) return;
  // Simulate username (replace with actual user screen name later)
  s.name = "You";
  // Route to shared table page
  const url = `table.html?room=${encodeURIComponent(tableId)}&seat=${seat}`;
  location.href = url;
};

window.openTable = function(tableId){
  const url = `table.html?room=${encodeURIComponent(tableId)}`;
  location.href = url;
};

// ——— Wiring toolbar ———
function setActive(el, on){
  if (!el) return;
  if (on) el.classList.add("active"); else el.classList.remove("active");
}

function syncToolbar(){
  setActive($("#gcBtn"), state.currency==="GC");
  setActive($("#scBtn"), state.currency==="SC");
  setActive($("#holdemBtn"), state.mode==="holdem");
  setActive($("#omahaBtn"), state.mode==="omaha");
  setActive($("#roeBtn"), state.mode==="roe");

  $("#stakesSelect").value = state.stakes;
  $("#maxPlayersSelect").value = state.maxPlayers;
  $("#searchInput").value = state.search;
}

function wireToolbar(){
  $("#gcBtn").onclick = ()=>{ state.currency="GC"; syncToolbar(); render(); };
  $("#scBtn").onclick = ()=>{ state.currency="SC"; syncToolbar(); render(); };

  $("#holdemBtn").onclick = ()=>{ state.mode="holdem"; syncToolbar(); render(); };
  $("#omahaBtn").onclick = ()=>{ state.mode="omaha"; syncToolbar(); render(); };
  $("#roeBtn").onclick = ()=>{ state.mode="roe"; syncToolbar(); render(); };

  $("#stakesSelect").onchange = e=>{ state.stakes=e.target.value; render(); };
  $("#maxPlayersSelect").onchange = e=>{ state.maxPlayers=e.target.value; render(); };
  $("#searchInput").oninput = e=>{ state.search=e.target.value.trim(); render(); };
}

// ——— Init ———
function init(){
  wireToolbar();
  syncToolbar();
  render();
}
init();
