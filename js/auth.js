/* auth.js — session, registration, login, price gating */

const AUTH = (() => {
  const USERS_KEY = 'ls_users';
  const SESSION_KEY = 'ls_session';

  function getUsers() {
    return JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
  }

  function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }

  function hashPassword(pw) {
    // ponytail: btoa encode until real backend with bcrypt is wired up
    return btoa(unescape(encodeURIComponent(pw)));
  }

  function isLoggedIn() {
    const session = localStorage.getItem(SESSION_KEY);
    if (!session) return false;
    try {
      const s = JSON.parse(session);
      return s && s.userId && s.expires > Date.now();
    } catch { return false; }
  }

  function getCurrentUser() {
    if (!isLoggedIn()) return null;
    const s = JSON.parse(localStorage.getItem(SESSION_KEY));
    return getUsers().find(u => u.id === s.userId) || null;
  }

  function login(email, password) {
    const users = getUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) return { ok: false, msg: 'No account found for this email.' };
    if (user.passwordHash !== hashPassword(password)) return { ok: false, msg: 'Wrong password.' };
    if (!user.approved) return { ok: false, msg: 'Account pending approval. We will notify you within 24 hours.' };

    localStorage.setItem(SESSION_KEY, JSON.stringify({
      userId: user.id,
      expires: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days
    }));
    return { ok: true, user };
  }

  function register(data) {
    const users = getUsers();
    if (users.find(u => u.email.toLowerCase() === data.email.toLowerCase())) {
      return { ok: false, msg: 'Email already registered.' };
    }
    const user = {
      id: 'u_' + Date.now(),
      name: data.name,
      company: data.company || '',
      email: data.email,
      phone: data.phone || '',
      passwordHash: hashPassword(data.password),
      approved: false, // admin must approve
      createdAt: new Date().toISOString()
    };
    users.push(user);
    saveUsers(users);
    return { ok: true, user };
  }

  function logout() {
    localStorage.removeItem(SESSION_KEY);
    window.location.reload();
  }

  // ── Price gating ──────────────────────────────────────────────
  function applyPriceGate() {
    if (isLoggedIn()) return; // nothing to gate

    // Replace price displays
    document.querySelectorAll('.price-current').forEach(el => {
      el.dataset.price = el.textContent;
      el.innerHTML = '<a class="price-lock-link" href="#" data-modal="login">🔒 Sign in</a>';
      el.style.fontSize = '13px';
    });

    // Disable add-to-cart
    document.querySelectorAll('.add-to-cart').forEach(btn => {
      btn.dataset.locked = '1';
      btn.title = 'Sign in to order';
    });

    // .price-old too
    document.querySelectorAll('.price-old').forEach(el => {
      el.style.display = 'none';
    });

    // Intercept lock links (delegated — modal not mounted yet when this runs)
    document.addEventListener('click', e => {
      if (e.target.closest('.price-lock-link') || (e.target.closest('.add-to-cart') && e.target.closest('.add-to-cart').dataset.locked)) {
        e.preventDefault();
        const overlay = document.getElementById('modalOverlay');
        if (overlay) overlay.classList.add('open');
      }
    });
  }

  // ── Wire modal forms ──────────────────────────────────────────
  function wireModal() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const loginError = document.getElementById('loginError');
    const registerError = document.getElementById('registerError');

    loginForm?.addEventListener('submit', e => {
      e.preventDefault();
      const email = loginForm.querySelector('[name=email]').value;
      const password = loginForm.querySelector('[name=password]').value;
      const res = login(email, password);
      if (res.ok) {
        window.location.reload();
      } else {
        if (loginError) { loginError.textContent = res.msg; loginError.style.display = 'block'; }
      }
    });

    registerForm?.addEventListener('submit', e => {
      e.preventDefault();
      const data = {
        name: registerForm.querySelector('[name=name]').value,
        company: registerForm.querySelector('[name=company]').value,
        email: registerForm.querySelector('[name=email]').value,
        password: registerForm.querySelector('[name=password]').value,
        phone: registerForm.querySelector('[name=phone]')?.value || ''
      };
      const res = register(data);
      if (res.ok) {
        if (registerError) {
          registerError.style.color = '#c9a84c';
          registerError.textContent = '✓ Account created! Awaiting admin approval (within 24 hours).';
          registerError.style.display = 'block';
        }
        registerForm.reset();
      } else {
        if (registerError) { registerError.textContent = res.msg; registerError.style.display = 'block'; }
      }
    });
  }

  // ── Nav: show user name or sign-in button ─────────────────────
  function updateNav() {
    const user = getCurrentUser();
    const signinLinks = document.querySelectorAll('.btn-signin, [data-modal="login"]');
    const logoutBtn = document.getElementById('logoutBtn');
    const navUserLabel = document.getElementById('navUserLabel');

    if (user) {
      signinLinks.forEach(el => el.style.display = 'none');
      if (navUserLabel) navUserLabel.textContent = user.name || user.email;
      if (logoutBtn) logoutBtn.style.display = 'inline-flex';
    }
    logoutBtn?.addEventListener('click', () => logout());
  }

  function init() {
    applyPriceGate();
    updateNav();
    // wire modal after DOM ready
    wireModal();
  }

  return { isLoggedIn, getCurrentUser, login, register, logout, init };
})();

document.addEventListener('DOMContentLoaded', () => AUTH.init());
