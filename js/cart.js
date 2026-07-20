/* cart.js — cart state + WhatsApp checkout */

const CART = (() => {
  const CART_KEY = 'ls_cart';
  const ORDERS_KEY = 'ls_orders';
  const SETTINGS_KEY = 'ls_settings';

  function getCart() {
    return JSON.parse(localStorage.getItem(CART_KEY) || '[]');
  }

  function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateBadge();
  }

  function addToCart(product) {
    if (!AUTH.isLoggedIn()) {
      document.getElementById('modalOverlay')?.classList.add('open');
      return;
    }
    const cart = getCart();
    const existing = cart.find(i => i.id === product.id && i.size === product.size);
    if (existing) {
      existing.qty += 1;
    } else {
      cart.push({ ...product, qty: 1 });
    }
    saveCart(cart);
    showToast(`${product.name} added to cart`);
  }

  function removeFromCart(id) {
    saveCart(getCart().filter(i => i.id !== id));
  }

  function updateQty(id, qty) {
    const cart = getCart();
    const item = cart.find(i => i.id === id);
    if (item) {
      item.qty = Math.max(1, parseInt(qty) || 1);
      saveCart(cart);
    }
  }

  function clearCart() {
    localStorage.removeItem(CART_KEY);
    updateBadge();
  }

  function getTotal() {
    return getCart().reduce((sum, i) => sum + i.price * i.qty, 0);
  }

  function getSettings() {
    const defaults = { whatsappNumber: '', businessName: 'LuxeScent', currency: 'USD', minOrderAmount: 500 };
    return { ...defaults, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}') };
  }

  function saveOrder(items, user, total) {
    const orders = JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]');
    const order = {
      id: 'ORD-' + Date.now(),
      userId: user.id,
      customerName: user.name,
      company: user.company || '',
      email: user.email,
      items,
      total,
      status: 'pending',
      whatsappSent: true,
      date: new Date().toISOString()
    };
    orders.unshift(order);
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
    return order;
  }

  function buildWhatsAppMessage(order, settings) {
    const cur = settings.currency;
    const itemLines = order.items.map(i =>
      `  • ${i.brand} ${i.name} (${i.size}) × ${i.qty}  —  ${cur} ${(i.price * i.qty).toFixed(2)}`
    ).join('\n');

    return [
      `🛒 *NEW ORDER — ${settings.businessName} Wholesale*`,
      `Order ID: ${order.id}`,
      `Date: ${new Date(order.date).toLocaleString()}`,
      ``,
      `*Customer:* ${order.customerName}`,
      `*Company:* ${order.company || '—'}`,
      `*Email:* ${order.email}`,
      ``,
      `*ORDER ITEMS:*`,
      itemLines,
      ``,
      `*TOTAL: ${cur} ${order.total.toFixed(2)}*`,
      ``,
      `Please confirm availability and arrange payment. Thank you!`
    ].join('\n');
  }

  function checkout() {
    const user = AUTH.getCurrentUser();
    if (!user) { document.getElementById('modalOverlay')?.classList.add('open'); return; }

    const cart = getCart();
    if (!cart.length) { showToast('Cart is empty'); return; }

    const settings = getSettings();
    const total = getTotal();

    if (!settings.whatsappNumber) {
      alert('WhatsApp number not configured. Please contact the admin.');
      return;
    }

    const order = saveOrder(cart, user, total);
    const message = buildWhatsAppMessage(order, settings);
    const phone = settings.whatsappNumber.replace(/\D/g, '');
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

    clearCart();
    window.open(url, '_blank');
    showToast('Order sent via WhatsApp! ✓', 4000);
  }

  function updateBadge() {
    const total = getCart().reduce((sum, i) => sum + i.qty, 0);
    const badge = document.getElementById('cartBadge');
    if (!badge) return;
    badge.textContent = total;
    badge.style.display = total > 0 ? 'flex' : 'none';
  }

  function showToast(msg, duration = 2500) {
    let toast = document.getElementById('cartToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'cartToast';
      toast.style.cssText = `
        position:fixed; bottom:28px; left:50%; transform:translateX(-50%);
        background:#c9a84c; color:#111; padding:12px 24px; border-radius:6px;
        font-weight:700; font-size:14px; z-index:9999; opacity:0;
        transition:opacity 0.3s; pointer-events:none; white-space:nowrap;
      `;
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.style.opacity = '1';
    clearTimeout(toast._t);
    toast._t = setTimeout(() => { toast.style.opacity = '0'; }, duration);
  }

  // Wire add-to-cart buttons on product cards (for products defined in HTML)
  function wireProductCards() {
    document.querySelectorAll('.product-card').forEach(card => {
      const btn = card.querySelector('.add-to-cart');
      if (!btn || btn.dataset.wired) return;
      btn.dataset.wired = '1';
      btn.addEventListener('click', e => {
        e.stopPropagation();
        if (!AUTH.isLoggedIn()) {
          document.getElementById('modalOverlay')?.classList.add('open');
          return;
        }
        const product = {
          id: card.dataset.productId || 'p_' + Math.random().toString(36).slice(2),
          name: card.querySelector('.product-name')?.textContent || 'Product',
          brand: card.querySelector('.product-brand')?.textContent || '',
          size: card.querySelector('.product-size')?.textContent || '',
          price: parseFloat(card.querySelector('.price-current')?.dataset.price || card.querySelector('.price-current')?.textContent?.replace(/[^0-9.]/g, '') || 0)
        };
        addToCart(product);
        btn.textContent = '✓';
        setTimeout(() => btn.textContent = '🛒', 1400);
      });
    });
  }

  function init() {
    updateBadge();
    // Wire after auth has run (so price-gated data-price attrs are set)
    document.addEventListener('DOMContentLoaded', wireProductCards);

    // Checkout button
    document.getElementById('checkoutBtn')?.addEventListener('click', checkout);
  }

  return { addToCart, removeFromCart, updateQty, clearCart, getCart, getTotal, checkout, showToast, init };
})();

CART.init();
