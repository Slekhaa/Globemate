// ============ ENHANCED ANIMATIONS & INTERACTIONS ============
(function () {
  'use strict';

  const Animations = {
    init() {
      console.log('🎬 Animation engine loading...');
      this.setupScrollAnimations();
      this.setupParallaxEffects();
      this.setupNumberCounters();
      this.setupCardAnimations();
      this.setupButtonEffects();
      this.setupTooltips();
      this.setupSmoothScroll();
      this.setupLoadingStates();
      console.log('✅ Animations ready');
    },

    // ---- Scroll-triggered animations ----
    setupScrollAnimations() {
      const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
      };

      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
          }
        });
      }, observerOptions);

      // Observe elements with animate-on-scroll class
      const animateElements = document.querySelectorAll('.animate-on-scroll');
      animateElements.forEach(el => observer.observe(el));

      // Auto-add class to common elements
      setTimeout(() => {
        document.querySelectorAll('.card, .stat-item, .feature-card').forEach(el => {
          if (!el.classList.contains('animate-on-scroll')) {
            el.classList.add('animate-on-scroll');
            observer.observe(el);
          }
        });
      }, 500);
    },

    // ---- Parallax scrolling effect ----
    setupParallaxEffects() {
      const parallaxElements = document.querySelectorAll('.parallax-element');
      if (parallaxElements.length === 0) return;

      window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        parallaxElements.forEach(el => {
          const speed = el.dataset.speed || 0.5;
          el.style.transform = `translateY(${scrolled * speed}px)`;
        });
      });
    },

    // ---- Animated number counters ----
    setupNumberCounters() {
      const counterElements = document.querySelectorAll('.stat-number');
      const hasAnimated = new Set();

      const animateCounter = (element) => {
        if (hasAnimated.has(element)) return;
        hasAnimated.add(element);

        const target = parseInt(element.textContent.replace(/[^0-9]/g, ''));
        const duration = 2000;
        const increment = target / (duration / 16);
        let current = 0;

        const updateCounter = () => {
          current += increment;
          if (current < target) {
            element.textContent = Math.floor(current) + '+';
            requestAnimationFrame(updateCounter);
          } else {
            element.textContent = target + '+';
          }
        };

        updateCounter();
      };

      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            animateCounter(entry.target);
          }
        });
      }, { threshold: 0.5 });

      counterElements.forEach(el => observer.observe(el));
    },

    // ---- Card hover effects ----
    setupCardAnimations() {
      document.addEventListener('mouseover', (e) => {
        const card = e.target.closest('.card, .feature-card, .country-card');
        if (card) {
          card.style.transform = 'translateY(-8px) scale(1.02)';
          card.style.boxShadow = '0 20px 50px rgba(0, 0, 0, 0.15)';
          card.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        }
      });

      document.addEventListener('mouseout', (e) => {
        const card = e.target.closest('.card, .feature-card, .country-card');
        if (card) {
          card.style.transform = '';
          card.style.boxShadow = '';
        }
      });
    },

    // ---- Enhanced button interactions ----
    setupButtonEffects() {
      document.addEventListener('click', (e) => {
        const btn = e.target.closest('.btn, button[type="submit"]');
        if (!btn) return;

        // Ripple effect
        const ripple = document.createElement('span');
        ripple.classList.add('ripple-effect');
        const rect = btn.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = e.clientX - rect.left - size / 2 + 'px';
        ripple.style.top = e.clientY - rect.top - size / 2 + 'px';
        btn.appendChild(ripple);

        setTimeout(() => ripple.remove(), 600);

        // Scale effect
        btn.style.transform = 'scale(0.95)';
        setTimeout(() => { btn.style.transform = ''; }, 150);
      });
    },

    // ---- Tooltips ----
    setupTooltips() {
      const tooltipElements = document.querySelectorAll('[data-tooltip]');
      
      tooltipElements.forEach(el => {
        el.addEventListener('mouseenter', (e) => {
          const tooltip = document.createElement('div');
          tooltip.className = 'custom-tooltip';
          tooltip.textContent = el.dataset.tooltip;
          document.body.appendChild(tooltip);

          const rect = el.getBoundingClientRect();
          tooltip.style.left = rect.left + rect.width / 2 - tooltip.offsetWidth / 2 + 'px';
          tooltip.style.top = rect.top - tooltip.offsetHeight - 10 + 'px';
          tooltip.style.opacity = '1';

          el.addEventListener('mouseleave', () => {
            tooltip.style.opacity = '0';
            setTimeout(() => tooltip.remove(), 300);
          }, { once: true });
        });
      });
    },

    // ---- Smooth scroll for anchor links ----
    setupSmoothScroll() {
      document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
          const href = this.getAttribute('href');
          if (href === '#' || !href) return;
          
          e.preventDefault();
          const target = document.querySelector(href);
          if (target) {
            target.scrollIntoView({
              behavior: 'smooth',
              block: 'start'
            });
          }
        });
      });
    },

    // ---- Loading skeleton screens ----
    createSkeleton(container, type = 'card') {
      const skeleton = document.createElement('div');
      skeleton.className = 'skeleton-loader';

      if (type === 'card') {
        skeleton.innerHTML = `
          <div class="skeleton-image"></div>
          <div class="skeleton-text skeleton-text-lg"></div>
          <div class="skeleton-text"></div>
          <div class="skeleton-text skeleton-text-sm"></div>
        `;
      } else if (type === 'list') {
        for (let i = 0; i < 5; i++) {
          skeleton.innerHTML += '<div class="skeleton-text"></div>';
        }
      }

      container.appendChild(skeleton);
      return skeleton;
    },

    removeSkeleton(skeleton) {
      if (skeleton) {
        skeleton.style.opacity = '0';
        setTimeout(() => skeleton.remove(), 300);
      }
    },

    // ---- Loading states for buttons ----
    setupLoadingStates() {
      // Already handled in individual modules, but add global helper
      window.setButtonLoading = (button, loading, originalText) => {
        if (loading) {
          button.dataset.originalText = originalText || button.innerHTML;
          button.disabled = true;
          button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
          button.classList.add('loading');
        } else {
          button.disabled = false;
          button.innerHTML = button.dataset.originalText || originalText;
          button.classList.remove('loading');
        }
      };
    },

    // ---- Stagger animations for lists ----
    staggerAnimation(elements, delay = 100) {
      elements.forEach((el, index) => {
        setTimeout(() => {
          el.style.opacity = '0';
          el.style.transform = 'translateY(20px)';
          requestAnimationFrame(() => {
            el.style.transition = 'all 0.5s ease';
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
          });
        }, index * delay);
      });
    },

    // ---- Progress bar ----
    createProgressBar(container) {
      const progress = document.createElement('div');
      progress.className = 'progress-bar-container';
      progress.innerHTML = '<div class="progress-bar-fill"></div>';
      container.appendChild(progress);
      return progress.querySelector('.progress-bar-fill');
    },

    updateProgress(bar, percent) {
      if (bar) {
        bar.style.width = Math.min(100, Math.max(0, percent)) + '%';
      }
    },

    // ---- Confetti effect (for celebrations) ----
    confetti() {
      const colors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];
      const confettiCount = 50;

      for (let i = 0; i < confettiCount; i++) {
        const confettiPiece = document.createElement('div');
        confettiPiece.className = 'confetti-piece';
        confettiPiece.style.left = Math.random() * 100 + 'vw';
        confettiPiece.style.animationDelay = Math.random() * 3 + 's';
        confettiPiece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        document.body.appendChild(confettiPiece);

        setTimeout(() => confettiPiece.remove(), 5000);
      }
    },

    // ---- Typing effect ----
    typeWriter(element, text, speed = 50) {
      let i = 0;
      element.textContent = '';
      
      const type = () => {
        if (i < text.length) {
          element.textContent += text.charAt(i);
          i++;
          setTimeout(type, speed);
        }
      };
      
      type();
    }
  };

  // Initialize on DOM load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Animations.init());
  } else {
    Animations.init();
  }

  // Re-initialize on page changes (for SPA)
  if (window.PageLoader) {
    const originalLoadPage = window.PageLoader.loadPage;
    window.PageLoader.loadPage = function(...args) {
      originalLoadPage.apply(this, args);
      setTimeout(() => {
        Animations.setupScrollAnimations();
        Animations.setupNumberCounters();
        Animations.setupCardAnimations();
      }, 500);
    };
  }

  // Expose globally
  window.Animations = Animations;
})();
