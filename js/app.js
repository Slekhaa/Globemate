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

// Debounce function for search inputs
function debounce(func, wait = 300) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Throttle function for scroll events
function throttle(func, limit = 100) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Copy to clipboard
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    showToast('Copied to clipboard!', 'success');
    return true;
  } catch (err) {
    console.error('Copy failed:', err);
    showToast('Failed to copy', 'error');
    return false;
  }
}

// Form validation helpers
const FormValidation = {
  isEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  },

  isPhoneNumber(phone) {
    const re = /^[\d\s\-\+\(\)]+$/;
    return phone.length >= 10 && re.test(phone);
  },

  isStrongPassword(password) {
    // At least 8 chars, 1 uppercase, 1 lowercase, 1 number
    return password.length >= 8 &&
           /[A-Z]/.test(password) &&
           /[a-z]/.test(password) &&
           /[0-9]/.test(password);
  },

  isEmpty(value) {
    return !value || value.trim() === '';
  },

  showFieldError(input, message) {
    input.classList.add('error');
    let errorEl = input.parentElement.querySelector('.field-error');
    if (!errorEl) {
      errorEl = document.createElement('span');
      errorEl.className = 'field-error';
      input.parentElement.appendChild(errorEl);
    }
    errorEl.textContent = message;
  },

  clearFieldError(input) {
    input.classList.remove('error');
    const errorEl = input.parentElement.querySelector('.field-error');
    if (errorEl) errorEl.remove();
  }
};

// API fetch wrapper with error handling
async function fetchAPI(url, options = {}) {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API fetch error:', error);
    showToast(`Failed to fetch data: ${error.message}`, 'error');
    throw error;
  }
}

// Random ID generator
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Slugify string (for URLs)
function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

// Truncate text with ellipsis
function truncate(text, maxLength = 100) {
  if (text.length <= maxLength) return text;
  return text.substr(0, maxLength) + '...';
}

// Get query parameter from URL
function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

// Set document title
function setPageTitle(title) {
  document.title = `${title} — GlobeMate`;
}

// Check if mobile device
function isMobile() {
  return window.innerWidth <= 768;
}

// Scroll to element
function scrollToElement(selector, offset = 0) {
  const element = $(selector);
  if (!element) return;

  const y = element.getBoundingClientRect().top + window.pageYOffset - offset;
  window.scrollTo({ top: y, behavior: 'smooth' });
}

// Expose utilities globally
window.AppUtils = {
  $,
  $$,
  showToast,
  saveToLocal,
  loadFromLocal,
  formatDate,
  formatNumber,
  debounce,
  throttle,
  copyToClipboard,
  FormValidation,
  fetchAPI,
  generateId,
  slugify,
  truncate,
  getQueryParam,
  setPageTitle,
  isMobile,
  scrollToElement
};

// Also expose individual functions for modules
window.$ = $;
window.$$ = $$;
window.showToast = showToast;
window.saveToLocal = saveToLocal;
window.loadFromLocal = loadFromLocal;
window.formatDate = formatDate;
window.formatNumber = formatNumber;
window.debounce = debounce;
window.throttle = throttle;
window.copyToClipboard = copyToClipboard;
window.FormValidation = FormValidation;
window.fetchAPI = fetchAPI;
window.generateId = generateId;

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

  let lastScrollY = 0;
  const handleScroll = (event) => {
    const target = event && event.target instanceof Element ? event.target : null;
    const isPageSection = target && target.classList.contains('section') && target.classList.contains('tab-section');
    const currentScrollY = isPageSection ? target.scrollTop : window.scrollY;
    const isHeroPage = document.body.classList.contains('hero-page');
    const isMenuOpen = navLinks && navLinks.classList.contains('show');

    if (isHeroPage) {
      navbar.classList.remove('scrolled');
      navbar.style.background = 'transparent';
      navbar.style.boxShadow = 'none';
      console.log('🔒 Keeping navbar transparent (hero page)');
    } else {
      navbar.classList.toggle('scrolled', currentScrollY > 50);
      navbar.style.background = '';
      navbar.style.boxShadow = '';
    }

    if (!isMenuOpen && currentScrollY > 80 && currentScrollY > lastScrollY) {
      navbar.classList.add('nav-hidden');
    } else {
      navbar.classList.remove('nav-hidden');
    }

    lastScrollY = currentScrollY <= 0 ? 0 : currentScrollY;
  };

  // Scroll effect on navbar
  window.addEventListener('scroll', throttle(handleScroll, 100));
  document.addEventListener('scroll', throttle(handleScroll, 100), true);

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
