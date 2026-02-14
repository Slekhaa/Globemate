/* ========================================
   GlobeMate — Core Application
   ======================================== */

// ============ UTILITIES ============
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

function showToast(message, type = 'success') {
  const container = $('#toastContainer');
  if (!container) return;
  
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  const icons = { 
    success: 'check-circle', 
    error: 'exclamation-circle', 
    warning: 'exclamation-triangle' 
  };
  toast.innerHTML = `<i class="fas fa-${icons[type] || icons.success}"></i> ${message}`;
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.classList.add('removing');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

function saveToLocal(key, data) {
  localStorage.setItem(`globemate_${key}`, JSON.stringify(data));
}

function loadFromLocal(key) {
  const data = localStorage.getItem(`globemate_${key}`);
  return data ? JSON.parse(data) : null;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
}

function formatNumber(num) {
  return new Intl.NumberFormat().format(num);
}

// Expose utilities globally
window.AppUtils = {
  $,
  $$,
  showToast,
  saveToLocal,
  loadFromLocal,
  formatDate,
  formatNumber
};

// Also expose individual functions for modules
window.$ = $;
window.$$ = $$;
window.showToast = showToast;
window.saveToLocal = saveToLocal;
window.loadFromLocal = loadFromLocal;
window.formatDate = formatDate;
window.formatNumber = formatNumber;

// ============ SPLASH SCREEN ============
class SplashScreen {
  constructor(onComplete) {
    this.onComplete = onComplete || (() => {});
    this.el = null;
  }

  init() {
    this.el = document.getElementById('splashScreen');
    if (!this.el) return;
    
    this.startTransition();
  }

  startTransition() {
    // Wait for 2.5 seconds, then fade out
    setTimeout(() => {
      this.fadeOut();
    }, 2500);
  }

  fadeOut() {
    if (!this.el) return;
    
    this.el.classList.add('fade-out');
    
    // Once fade out completes, show main app
    setTimeout(() => {
      this.el.style.display = 'none';
      const mainApp = document.getElementById('mainApp');
      if (mainApp) {
        mainApp.classList.add('visible');
      }
      
      // Trigger callback
      this.onComplete();
    }, 800);
  }
}

// ============ NAVBAR SCROLL EFFECT ============
function initNavbar() {
  const navbar = $('#navbar');
  const navToggle = $('#navToggle');
  const navLinks = $('#navLinks');

  if (!navbar) return;

  // Scroll effect on navbar
  window.addEventListener('scroll', () => {
    // Don't change navbar on hero-style pages
    const isHeroPage = document.body.classList.contains('hero-page');
    if (isHeroPage) {
      navbar.classList.remove('scrolled');
      navbar.style.background = 'transparent';
      navbar.style.boxShadow = 'none';
      console.log('🔒 Keeping navbar transparent (hero page)');
    } else {
      navbar.classList.toggle('scrolled', window.scrollY > 50);
      navbar.style.background = '';
      navbar.style.boxShadow = '';
    }
  });

  // Mobile menu toggle
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      navLinks.classList.toggle('show');
    });

    // Close mobile menu when clicking nav links
    navLinks.addEventListener('click', (e) => {
      if (e.target.closest('.nav-tab-link')) {
        navLinks.classList.remove('show');
      }
    });
  }
}

// ============ APP INITIALIZATION ============
const App = {
  splash: null,

  init() {
    // Initialize splash screen
    this.splash = new SplashScreen(() => {
      this.onSplashComplete();
    });
    this.splash.init();
  },

  onSplashComplete() {
    // Initialize navbar effects
    initNavbar();
    
    // Initialize PageLoader to load first page
    if (typeof PageLoader !== 'undefined') {
      PageLoader.init();
    } else {
      console.error('PageLoader not found!');
    }
  }
};

// Start the app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => App.init());
} else {
  App.init();
}

// Expose App globally for debugging
window.GlobeMateApp = App;
