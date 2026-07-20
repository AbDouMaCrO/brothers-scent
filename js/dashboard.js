/* dashboard.js — admin panel logic */

// ── Storage helpers ─────────────────────────────────────────────
const DB = {
  get: (key, def = []) => { try { return JSON.parse(localStorage.getItem(key)) ?? def; } catch { return def; } },
  set: (key, val) => localStorage.setItem(key, JSON.stringify(val)),
  settings: () => {
    const d = { whatsappNumber: '', businessName: 'LuxeScent', currency: 'USD', minOrderAmount: 500, adminPassword: 'admin123' };
    return { ...d, ...DB.get('ls_settings', {}) };
  }
};

function uuid() { return 'id_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6); }

function toast(msg, type = 'ok') {
  const el = document.getElementById('dbToast');
  if (!el) return;
  el.textContent = msg;
  el.style.borderColor = type === 'ok' ? 'var(--gold)' : 'var(--red)';
  el.classList.add('show');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), 2800);
}

function fmt(n) {
  const s = DB.settings();
  return s.currency + ' ' + parseFloat(n).toFixed(2);
}

// ── Auth ─────────────────────────────────────────────────────────
function checkAdminAuth() {
  const authed = sessionStorage.getItem('db_admin') === '1';
  document.getElementById('authScreen').style.display = authed ? 'none' : 'flex';
  document.getElementById('dashboardLayout').style.display = authed ? 'flex' : 'none';
  return authed;
}

document.getElementById('adminLoginForm')?.addEventListener('submit', e => {
  e.preventDefault();
  const pw = document.getElementById('adminPw').value;
  const s = DB.settings();
  if (pw === s.adminPassword) {
    sessionStorage.setItem('db_admin', '1');
    checkAdminAuth();
    initDashboard();
  } else {
    document.getElementById('adminError').textContent = 'Wrong password.';
    document.getElementById('adminError').style.display = 'block';
  }
});

document.getElementById('logoutAdminBtn')?.addEventListener('click', () => {
  sessionStorage.removeItem('db_admin');
  window.location.reload();
});

// ── Navigation ────────────────────────────────────────────────────
function showSection(id) {
  document.querySelectorAll('.db-section').forEach(s => s.classList.remove('active'));
  document.getElementById('section-' + id)?.classList.add('active');
  document.querySelectorAll('.db-nav a').forEach(a => a.classList.toggle('active', a.dataset.section === id));
  document.getElementById('topbarTitle').textContent = {
    overview: 'Overview',
    categories: 'Categories',
    products: 'Products',
    orders: 'Orders',
    users: 'Users',
    settings: 'Settings'
  }[id] || id;
}

document.querySelectorAll('.db-nav a[data-section]').forEach(a => {
  a.addEventListener('click', e => { e.preventDefault(); showSection(a.dataset.section); });
});

// ── Seed default data ─────────────────────────────────────────────
function seedIfEmpty() {
  if (!DB.get('ls_categories', null)) {
    DB.set('ls_categories', [
      { id: uuid(), name: "Women's Fragrances", slug: 'women', icon: '🌸', active: true },
      { id: uuid(), name: "Men's Fragrances", slug: 'men', icon: '🖤', active: true },
      { id: uuid(), name: 'Unisex & Niche', slug: 'unisex', icon: '⚗️', active: true },
      { id: uuid(), name: 'Oriental & Oud', slug: 'oud', icon: '🌿', active: true },
      { id: uuid(), name: 'Gift Sets', slug: 'sets', icon: '🎁', active: true },
      { id: uuid(), name: 'Miniatures & Travel', slug: 'mini', icon: '✈️', active: true },
      { id: uuid(), name: 'Body Care', slug: 'body', icon: '🧴', active: true },
      { id: uuid(), name: 'Home Fragrance', slug: 'home', icon: '🕯️', active: true },
    ]);
  }
  if (!DB.get('ls_products', null)) {
    const cats = DB.get('ls_categories');
    const wid = cats.find(c => c.slug === 'women')?.id || '';
    const mid = cats.find(c => c.slug === 'men')?.id || '';
    DB.set('ls_products', [
      { id: uuid(), name: 'Coco Mademoiselle EDP', brand: 'Chanel', categoryId: wid, size: '100ml', price: 89, stock: 24, badge: 'NEW', active: true, createdAt: new Date().toISOString() },
      { id: uuid(), name: 'Miss Dior Blooming Bouquet', brand: 'Dior', categoryId: wid, size: '75ml', price: 76, stock: 18, badge: '', active: true, createdAt: new Date().toISOString() },
      { id: uuid(), name: 'Black Opium EDP', brand: 'YSL', categoryId: wid, size: '90ml', price: 95, stock: 30, badge: '', active: true, createdAt: new Date().toISOString() },
      { id: uuid(), name: 'Sauvage EDP', brand: 'Dior', categoryId: mid, size: '100ml', price: 110, stock: 42, badge: 'HOT', active: true, createdAt: new Date().toISOString() },
      { id: uuid(), name: 'Oud Wood EDP', brand: 'Tom Ford', categoryId: mid, size: '50ml', price: 185, stock: 10, badge: '', active: true, createdAt: new Date().toISOString() },
    ]);
  }
}

