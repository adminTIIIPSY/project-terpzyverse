<script>
// Simple profile page controller; relies on Auth from auth.js
(function(){
  if (!window.Auth) { console.error("auth.js required"); return; }

  // If not logged in, prompt immediately
  if (!Auth.current()){ Auth.require(()=>location.reload()); }

  const DEFAULTS = {
    avatars: [
      "assets/avatars/neon_player1.png",
      "assets/avatars/neon_player2.png",
      "assets/avatars/neon_player3.png",
      "assets/avatars/neon_player4.png",
      "assets/avatars/neon_player5.png",
      "assets/avatars/neon_player6.png"
    ]
  };

  function prof(){ return Auth.profile(); }
  function saveProf(p){ localStorage.setItem("userProfile", JSON.stringify(p)); }

  function refreshHeader(){
    applyHeaderIdentity && applyHeaderIdentity();
  }

  function render(){
    const p = prof();
    document.getElementById("profileAvatar").style.backgroundImage = `url('${p.avatar}')`;
    document.getElementById("nameInput").value = p.screenName || "Player";
    const hint = document.getElementById("nameHint");
    const tokens = p.tokens?.nameChange ?? 1;
    hint.textContent = `Name-change tokens: ${tokens}`;
    // footer year
    const yr = document.getElementById("year"); if (yr) yr.textContent = new Date().getFullYear();

    // avatars grid
    const grid = document.getElementById("avatarGrid");
    grid.innerHTML = "";
    const catalog = Array.from(new Set([...(p.ownedAvatars||[]), ...DEFAULTS.avatars]));
    catalog.forEach(src=>{
      const owned = (p.ownedAvatars||[]).includes(src) || DEFAULTS.avatars.includes(src);
      const tile = document.createElement("div");
      tile.className = "card";
      tile.style.padding = "12px";
      tile.innerHTML = `
        <div class="avatar" style="width:96px;height:96px;margin:8px auto;background-image:url('${src}');"></div>
        <div class="meta" style="text-align:center">
          <div class="muted">${owned ? "Owned" : "Locked"}</div>
          <button class="pill" ${p.avatar===src?"disabled":""} data-src="${src}" style="margin-top:8px">${owned ? (p.avatar===src?"Equipped":"Equip") : "Buy (demo)"}</button>
        </div>
      `;
      const btn = tile.querySelector("button");
      btn.addEventListener("click", ()=>{
        if (owned){
          p.avatar = src;
          saveProf(p);
          refreshHeader();
          render();
        } else {
          // demo purchase unlock
          p.ownedAvatars = Array.from(new Set([...(p.ownedAvatars||[]), src]));
          saveProf(p);
          render();
        }
      });
      grid.appendChild(tile);
    });
  }

  document.getElementById("saveNameBtn").addEventListener("click", ()=>{
    const p = prof();
    const v = (document.getElementById("nameInput").value || "").trim();
    if (!v) return alert("Enter a name.");
    // consume token only if changing from an existing name
    if (p.screenName && p.screenName !== v){
      const tokens = p.tokens?.nameChange ?? 0;
      if (tokens <= 0) return alert("You need a name-change token.");
      p.tokens.nameChange = tokens - 1;
    }
    p.screenName = v;
    saveProf(p);
    // sync into auth record
    const u = Auth.current(); if (u){ u.screenName = v; Auth.save(u); }
    refreshHeader();
    render();
    alert("Saved!");
  });

  document.getElementById("logoutBtn").addEventListener("click", ()=>{
    Auth.logout();
  });

  // initial
  refreshHeader();
  render();
})();
</script>
