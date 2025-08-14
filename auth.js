<!-- auth.js -->
<script>
/**
 * Minimal client-side auth (localStorage) with a modal.
 * - Shows Sign in / Sign up modal on page load if not logged in
 * - Gates clicks on [data-requires-auth] elements
 * - Exposes: Auth.current(), Auth.require(cb), Auth.logout()
 */

(function(){
  const LS_AUTH = "authUser";     // { email, screenName, avatar }
  const LS_PROFILE = "userProfile"; // legacy key we already used for avatar/screenName
  const DEFAULT_AVATAR = "assets/avatars/neon_player1.png";

  const Auth = {
    current(){
      try { return JSON.parse(localStorage.getItem(LS_AUTH)) || null; }
      catch { return null; }
    },
    save(user){
      localStorage.setItem(LS_AUTH, JSON.stringify(user));
      // Keep profile in sync (so profile.js keeps working)
      const p = Auth.profile();
      p.screenName = user.screenName || p.screenName || "Player";
      p.avatar = user.avatar || p.avatar || DEFAULT_AVATAR;
      localStorage.setItem(LS_PROFILE, JSON.stringify(p));
    },
    profile(){
      try { return JSON.parse(localStorage.getItem(LS_PROFILE)) || {
        screenName: "Player",
        avatar: DEFAULT_AVATAR,
        ownedAvatars: [DEFAULT_AVATAR],
        tokens: { nameChange: 1 }
      }; } catch { return { screenName:"Player", avatar:DEFAULT_AVATAR, ownedAvatars:[DEFAULT_AVATAR], tokens:{nameChange:1} }; }
    },
    logout(){
      localStorage.removeItem(LS_AUTH);
      // keep avatars, but you can also clear LS_PROFILE if you want a hard reset
      location.reload();
    },
    require(cb){
      const u = Auth.current();
      if (u) return cb && cb(u);
      showAuthModal();
    }
  };

  // Expose globally
  window.Auth = Auth;

  // ------- Modal UI -------
  function injectStyles(){
    if (document.getElementById("auth-style")) return;
    const css = `
      .auth-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;z-index:9999}
      .auth-card{width:min(420px,92%);background:var(--panel,#171a28);border:1px solid rgba(255,255,255,.08);border-radius:16px;box-shadow:0 20px 60px rgba(0,0,0,.5);padding:18px}
      .auth-card h2{margin:0 0 10px}
      .auth-row{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}
      .auth-input{flex:1;min-width:180px;background:#1e2234;border:1px solid rgba(255,255,255,.08);color:#fff;border-radius:10px;padding:10px 12px}
      .auth-btn{padding:10px 14px;border-radius:10px;border:1px solid rgba(255,255,255,.12);background:#2a2f4a;color:#fff;cursor:pointer}
      .auth-actions{display:flex;gap:8px;justify-content:flex-end;margin-top:12px}
      .auth-muted{color:var(--muted,#9aa0b5);font-size:12px;margin-top:8px}
      .auth-close{all:unset;float:right;cursor:pointer;color:#fff;opacity:.6}
      .auth-close:hover{opacity:1}
      .auth-error{color:#ff7a7a;font-size:12px;margin-top:6px;min-height:16px}
    `;
    const style = document.createElement("style");
    style.id = "auth-style";
    style.textContent = css;
    document.head.appendChild(style);
  }

  function showAuthModal(){
    if (document.getElementById("auth-modal")) return; // already visible
    injectStyles();

    const el = document.createElement("div");
    el.id = "auth-modal";
    el.className = "auth-backdrop";
    el.innerHTML = `
      <div class="auth-card">
        <button class="auth-close" id="authClose">✕</button>
        <h2>Welcome to ClubSocial</h2>
        <div class="auth-muted">Sign up or sign in to continue.</div>
        <div class="auth-row">
          <input class="auth-input" id="authEmail" type="email" placeholder="Email">
          <input class="auth-input" id="authName"  type="text"  placeholder="Screen name">
        </div>
        <div class="auth-error" id="authError"></div>
        <div class="auth-actions">
          <button class="auth-btn" id="authSignin">Sign in</button>
          <button class="auth-btn" id="authSignup">Sign up</button>
        </div>
        <div class="auth-muted">By continuing you agree to our Terms.</div>
      </div>
    `;
    document.body.appendChild(el);

    const close = () => { el.remove(); };

    document.getElementById("authClose").onclick = close;

    function submit(mode){
      const email = (document.getElementById("authEmail").value || "").trim();
      const name  = (document.getElementById("authName").value  || "").trim() || "Player";
      const errEl = document.getElementById("authError");
      errEl.textContent = "";

      // super simple validation
      if (!email || !/^[^@]+@[^@]+\.[^@]+$/.test(email)) {
        errEl.textContent = "Please enter a valid email.";
        return;
      }

      // In a real app, call your backend/Firebase here.
      const user = { email, screenName: name, avatar: Auth.profile().avatar };
      Auth.save(user);
      // Update header avatar/screen name if present
      applyHeaderIdentity();
      close();
    }

    document.getElementById("authSignin").onclick = ()=>submit("signin");
    document.getElementById("authSignup").onclick = ()=>submit("signup");
  }

  // ------- Header identity helpers -------
  function applyHeaderIdentity(){
    const u = Auth.current();
    const p = Auth.profile();
    const av = document.getElementById("headerAvatar");
    if (av) av.style.backgroundImage = `url('${(p && p.avatar) || DEFAULT_AVATAR}')`;
    const sn = document.getElementById("screenName");
    if (sn) sn.textContent = (u && u.screenName) || (p && p.screenName) || "Player";
    const yr = document.getElementById("year");
    if (yr) yr.textContent = new Date().getFullYear();
  }
  window.applyHeaderIdentity = applyHeaderIdentity;

  // ------- Gate clicks on elements requiring auth -------
  function installClickGate(){
    document.addEventListener("click", (e)=>{
      const t = e.target.closest("[data-requires-auth]");
      if (!t) return;
      if (!Auth.current()){
        e.preventDefault();
        showAuthModal();
      }
    });
  }

  // ------- Boot -------
  document.addEventListener("DOMContentLoaded", ()=>{
    applyHeaderIdentity();
    installClickGate();

    // Show auth modal on page load if not logged in:
    if (!Auth.current()){
      showAuthModal();
    }
  });
})();
</script>