// ── Overview ──────────────────────────────────────────────────────
function renderOverview() {
  const products = DB.get('ls_products');
  const orders = DB.get('ls_orders');
  const users = DB.get('ls_users');
  const cats = DB.get('ls_categories');

  document.getElementById('stat-products').textContent = products.filter(p => p.active).length;
  document.getElementById('stat-orders').textContent = orders.length;
  document.getElementById('stat-users').textContent = users.length;
  document.getElementById('stat-revenue').textContent = fmt(orders.reduce((s, o) => s + (o.total || 0), 0));
  document.getElementById('stat-categories').textContent = cats.length;
  document.getElementById('stat-pending-users').textContent = users.filter(u => !u.approved).length;

  // Recent orders
  const recentEl = document.getElementById('recentOrdersList');
  if (!recentEl) return;
  if (!orders.length) {
    recentEl.innerHTML = '<div class="empty-state"><div class="empty-icon">📦</div><p>No orders yet</p></div>';
    return;
  }
  recentEl.innerHTML = orders.slice(0, 6).map(o => `
    <div class="recent-item">
      <div>
        <span class="ord-id">${o.id}</span>
        <span style="color:var(--text-light);font-size:12px;margin-left:10px;">${o.customerName} · ${o.company || '—'}</span>
      </div>
      <div style="display:flex;align-items:center;gap:12px;">
        <span class="ord-total">${fmt(o.total)}</span>
        <span class="badge badge-${o.status === 'confirmed' ? 'green' : o.status === 'cancelled' ? 'red' : 'gold'}">${o.status}</span>
      </div>
    </div>
  `).join('');
}

// ── Categories ────────────────────────────────────────────────────
function renderCategories() {
  const cats = DB.get('ls_categories');
  const products = DB.get('ls_products');
  const grid = document.getElementById('catGrid');
  if (!grid) return;

  if (!cats.length) {
    grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1"><div class="empty-icon">📂</div><p>No categories yet</p></div>';
    return;
  }

  grid.innerHTML = cats.map(c => {
    const count = products.filter(p => p.categoryId === c.id && p.active).length;
    return `
    <div class="cat-card">
      <span class="cat-status">
        <span class="badge badge-${c.active ? 'green' : 'red'}">${c.active ? 'Active' : 'Hidden'}</span>
      </span>
      <div class="cat-icon">${c.icon || '📦'}</div>
      <h3>${c.name}</h3>
      <div class="cat-count">${count} product${count !== 1 ? 's' : ''}</div>
      <div class="cat-actions">
        <button class="btn btn-ghost btn-sm" onclick="openCatModal('${c.id}')">Edit</button>
        <button class="btn btn-${c.active ? 'danger' : 'green'} btn-sm" onclick="toggleCat('${c.id}')">${c.active ? 'Hide' : 'Show'}</button>
        <button class="btn btn-danger btn-sm" onclick="deleteCat('${c.id}')">✕</button>
      </div>
    </div>`;
  }).join('');
}

function openCatModal(id) {
  const cats = DB.get('ls_categories');
  const cat = id ? cats.find(c => c.id === id) : null;
  document.getElementById('catModalTitle').textContent = cat ? 'Edit Category' : 'New Category';
  document.getElementById('catModalId').value = cat?.id || '';
  document.getElementById('catModalName').value = cat?.name || '';
  document.getElementById('catModalIcon').value = cat?.icon || '📦';
  document.getElementById('catModalSlug').value = cat?.slug || '';
  document.getElementById('catModal').classList.add('open');
}

