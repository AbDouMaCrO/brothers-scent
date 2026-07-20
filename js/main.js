// Hero slider
const slides = document.querySelectorAll('.hero-slide');
const dots = document.querySelectorAll('.hero-dot');
let current = 0;
let slideTimer;

function goToSlide(n) {
  slides[current].classList.remove('active');
  dots[current].classList.remove('active');
  current = (n + slides.length) % slides.length;
  slides[current].classList.add('active');
  dots[current].classList.add('active');
}

function startSlider() {
  slideTimer = setInterval(() => goToSlide(current + 1), 5000);
}

dots.forEach((dot, i) => dot.addEventListener('click', () => {
  clearInterval(slideTimer);
  goToSlide(i);
  startSlider();
}));

startSlider();

// Product tabs
const tabs = document.querySelectorAll('.product-tab');
const panels = document.querySelectorAll('.products-panel');

tabs.forEach(tab => tab.addEventListener('click', () => {
  tabs.forEach(t => t.classList.remove('active'));
  tab.classList.add('active');
  const target = tab.dataset.tab;
  panels.forEach(p => {
    p.style.display = p.dataset.panel === target ? 'grid' : 'none';
  });
}));

// Modal
const modalOverlay = document.getElementById('modalOverlay');
const openModalBtns = document.querySelectorAll('[data-modal]');
const closeModal = document.getElementById('closeModal');
const modalTabs = document.querySelectorAll('.modal-tab');
const modalForms = document.querySelectorAll('.modal-form-panel');

function openModal(tab = 'login') {
  modalOverlay.classList.add('open');
  document.body.style.overflow = 'hidden';
  switchModalTab(tab);
}

function closeModalFn() {
  modalOverlay.classList.remove('open');
  document.body.style.overflow = '';
}

function switchModalTab(name) {
  modalTabs.forEach(t => t.classList.toggle('active', t.dataset.tab === name));
  modalForms.forEach(f => f.style.display = f.dataset.form === name ? 'flex' : 'none');
}

openModalBtns.forEach(btn => btn.addEventListener('click', (e) => {
  e.preventDefault();
  openModal(btn.dataset.modal || 'login');
}));

closeModal?.addEventListener('click', closeModalFn);
modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) closeModalFn(); });
modalTabs.forEach(t => t.addEventListener('click', () => switchModalTab(t.dataset.tab)));

document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModalFn(); });

// Hamburger
const hamburger = document.getElementById('hamburger');
const navMenu = document.getElementById('navMenu');
hamburger?.addEventListener('click', () => navMenu.classList.toggle('open'));

// Cart counter (demo)
let cartCount = 0;
const cartBadge = document.getElementById('cartBadge');

document.querySelectorAll('.add-to-cart').forEach(btn => {
  btn.addEventListener('click', () => {
    cartCount++;
    cartBadge.textContent = cartCount;
    cartBadge.style.display = 'flex';
    btn.textContent = '✓';
    setTimeout(() => btn.textContent = '🛒', 1200);
  });
});

// Counter animation for stats
const statNums = document.querySelectorAll('.stat-num');
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const el = entry.target;
      const target = parseInt(el.dataset.target);
      const suffix = el.dataset.suffix || '';
      let start = 0;
      const step = target / 50;
      const timer = setInterval(() => {
        start += step;
        if (start >= target) { start = target; clearInterval(timer); }
        el.textContent = Math.floor(start) + suffix;
      }, 30);
      observer.unobserve(el);
    }
  });
}, { threshold: 0.5 });

statNums.forEach(el => observer.observe(el));

// Form submit (demo)
document.querySelectorAll('.modal-form').forEach(form => {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const btn = form.querySelector('.form-submit');
    btn.textContent = 'Processing...';
    setTimeout(() => {
      btn.textContent = 'Success! ✓';
      btn.style.background = '#27ae60';
      setTimeout(() => closeModalFn(), 1200);
    }, 1000);
  });
});
