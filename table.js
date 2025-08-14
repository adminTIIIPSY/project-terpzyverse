// Read params
const qs = new URLSearchParams(location.search);
const room = qs.get("room") || "GC_holdem_micro_002005_9p";
const chosenSeat = Number(qs.get("seat") || "0");

document.getElementById("roomName").textContent = room.replaceAll("_"," ");
document.getElementById("roomIdLabel").textContent = room;

// Basic topbar currency reuse
(function(){
  const btn = document.getElementById("balanceDropdown");
  const menu = document.getElementById("balanceMenu");
  btn.addEventListener("click", () => menu.style.display = menu.style.display === "block" ? "none" : "block");
  document.addEventListener("click",(e)=>{ if (!menu.contains(e.target) && e.target!==btn) menu.style.display="none"; });
  Array.from(menu.querySelectorAll("li")).forEach(li=>{
    li.addEventListener("click",()=>{
      const cur = li.getAttribute("data-currency");
      btn.textContent = `${cur} ▾`;
      document.getElementById("activeBalanceAmount").textContent =
        cur==="GC" ? "50.00" : cur==="SC" ? "3.25" : "0.42";
      menu.style.display="none";
    });
  });
  const y = new Date().getFullYear();
  const ym = document.getElementById("year"); if (ym) ym.textContent = y;
})();

// Seats config
const isNineMax = /_9p$/i.test(room);
const MAX = isNineMax ? 9 : 6;
const SEATS = Array.from({length: MAX}, (_, i)=>({
  seat: i+1,
  name: null,
  stack: (Math.floor(Math.random()*80)+20) * 5, // random stack demo
  avatar: `assets/avatars/neon_player${(i%9)+1}.png`
}));

if (chosenSeat >= 1 && chosenSeat <= MAX) {
  const s = SEATS[chosenSeat-1];
  s.name = "You";
  document.getElementById("youSeatLabel").textContent = `Seat ${s.seat}`;
}

// Position seats around an ellipse that roughly matches the SVG felt
function seatPositions(max){
  // Angles arranged so Player 6 is top-center (like spec) and Player 7 is top-right-ish.
  // We'll start from top center and go clockwise.
  const baseAngles9 = [270, 310, 345, 20, 55, 90, 125, 160, 200]; // degrees
  const baseAngles6 = [275, 330, 30, 85, 145, 215];
  const degrees = max===9 ? baseAngles9 : baseAngles6;

  const bounds = document.querySelector(".scene").getBoundingClientRect();
  const cx = bounds.width/2, cy = bounds.height/2 + 20; // table visual center
  const rx = Math.min(bounds.width*0.38, 480);
  const ry = Math.min(bounds.height*0.28, 220);

  return degrees.map(d=>{
    const rad = d * Math.PI / 180;
    return { x: cx + rx * Math.cos(rad), y: cy + ry * Math.sin(rad) };
  });
}

function drawSeats(){
  const layer = document.getElementById("seatsLayer");
  layer.innerHTML = "";

  const pos = seatPositions(MAX);
  SEATS.forEach((p, i)=>{
    const el = document.createElement("div");
    el.className = "seat";
    el.style.left = pos[i].x + "px";
    el.style.top  = pos[i].y + "px";

    const avatarStyle = `style="background-image:url('${p.avatar}');"`;
    const seatHtml = `
      <div class="avatar" ${avatarStyle}></div>
      <div class="name">${p.name || `Seat ${p.seat}`}</div>
      <div class="stack">${p.name ? p.stack + " gc" : ""}</div>
      ${p.name ? "" : `<button class="btn-sit" data-seat="${p.seat}">Seat Empty</button>`}
    `;
    el.innerHTML = seatHtml;
    layer.appendChild(el);
  });

  // Attach sit buttons
  document.querySelectorAll(".btn-sit").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const sNum = Number(btn.getAttribute("data-seat"));
      if (SEATS[sNum-1].name) return;
      // In production: call joinSeat() cloud function then navigate.
      SEATS[sNum-1].name = "You";
      document.getElementById("youSeatLabel").textContent = `Seat ${sNum}`;
      drawSeats();
    });
  });
}

function placeDealerButton(){
  // Dealer on Seat 1 initially (demo)
  const dealer = document.getElementById("dealerBtn");
  const pos = seatPositions(MAX)[0];
  dealer.style.left = (pos.x + 48) + "px"; // offset a bit
  dealer.style.top  = (pos.y - 36) + "px";
}

function placeTimer(){
  // Timer above Player 7 per spec (Player 7 exists only on 9-max; on 6-max use Seat 4)
  const idx = MAX===9 ? 6 : 3;
  const timer = document.getElementById("timer");
  const pos = seatPositions(MAX)[idx];
  timer.style.left = (pos.x) + "px";
  timer.style.top  = (pos.y - 78) + "px";
}

// Simple countdown & conic-fill
let timeLeft = 30;
function tickTimer(){
  const tEl = document.getElementById("timerSec");
  const ring = document.getElementById("timer");
  tEl.textContent = String(timeLeft);
  const pct = ((30 - timeLeft) / 30) * 100;
  ring.style.setProperty("--pct", pct + "%");
  timeLeft--;
  if (timeLeft < 0) timeLeft = 30;
}
setInterval(tickTimer, 1000);

// Controls preview
document.getElementById("foldBtn").addEventListener("click", ()=> alert("FOLD (preview)"));
document.getElementById("callBtn").addEventListener("click", ()=> alert("CALL (preview)"));
document.getElementById("raiseBtn").addEventListener("click", ()=> alert("RAISE (preview)"));
document.querySelectorAll(".chip").forEach(c=>{
  c.addEventListener("click", ()=> alert(`Bet preset ${c.dataset.bet}× pot (preview)`));
});

// Theme switcher
document.getElementById("theme").addEventListener("change", (e)=>{
  const scene = document.getElementById("scene");
  scene.classList.remove("bg-neon","bg-felt","bg-wood");
  scene.classList.add(e.target.value === "felt" ? "bg-felt" : e.target.value === "wood" ? "bg-wood" : "bg-neon");
});

// Resize handler to keep seats aligned on window changes
window.addEventListener("resize", ()=>{ drawSeats(); placeDealerButton(); placeTimer(); });

// Init
drawSeats();
placeDealerButton();
placeTimer();