document.getElementById('catForm')?.addEventListener('submit', e => {
  e.preventDefault();
  const id = document.getElementById('catModalId').value;
  const cats = DB.get('ls_categories');
  const data = {
    name: document.getElementById('catModalName').value,
    icon: document.getElementById('catModalIcon').value,
    slug: document.getElementById('catModalSlug').value || document.getElementById('catModalName').value.toLowerCase().replace(/\s+/g, '-'),
    active: true
  };
  if (id) {
    const i = cats.findIndex(c => c.id === id);
    if (i > -1) cats[i] = { ...cats[i], ...data };
  } else {
    cats.push({ id: uuid(), ...data });
  }
  DB.set('ls_categories', cats);
  closeModal('catModal');
  renderCategories();
  renderOverview();
  toast('Category saved ✓');
});

function toggleCat(id) {
  const cats = DB.get('ls_categories');
  const c = cats.find(c => c.id === id);
  if (c) { c.active = !c.active; DB.set('ls_categories', cats); renderCategories(); toast('Updated'); }
}

function deleteCat(id) {
  if (!confirm('Delete this category? Products in it will become uncategorised.')) return;
  DB.set('ls_categories', DB.get('ls_categories').filter(c => c.id !== id));
  renderCategories();
  renderOverview();
  toast('Deleted');
}

// ── Products ──────────────────────────────────────────────────────
let productSearch = '';
let productFilter = '';

function renderProducts() {
  const products = DB.get('ls_products');
  const cats = DB.get('ls_categories');
  const tbody = document.getElementById('productsTbody');
  if (!tbody) return;

  const filtered = products.filter(p => {
    const matchSearch = !productSearch || p.name.toLowerCase().includes(productSearch) || p.brand.toLowerCase().includes(productSearch);
    const matchCat = !productFilter || p.categoryId === productFilter;
    return matchSearch && matchCat;
  });

  if (!filtered.length) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--text-light);">No products found</td></tr>';
    return;
  }

  tbody.innerHTML = filtered.map(p => {
    const cat = cats.find(c => c.id === p.categoryId);
    return `
    <tr>
      <td><strong style="color:var(--white)">${p.name}</strong><br><span style="color:var(--gold);font-size:12px">${p.brand}</span></td>
      <td><span style="font-size:16px">${cat?.icon || '📦'}</span> ${cat?.name || '—'}</td>
      <td>${p.size}</td>
      <td><strong style="color:var(--gold)">${fmt(p.price)}</strong></td>
      <td><span class="badge badge-${p.stock > 10 ? 'green' : p.stock > 0 ? 'orange' : 'red'}">${p.stock} units</span></td>
      <td><span class="badge badge-${p.active ? 'green' : 'red'}">${p.active ? 'Active' : 'Hidden'}</span></td>
      <td class="td-actions">
        <button class="btn btn-ghost btn-sm" onclick="openProductModal('${p.id}')">Edit</button>
        <button class="btn btn-${p.active ? 'danger' : 'green'} btn-sm" onclick="toggleProduct('${p.id}')">${p.active ? 'Hide' : 'Show'}</button>
        <button class="btn btn-danger btn-sm" onclick="deleteProduct('${p.id}')">✕</button>
      </td>
    </tr>`;
  }).join('');

  // Populate category filter
  const filterEl = document.getElementById('productCatFilter');
  if (filterEl && filterEl.options.length <= 1) {
    cats.forEach(c => {
      const opt = new Option(c.name, c.id);
      filterEl.add(opt);
    });
  }
}

function openProductModal(id) {
  const cats = DB.get('ls_categories');
  const products = DB.get('ls_products');
  const p = id ? products.find(x => x.id === id) : null;

  document.getElementById('productModalTitle').textContent = p ? 'Edit Product' : 'New Product';
  document.getElementById('pmId').value = p?.id || '';
  document.getElementById('pmName').value = p?.name || '';
  document.getElementById('pmBrand').value = p?.brand || '';
  document.getElementById('pmSize').value = p?.size || '100ml';
  document.getElementById('pmPrice').value = p?.price || '';
  document.getElementById('pmStock').value = p?.stock || '';
  document.getElementById('pmBadge').value = p?.badge || '';

  const catSel = document.getElementById('pmCategory');
  catSel.innerHTML = '<option value="">Select category</option>';
  cats.forEach(c => {
    const opt = new Option(c.icon + ' ' + c.name, c.id);
    if (p?.categoryId === c.id) opt.selected = true;
    catSel.add(opt);
  });

  document.getElementById('productModal').classList.add('open');
}

