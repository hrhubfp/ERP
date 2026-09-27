// SHARED ERP AUTHENTICATION CORE
// Use this in ALL HTML pages to fix login/redirect issues

window.FP_AUTH_CORE = (() => {
  const WAIT_TIMEOUT = 10000; // 10 seconds
  const SESSION_KEY = "fp_user";
  const REDIRECT_KEY = "fp_redirect";
  
  async function waitAuth() {
    try {
      if (auth.currentUser) return auth.currentUser;
      return new Promise((resolve) => {
        let done = false;
        const finish = () => {
          if (done) return;
          done = true;
          resolve(null);
        };
        const unsubscribe = auth.onAuthStateChanged(() => {
          unsubscribe();
          finish();
        });
        setTimeout(() => {
          try { unsubscribe(); } catch (_) {}
          finish();
        }, WAIT_TIMEOUT);
      });
    } catch (_) {
      return null;
    }
  }

  function getSession() {
    try {
      return JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
    } catch (e) {
      return null;
    }
  }

  function setSession(u) {
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify({
        uid: u.uid,
        email: u.email,
        name: u.name || u.email,
        role: u.role,
        roles: u.roles || [u.role],
        authUid: u.authUid || ""
      }));
    } catch (e) {}
  }

  async function logout() {
    try { await auth.signOut(); } catch (_) {}
    try {
      localStorage.removeItem(SESSION_KEY);
      localStorage.removeItem(REDIRECT_KEY);
    } catch (_) {}
    location.replace("index.html");
  }

  function showLogin() {
    const loginScreen = document.getElementById("loginScreen");
    if (loginScreen) {
      loginScreen.classList.remove("hidden");
    }
    const app = document.getElementById("app");
    if (app) {
      app.style.display = "none";
    }
  }

  function hideLogin() {
    const loginScreen = document.getElementById("loginScreen");
    if (loginScreen) {
      loginScreen.classList.add("hidden");
    }
    const app = document.getElementById("app");
    if (app) {
      app.style.display = "block";
    }
  }

  async function checkAuth(PAGE) {
    // Called on page load - checks if user is authenticated
    const PAGE_NAME = PAGE || (document.body.dataset.page || "dashboard");
    
    await waitAuth();
    
    let session = getSession();
    if (!session) {
      const authUser = auth.currentUser;
      if (authUser) {
        try {
          const q = await db.collection("users").where("email", "==", authUser.email).limit(1).get();
          if (!q.empty) {
            const d = q.docs[0];
            const data = d.data();
            session = {
              uid: d.id,
              email: data.email,
              name: data.name || data.email,
              role: data.role,
              roles: data.roles || [data.role],
              authUid: data.authUid || ""
            };
            setSession(session);
          }
        } catch (_) {}
      }
    }

    if (!session) {
      // NO SESSION: Show login
      showLogin();
      return false;
    }

    // HAS SESSION: Hide login & continue
    hideLogin();
    return true;
  }

  return {
    waitAuth,
    getSession,
    setSession,
    logout,
    showLogin,
    hideLogin,
    checkAuth
  };
})();
