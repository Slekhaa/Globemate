// ============ SHARED AUTH UTILITIES (Supabase) ============
const Auth = (() => {
  let supabaseClient = null;
  let currentUser = null;

  // Initialize Supabase client
  function initSupabase() {
    try {
      if (typeof window.supabase === 'undefined') {
        console.error('Supabase library not loaded');
        return false;
      }
      const url = window.SUPABASE_URL || '';
      const key = window.SUPABASE_ANON_KEY || '';
      if (!url || !key) {
        console.error('Supabase credentials not configured');
        return false;
      }
      supabaseClient = window.supabase.createClient(url, key);
      console.log('✅ Supabase initialized');
      return true;
    } catch (e) {
      console.error('Supabase init error:', e);
      return false;
    }
  }

  // Ensure Supabase is ready
  function getClient() {
    if (!supabaseClient) initSupabase();
    return supabaseClient;
  }

  // Check existing session on app load
  async function checkSession() {
    const client = getClient();
    if (!client) return null;
    try {
      const { data: { session } } = await client.auth.getSession();
      if (session) {
        currentUser = session.user;
        applyLoggedInUI();
        return session.user;
      }
      restoreLoggedOutUI();
      return null;
    } catch (e) {
      console.error('Session check error:', e);
      return null;
    }
  }

  // Sign up new user
  async function signUp(name, email, password) {
    const client = getClient();
    if (!client) return { success: false, error: 'Auth service unavailable' };

    try {
      const { data, error } = await client.auth.signUp({
        email,
        password,
        options: { data: { full_name: name } }
      });

      if (error) {
        if (error.status === 429 || error.code === 'over_email_send_rate_limit') {
          throw new Error('Rate limit hit. Disable email confirmation in Supabase or wait a few minutes.');
        }
        throw error;
      }

      if (data.user) {
        currentUser = data.user;
        // Save profile to DB
        await client.from('profiles').insert([{
          id: data.user.id,
          full_name: name,
          email,
          created_at: new Date().toISOString()
        }]).then(({ error: pErr }) => {
          if (pErr) console.warn('Profile insert warning:', pErr.message);
        });
        return { success: true, user: data.user };
      }
      return { success: false, error: 'Sign up failed' };
    } catch (e) {
      console.error('SignUp error:', e);
      return { success: false, error: e.message };
    }
  }

  // Log in existing user
  async function login(email, password) {
    const client = getClient();
    if (!client) return { success: false, error: 'Auth service unavailable' };

    try {
      const { data, error } = await client.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (data.session) {
        currentUser = data.user;
        return { success: true, user: data.user };
      }
      return { success: false, error: 'Login failed' };
    } catch (e) {
      console.error('Login error:', e);
      return { success: false, error: e.message };
    }
  }

  // Logout
  async function logout() {
    const client = getClient();
    if (!client) return;
    try {
      await client.auth.signOut();
      currentUser = null;
      restoreLoggedOutUI();
      showToast('Logged out successfully', 'success');
      if (window.PageLoader) window.PageLoader.loadPage('home');
    } catch (e) {
      console.error('Logout error:', e);
      showToast('Logout failed', 'error');
    }
  }

  // ---- UI helpers when logged in ----

  function applyLoggedInUI() {
    if (!currentUser) return;
    const userName = currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'User';

    // Replace GlobeMate logo text with user name
    const navLogoText = document.querySelector('.nav-logo .logo-text');
    const navLogoLink = document.querySelector('.nav-logo');
    if (navLogoText) {
      navLogoText.innerHTML = userName;
      navLogoText.style.fontWeight = '400';
      navLogoText.style.color = '#111827';
      navLogoText.style.fontFamily = '';
      navLogoText.style.fontSize = '';
    }
    if (navLogoLink) {
      navLogoLink.dataset.authLocked = 'true';
      navLogoLink.addEventListener('click', preventNavLogoClick, true);
    }

    // Hide Home nav item
    const homeLink = document.querySelector('#navLinks a[data-tab="home"]');
    if (homeLink && homeLink.parentElement) {
      homeLink.parentElement.style.display = 'none';
    }

    setNavItemVisibility('trip-planner', true);
    setNavItemVisibility('packing', true);
    setNavItemVisibility('documents', true);

    // Add Logout nav item
    const navLinks = document.getElementById('navLinks');
    if (navLinks && !document.getElementById('logoutNavItem')) {
      const li = document.createElement('li');
      li.id = 'logoutNavItem';
      li.innerHTML = '<a href="#" id="logoutNavLink" class="nav-tab-link"><i class="fas fa-sign-out-alt"></i> Logout</a>';
      navLinks.appendChild(li);
      document.getElementById('logoutNavLink').addEventListener('click', (e) => {
        e.preventDefault();
        logout();
      });
    }

    console.log('✅ Navbar updated — user:', userName);
  }

  function restoreLoggedOutUI() {
    // Restore logo
    const navLogoText = document.querySelector('.nav-logo .logo-text');
    const navLogoLink = document.querySelector('.nav-logo');
    if (navLogoText) {
      navLogoText.innerHTML = '<span class="letter-g">G</span><span class="letter-l">l</span><span class="letter-o">o</span><span class="letter-b">b</span><span class="letter-e1">e</span><span class="letter-m">M</span><span class="letter-a">a</span><span class="letter-t">t</span><span class="letter-e2">e</span>';
      navLogoText.style.fontWeight = '';
      navLogoText.style.color = '';
      navLogoText.style.fontFamily = '';
      navLogoText.style.fontSize = '';
    }
    if (navLogoLink) {
      delete navLogoLink.dataset.authLocked;
      navLogoLink.removeEventListener('click', preventNavLogoClick, true);
    }

    // Show Home nav item
    const homeLink = document.querySelector('#navLinks a[data-tab="home"]');
    if (homeLink && homeLink.parentElement) {
      homeLink.parentElement.style.display = '';
    }

    setNavItemVisibility('trip-planner', false);
    setNavItemVisibility('packing', false);
    setNavItemVisibility('documents', false);

    // Remove logout item
    const logoutLi = document.getElementById('logoutNavItem');
    if (logoutLi) logoutLi.remove();
  }

  function getUserName() {
    if (!currentUser) return null;
    return currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'User';
  }

  function preventNavLogoClick(event) {
    const link = event.currentTarget;
    if (link && link.dataset.authLocked === 'true') {
      event.preventDefault();
      event.stopPropagation();
    }
  }

  function setNavItemVisibility(tabId, isVisible) {
    const link = document.querySelector(`#navLinks a[data-tab="${tabId}"]`);
    if (link && link.parentElement) {
      link.parentElement.style.display = isVisible ? '' : 'none';
    }
  }

  return {
    initSupabase,
    getClient,
    checkSession,
    signUp,
    login,
    logout,
    applyLoggedInUI,
    restoreLoggedOutUI,
    getUserName,
    get currentUser() { return currentUser; },
    get isAuthenticated() { return currentUser !== null; }
  };
})();

// Initialize Supabase immediately on script load
Auth.initSupabase();

// Check for existing session and apply UI on app load
document.addEventListener('DOMContentLoaded', () => {
  Auth.checkSession();
});

window.Auth = Auth;