document.getElementById('productForm')?.addEventListener('submit', e => {
  e.preventDefault();
  const id = document.getElementById('pmId').value;
  const products = DB.get('ls_products');
  const data = {
    name: document.getElementById('pmName').value,
    brand: document.getElementById('pmBrand').value,
    categoryId: document.getElementById('pmCategory').value,
    size: document.getElementById('pmSize').value,
    price: parseFloat(document.getElementById('pmPrice').value),
    stock: parseInt(document.getElementById('pmStock').value) || 0,
    badge: document.getElementById('pmBadge').value,
    active: true
  };
  if (id) {
    const i = products.findIndex(p => p.id === id);
    if (i > -1) products[i] = { ...products[i], ...data };
  } else {
    products.push({ id: uuid(), ...data, createdAt: new Date().toISOString() });
  }
  DB.set('ls_products', products);
  closeModal('productModal');
  renderProducts();
  renderOverview();
  toast('Product saved ✓');
});

function toggleProduct(id) {
  const p = DB.get('ls_products');
  const item = p.find(x => x.id === id);
  if (item) { item.active = !item.active; DB.set('ls_products', p); renderProducts(); toast('Updated'); }
}

function deleteProduct(id) {
  if (!confirm('Delete this product?')) return;
  DB.set('ls_products', DB.get('ls_products').filter(p => p.id !== id));
  renderProducts();
  renderOverview();
  toast('Deleted');
}

document.getElementById('productSearch')?.addEventListener('input', e => {
  productSearch = e.target.value.toLowerCase();
  renderProducts();
});
document.getElementById('productCatFilter')?.addEventListener('change', e => {
  productFilter = e.target.value;
  renderProducts();
});

// ── Orders ────────────────────────────────────────────────────────
function renderOrders() {
  const orders = DB.get('ls_orders');
  const tbody = document.getElementById('ordersTbody');
  if (!tbody) return;

  if (!orders.length) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--text-light);">No orders yet</td></tr>';
    return;
  }

  tbody.innerHTML = orders.map(o => `
    <tr>
      <td><strong class="ord-id" style="color:var(--gold)">${o.id}</strong></td>
      <td>${o.customerName}<br><span style="color:var(--text-light);font-size:12px">${o.company || '—'}</span></td>
      <td style="font-size:12px;color:var(--text-light)">${new Date(o.date).toLocaleDateString()}</td>
      <td>${o.items?.length || 0} items</td>
      <td><strong>${fmt(o.total)}</strong></td>
      <td>
        <select class="db-filter" onchange="updateOrderStatus('${o.id}', this.value)" style="padding:4px 8px;">
          ${['pending','confirmed','shipped','cancelled'].map(s => `<option ${s === o.status ? 'selected' : ''}>${s}</option>`).join('')}
        </select>
      </td>
      <td class="td-actions">
        <button class="btn btn-ghost btn-sm" onclick="viewOrder('${o.id}')">View</button>
        <button class="btn btn-gold btn-sm" onclick="resendWhatsApp('${o.id}')">📱 WA</button>
      </td>
    </tr>
  `).join('');
}

function updateOrderStatus(id, status) {
  const orders = DB.get('ls_orders');
  const o = orders.find(x => x.id === id);
  if (o) { o.status = status; DB.set('ls_orders', orders); toast('Status updated'); }
}

function viewOrder(id) {
  const o = DB.get('ls_orders').find(x => x.id === id);
  if (!o) return;
  const s = DB.settings();
  const items = (o.items || []).map(i =>
    `<tr><td>${i.brand} ${i.name}</td><td>${i.size}</td><td>${i.qty}</td><td>${fmt(i.price)}</td><td>${fmt(i.price * i.qty)}</td></tr>`
  ).join('');
  document.getElementById('orderDetailContent').innerHTML = `
    <div style="margin-bottom:16px;">
      <strong style="color:var(--gold)">${o.id}</strong> &nbsp;
      <span class="badge badge-gold">${o.status}</span>
      <span style="float:right;color:var(--text-light);font-size:12px">${new Date(o.date).toLocaleString()}</span>
    </div>
    <div style="margin-bottom:12px;font-size:13px">
      <strong>${o.customerName}</strong> · ${o.company || '—'} · ${o.email}
    </div>
    <div class="order-detail">
      <table style="width:100%">
        <thead><tr><th>Product</th><th>Size</th><th>Qty</th><th>Unit</th><th>Total</th></tr></thead>
        <tbody>${items}</tbody>
      </table>
    </div>
    <div style="margin-top:12px;text-align:right;font-size:16px;font-weight:800;color:var(--gold)">
      Grand Total: ${fmt(o.total)}
    </div>
  `;
  document.getElementById('orderDetailModal').classList.add('open');
}

function resendWhatsApp(id) {
  const o = DB.get('ls_orders').find(x => x.id === id);
  if (!o) return;
  const s = DB.settings();
  if (!s.whatsappNumber) { toast('WhatsApp number not set in Settings', 'err'); return; }
  const lines = (o.items || []).map(i => `  • ${i.brand} ${i.name} (${i.size}) × ${i.qty}  —  ${s.currency} ${(i.price * i.qty).toFixed(2)}`).join('\n');
  const msg = `🛒 *ORDER ${o.id} — ${s.businessName}*\nCustomer: ${o.customerName} (${o.company || '—'})\n\n${lines}\n\n*TOTAL: ${s.currency} ${o.total.toFixed(2)}*`;
  window.open(`https://wa.me/${s.whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
}

// ── Users ─────────────────────────────────────────────────────────
function renderUsers() {
  const users = DB.get('ls_users');
  const tbody = document.getElementById('usersTbody');
  if (!tbody) return;
  if (!users.length) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:40px;color:var(--text-light);">No registered users yet</td></tr>';
    return;
  }
  tbody.innerHTML = users.map(u => `
    <tr>
      <td><strong style="color:var(--white)">${u.name}</strong></td>
      <td>${u.email}</td>
      <td>${u.company || '—'}</td>
      <td>${u.phone || '—'}</td>
      <td><span class="badge badge-${u.approved ? 'green' : 'orange'}">${u.approved ? 'Approved' : 'Pending'}</span></td>
      <td class="td-actions">
        ${!u.approved ? `<button class="btn btn-green btn-sm" onclick="approveUser('${u.id}')">✓ Approve</button>` : ''}
        <button class="btn btn-danger btn-sm" onclick="deleteUser('${u.id}')">Delete</button>
      </td>
    </tr>
  `).join('');
}

function approveUser(id) {
  const users = DB.get('ls_users');
  const u = users.find(x => x.id === id);
  if (u) { u.approved = true; DB.set('ls_users', users); renderUsers(); renderOverview(); toast('User approved ✓'); }
}

function deleteUser(id) {
  if (!confirm('Delete this user account?')) return;
  DB.set('ls_users', DB.get('ls_users').filter(u => u.id !== id));
  renderUsers();
  renderOverview();
  toast('User deleted');
}

// ── Settings ──────────────────────────────────────────────────────
function renderSettings() {
  const s = DB.settings();
  document.getElementById('settingWA').value = s.whatsappNumber || '';
  document.getElementById('settingBizName').value = s.businessName || '';
  document.getElementById('settingCurrency').value = s.currency || 'USD';
  document.getElementById('settingMinOrder').value = s.minOrderAmount || 500;
}

document.getElementById('settingsForm')?.addEventListener('submit', e => {
  e.preventDefault();
  const s = DB.settings();
  const newPw = document.getElementById('settingNewPw').value;
  DB.set('ls_settings', {
    ...s,
    whatsappNumber: document.getElementById('settingWA').value.trim(),
    businessName: document.getElementById('settingBizName').value.trim(),
    currency: document.getElementById('settingCurrency').value,
    minOrderAmount: parseFloat(document.getElementById('settingMinOrder').value) || 500,
    ...(newPw ? { adminPassword: newPw } : {})
  });
  document.getElementById('settingNewPw').value = '';
  toast('Settings saved ✓');
});

// ── Modal helpers ─────────────────────────────────────────────────
function closeModal(id) {
  document.getElementById(id)?.classList.remove('open');
}

document.querySelectorAll('.db-modal-close').forEach(btn => {
  btn.addEventListener('click', () => btn.closest('.db-modal-overlay')?.classList.remove('open'));
});
document.querySelectorAll('.db-modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.classList.remove('open'); });
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') document.querySelectorAll('.db-modal-overlay.open').forEach(m => m.classList.remove('open'));
});

// ── Init ──────────────────────────────────────────────────────────
function initDashboard() {
  seedIfEmpty();
  const s = DB.settings();
  document.getElementById('adminNameLabel').textContent = s.businessName + ' Admin';
  showSection('overview');
  renderOverview();
  renderCategories();
  renderProducts();
  renderOrders();
  renderUsers();
  renderSettings();

  if (!s.whatsappNumber) {
    setTimeout(() => toast('⚠ Set your WhatsApp number in Settings!', 'err'), 1000);
  }
}

// Run
if (checkAdminAuth()) initDashboard();
