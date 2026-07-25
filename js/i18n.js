/**
 * BrotherScents — i18n (FR/EN) + Theme (dark/light)
 *
 * - Reads localStorage keys: bs_lang (default 'fr'), bs_theme (default 'dark')
 * - Applies theme class to <html> immediately to prevent FOUC
 * - On DOMContentLoaded: injects toggle buttons into #navbar, translates nav
 *   links by href pattern, and translates all [data-i18n] elements
 * - Exposes window.BS.t(key) for use by other scripts
 */

// ── Apply theme immediately (prevents FOUC) ───────────────────────────────────
(function () {
  const theme = localStorage.getItem('bs_theme') || 'dark';
  const html  = document.documentElement;
  if (theme === 'light') { html.classList.remove('dark'); html.classList.add('light'); }
  else                   { html.classList.add('dark');  html.classList.remove('light'); }
})();

// ── Main module ───────────────────────────────────────────────────────────────
(function () {
  const LANG_KEY  = 'bs_lang';
  const THEME_KEY = 'bs_theme';

  let lang  = localStorage.getItem(LANG_KEY)  || 'en';
  let theme = localStorage.getItem(THEME_KEY) || 'dark';

  // ── Translation dictionary ──────────────────────────────────────────────────
  const T = {
    // Nav
    'nav.home':      { ar: 'الرئيسية', en: 'Home' },
    'nav.products':  { ar: 'المنتجات', en: 'Products' },
    'nav.brands':    { ar: 'العلامات التجارية', en: 'Brands' },
    'nav.services':  { ar: 'الخدمات', en: 'Services' },
    'nav.about':     { ar: 'من نحن', en: 'About' },
    'nav.contact':   { ar: 'اتصل بنا', en: 'Contact' },
    'nav.blog':      { ar: 'المدونة', en: 'Blog' },
    'nav.order':     { ar: 'اطلب الآن', en: 'Order Now' },
    'nav.signin':    { ar: 'Sign in', en: 'Sign in' },
    'nav.menu':      { ar: 'Menu', en: 'Menu' },

    // Index hero
    'hero.badge':    { ar: 'GCC Fragrance Wholesale — Amazon FBA Specialists', en: 'GCC Fragrance Wholesale — Amazon FBA Specialists' },
    'hero.tag':      { ar: '#1 Amazon FBA Supplier', en: '#1 Amazon FBA Supplier' },
    'hero.title1':   { ar: 'تصدير عطور الخليج', en: 'Sourcing GCC Perfumes' },
    'hero.title2':   { ar: 'لبائعي أمازون', en: 'for Amazon Sellers' },
    'hero.subtitle': { ar: 'High-margin GCC brands. FBA prep included, compliant invoices for ungating, and direct shipment to Amazon.', en: 'High-margin GCC brands. FBA prep included, compliant invoices for ungating, and direct shipment to Amazon.' },
    'hero.cta1':     { ar: 'تصفح كتالوج أمازون', en: 'View Amazon Catalogue' },
    'hero.cta2':     { ar: 'اتصل بنا', en: 'Contact Us' },
    'hero.scroll':   { ar: 'Discover', en: 'Discover' },

    // Stats
    'stats.brands':    { ar: 'العلامات التجارية', en: 'Brands' },
    'stats.products':  { ar: 'المنتجات', en: 'Products' },
    'stats.delivery':  { ar: 'توصيل سريع', en: 'Fast Delivery' },
    'stats.authentic': { ar: 'أصلية', en: 'Authentic' },
    'stats.countries': { ar: 'الدول المخدومة', en: 'Countries Served' },

    // Section headings (index)
    'section.featured':        { ar: 'المنتجات المميزة', en: 'Featured Products' },
    'section.featured.sub':    { ar: 'الأكثر طلباً من قبل عملائنا بالجملة', en: 'Most requested by our wholesale clients' },
    'section.brands':          { ar: 'علاماتنا التجارية', en: 'Our Brands' },
    'section.brands.sub':      { ar: 'أكثر من 893 علامة تجارية متاحة', en: 'Over 893 brands available' },
    'section.why':             { ar: 'لماذا نحن؟', en: 'Why Choose Us?' },
    'section.why.sub':         { ar: 'ما يميزنا', en: 'What sets us apart' },
    'section.how':             { ar: 'كيفية الطلب', en: 'How to Order' },
    'section.how.sub':         { ar: 'بسيط وسريع', en: 'Simple and fast' },
    'section.testimonials':    { ar: 'آراء العملاء', en: 'Testimonials' },

    // Why cards
    'why.auth':          { ar: 'منتجات أصلية', en: 'Authentic Products' },
    'why.auth.text':     { ar: '100% authentic, sourced directly from brands or authorised distributors.', en: '100% authentic, sourced directly from brands or authorised distributors.' },
    'why.price':         { ar: 'أسعار تنافسية', en: 'Competitive Prices' },
    'why.price.text':    { ar: 'Best wholesale rates, adapted to your order volume.', en: 'Best wholesale rates, adapted to your order volume.' },
    'why.delivery':      { ar: 'توصيل سريع', en: 'Fast Delivery' },
    'why.delivery.text': { ar: 'Dispatch within 1–3 business days. Full GCC coverage.', en: 'Dispatch within 1–3 business days. Full GCC coverage.' },
    'why.support':       { ar: 'دعم مخصص', en: 'Dedicated Support' },
    'why.support.text':  { ar: 'A dedicated account manager for every Pro and Enterprise client.', en: 'A dedicated account manager for every Pro and Enterprise client.' },

    // Products page
    'products.title':    { ar: 'كتالوج المنتجات', en: 'Product Catalogue' },
    'products.subtitle': { ar: 'جميع عطور الجملة', en: 'All our wholesale fragrances' },
    'products.search':   { ar: 'بحث...', en: 'Search...' },
    'products.all':      { ar: 'الكل', en: 'All' },
    'products.instock':  { ar: 'متوفر', en: 'In Stock' },
    'products.filter':   { ar: 'تصفية', en: 'Filters' },
    'products.sort':     { ar: 'ترتيب حسب', en: 'Sort by' },
    'products.results':  { ar: 'نتائج', en: 'results' },
    'products.empty':    { ar: 'لا توجد منتجات.', en: 'No products found.' },
    'products.loading':  { ar: 'Loading...', en: 'Loading...' },

    // Categories
    'cat.homme':    { ar: 'رجالي', en: 'Men' },
    'cat.femme':    { ar: 'نسائي', en: 'Women' },
    'cat.unisexe':  { ar: 'للجنسين', en: 'Unisex' },
    'cat.oriental': { ar: 'شرقي', en: 'Oriental' },
    'cat.niche':    { ar: 'نيش', en: 'Niche' },

    // Brands page
    'brands.title':   { ar: 'All Brands', en: 'All Brands' },
    'brands.subtitle':{ ar: 'Over 893 brands available', en: 'Over 893 brands available' },
    'brands.search':  { ar: 'Search brands...', en: 'Search brands...' },
    'brands.all':     { ar: 'All', en: 'All' },
    'brands.alpha':   { ar: 'By letter', en: 'By letter' },
    'brands.fragrance':{ ar: 'fragrances', en: 'fragrances' },
    'brands.view':    { ar: 'View brand', en: 'View brand' },

    // About page
    'about.title':        { ar: 'عن BrotherScents', en: 'About BrotherScents' },
    'about.subtitle':     { ar: 'Your wholesale partner for Amazon success', en: 'Your wholesale partner for Amazon success' },
    'about.who.title':    { ar: 'من نحن', en: 'Who We Are' },
    'about.who.text':     { ar: 'BrotherScents est un distributeur grossiste de parfums de premier plan spécialisé dans l\'approvisionnement des vendeurs Amazon (FBA/FBM) et des détaillants en e-commerce à travers le monde à partir du GCC.', en: 'BrotherScents is a leading wholesale fragrance distributor specializing in supplying Amazon sellers (FBA/FBM) and e-commerce retailers worldwide from the GCC.' },
    'about.mission.title':{ ar: 'مهمتنا', en: 'Our Mission' },
    'about.mission.text': { ar: 'Permettre aux vendeurs Amazon d\'accéder aux meilleures marques orientales avec une conformité totale, une assistance au déblocage de catégorie et des services de préparation FBA.', en: 'Enabling Amazon sellers to access the best oriental brands with full compliance, category ungating support, and seamless FBA prep services.' },
    'about.values.title': { ar: 'قيمنا', en: 'Our Values' },
    'about.auth':         { ar: 'Amazon Compliance', en: 'Amazon Compliance' },
    'about.auth.text':    { ar: '100% compliant and authentic commercial invoices for flawless category ungating. Zero counterfeits.', en: '100% compliant and authentic commercial invoices for flawless category ungating. Zero counterfeits.' },
    'about.trust':        { ar: 'FBA-Ready', en: 'FBA-Ready' },
    'about.trust.text':   { ar: 'Complete FBA prep solutions: FNSKU labeling, poly-bagging, and direct shipments.', en: 'Complete FBA prep solutions: FNSKU labeling, poly-bagging, and direct shipments.' },
    'about.quality':      { ar: 'Quality', en: 'Quality' },
    'about.quality.text': { ar: 'Every product carefully selected for its excellence.', en: 'Every product carefully selected for its excellence.' },
    'about.speed':        { ar: 'Speed', en: 'Speed' },
    'about.speed.text':   { ar: 'Fast order processing and dispatch within 24–48h.', en: 'Fast order processing and dispatch within 24–48h.' },
    'about.located':      { ar: 'مقرنا في دبي، الإمارات', en: 'Based in Dubai, UAE' },
    'about.serving':      { ar: 'Serving USA and global sellers', en: 'Serving USA and global sellers' },
    'about.since':        { ar: 'Trusted Partner', en: 'Trusted Partner' },

    // Services page
    'services.title':        { ar: 'خدمات أمازون الخاصة بنا', en: 'Our Amazon Services' },
    'services.subtitle':     { ar: 'Complete solutions for e-commerce sellers', en: 'Complete solutions for e-commerce sellers' },
    'services.tiers.title':  { ar: 'فئات أمازون', en: 'Amazon Tiers' },
    'services.tiers.sub':    { ar: 'Services adapted to your sales volume', en: 'Services adapted to your sales volume' },
    'services.starter':      { ar: 'FBA Tester', en: 'FBA Tester' },
    'services.pro':          { ar: 'Pro Seller', en: 'Pro Seller' },
    'services.enterprise':   { ar: 'Distributor', en: 'Distributor' },
    'services.starter.desc': { ar: 'Perfect to test new ASINs', en: 'Perfect to test new ASINs' },
    'services.pro.desc':     { ar: 'For regular restocks', en: 'For regular restocks' },
    'services.enterprise.desc': { ar: 'For high-volume sellers', en: 'For high-volume sellers' },
    'services.min':          { ar: 'Minimum', en: 'Minimum' },
    'services.units':        { ar: 'units', en: 'units' },
    'services.custom':       { ar: 'Custom', en: 'Custom' },
    'services.priority':     { ar: 'FNSKU Labeling', en: 'FNSKU Labeling' },
    'services.dispatch':     { ar: 'Direct to Amazon shipping', en: 'Direct to Amazon shipping' },
    'services.manager':      { ar: 'Ungating Support (Invoices)', en: 'Ungating Support (Invoices)' },
    'services.exclusive':    { ar: 'Poly-bagging prep', en: 'Poly-bagging prep' },
    'services.logistics':    { ar: 'FBA Logistics support', en: 'FBA Logistics support' },

    // How to order
    'order.step1':   { ar: 'Browse', en: 'Browse' },
    'order.step1.d': { ar: 'Explore our catalogue of 25,000+ products', en: 'Explore our catalogue of 25,000+ products' },
    'order.step2':   { ar: 'S\'inscrire',                       en: 'Register' },
    'order.step2.d': { ar: 'Create your business account', en: 'Create your business account' },
    'order.step3':   { ar: 'Approval', en: 'Approval' },
    'order.step3.d': { ar: 'Admin approval within 24h', en: 'Admin approval within 24h' },
    'order.step4':   { ar: 'Order', en: 'Order' },
    'order.step4.d': { ar: 'Via WhatsApp for fastest processing', en: 'Via WhatsApp for fastest processing' },

    // Contact page
    'contact.title':     { ar: 'تواصل معنا', en: 'Contact Us' },
    'contact.subtitle':  { ar: 'Our team replies within 1 hour during business hours', en: 'Our team replies within 1 hour during business hours' },
    'contact.whatsapp':  { ar: 'WhatsApp (recommended)', en: 'WhatsApp (recommended)' },
    'contact.email.lbl': { ar: 'Email', en: 'Email' },
    'contact.location':  { ar: 'Location', en: 'Location' },
    'contact.location.v':{ ar: 'Dubai, UAE', en: 'Dubai, UAE' },
    'contact.hours':     { ar: 'Heures d\'ouverture',           en: 'Business Hours' },
    'contact.hours.v':   { ar: 'Sun – Thu, 9am – 6pm GST', en: 'Sun – Thu, 9am – 6pm GST' },
    'contact.form.title':{ ar: 'Send a Message', en: 'Send a Message' },
    'contact.name':      { ar: 'Your name', en: 'Your name' },
    'contact.company':   { ar: 'Nom de l\'entreprise',          en: 'Company name' },
    'contact.message':   { ar: 'Your message', en: 'Your message' },
    'contact.send':      { ar: 'Send via WhatsApp', en: 'Send via WhatsApp' },
    'contact.response':  { ar: 'Response within 1h during business hours', en: 'Response within 1h during business hours' },

    // FAQ
    'faq.title':    { ar: 'الأسئلة الشائعة', en: 'Frequently Asked Questions' },
    'faq.subtitle': { ar: 'Everything you need to know to sell on Amazon', en: 'Everything you need to know to sell on Amazon' },
    'faq.search':   { ar: 'Search questions...', en: 'Search questions...' },
    'faq.q1':       { ar: 'Do you provide invoices for Amazon ungating?', en: 'Do you provide invoices for Amazon ungating?' },
    'faq.a1':       { ar: 'Yes, all orders include compliant commercial invoices accepted by Amazon to ungate fragrance and beauty categories.', en: 'Yes, all orders include compliant commercial invoices accepted by Amazon to ungate fragrance and beauty categories.' },
    'faq.q2':       { ar: 'Do you offer FBA prep services?', en: 'Do you offer FBA prep services?' },
    'faq.a2':       { ar: 'Absolument. Nous gérons l\'étiquetage FNSKU, la mise en sac (poly-bagging) et l\'expédition directe vers les centres de distribution Amazon du monde entier.', en: 'Absolutely. We handle FNSKU labeling, poly-bagging, and direct shipment to Amazon fulfillment centers worldwide.' },
    'faq.q3':       { ar: 'What is the minimum order (MOQ)?', en: 'What is the minimum order (MOQ)?' },
    'faq.a3':       { ar: 'Our MOQ is just 10 units to allow Amazon sellers to test new ASINs without heavy capital commitment.', en: 'Our MOQ is just 10 units to allow Amazon sellers to test new ASINs without heavy capital commitment.' },
    'faq.q4':       { ar: 'How do I see wholesale prices?', en: 'How do I see wholesale prices?' },
    'faq.a4':       { ar: 'Inscrivez-vous, attendez l\'approbation admin (généralement sous 24h), puis connectez-vous. Les prix sont exclusifs aux vendeurs vérifiés.', en: 'Register, wait for admin approval (usually within 24h), then sign in. Prices are exclusive to verified sellers.' },
    'faq.q5':       { ar: 'Which brands sell well on Amazon?', en: 'Which brands sell well on Amazon?' },
    'faq.a5':       { ar: 'We provide an expertly curated range of GCC brands like Lattafa, Afnan, and Armaf which boast excellent BSR and very strong margins.', en: 'We provide an expertly curated range of GCC brands like Lattafa, Afnan, and Armaf which boast excellent BSR and very strong margins.' },

    // Common buttons & labels
    'btn.order':      { ar: 'Order Now', en: 'Order Now' },
    'btn.browse':     { ar: 'Browse', en: 'Browse' },
    'btn.contact':    { ar: 'Contact Us', en: 'Contact Us' },
    'btn.signin':     { ar: 'Sign In', en: 'Sign In' },
    'btn.register':   { ar: 'S\'inscrire',                      en: 'Register' },
    'btn.viewall':    { ar: 'View All', en: 'View All' },
    'btn.readmore':   { ar: 'Read More', en: 'Read More' },
    'btn.whatsapp':   { ar: 'Order on WhatsApp', en: 'Order on WhatsApp' },
    'btn.getstarted': { ar: 'Get Started', en: 'Get Started' },
    'btn.learn':      { ar: 'Learn More', en: 'Learn More' },

    // Price / Auth
    'price.signin':    { ar: '🔒 Sign in for price', en: '🔒 Sign in for price' },
    'price.retail':    { ar: 'Retail price', en: 'Retail price' },
    'price.wholesale': { ar: 'Wholesale price', en: 'Wholesale price' },
    'price.moq':       { ar: 'MOQ', en: 'MOQ' },
    'auth.login.title':    { ar: 'Sign In', en: 'Sign In' },
    'auth.register.title': { ar: 'Register', en: 'Register' },
    'auth.email':          { ar: 'Email', en: 'Email' },
    'auth.password':       { ar: 'Password', en: 'Password' },
    'auth.name':           { ar: 'Full name', en: 'Full name' },
    'auth.company':        { ar: 'Company', en: 'Company' },
    'auth.phone':          { ar: 'Phone', en: 'Phone' },
    'auth.submit.login':   { ar: 'Sign In', en: 'Sign In' },
    'auth.submit.reg':     { ar: 'Create Account', en: 'Create Account' },
    'auth.switch.reg':     { ar: 'Pas de compte ? S\'inscrire', en: 'No account? Register' },
    'auth.switch.login':   { ar: 'Already registered? Sign In', en: 'Already registered? Sign In' },

    // Blog
    'blog.title':    { ar: 'Wholesale Fragrance Blog', en: 'Wholesale Fragrance Blog' },
    'blog.subtitle': { ar: 'Market guides and news for GCC buyers', en: 'Market guides and news for GCC buyers' },
    'blog.readtime': { ar: 'min read', en: 'min read' },
    'blog.all':      { ar: 'All', en: 'All' },
    'blog.guide':    { ar: 'Wholesale Guide', en: 'Wholesale Guide' },
    'blog.market':   { ar: 'Market Intelligence', en: 'Market Intelligence' },
    'blog.brand':    { ar: 'Brand Spotlight', en: 'Brand Spotlight' },
    'blog.business': { ar: 'Business Guide', en: 'Business Guide' },

    // Footer
    'footer.rights':    { ar: '© 2025 BrotherScents. All rights reserved.', en: '© 2025 BrotherScents. All rights reserved.' },
    'footer.wholesale': { ar: 'Wholesale', en: 'Wholesale' },
    'footer.resources': { ar: 'Resources', en: 'Resources' },
    'footer.pages':     { ar: 'Pages', en: 'Pages' },
    'footer.desc':      { ar: 'Wholesale fragrance distributor — GCC & Algeria', en: 'Wholesale fragrance distributor — GCC & Algeria' },
  };

  function t(key) { return T[key]?.[lang] ?? key; }

  // ── Light theme CSS ─────────────────────────────────────────────────────────
  const LIGHT_CSS = `
    html.light body { background: #f5f0ff !important; color: #111827 !important; }
    html.light #navbar, html.light nav { background: rgba(248,245,255,0.95) !important; border-color: rgba(139,92,246,0.15) !important; box-shadow: 0 1px 20px rgba(0,0,0,0.06) !important; }
    html.light .glass-panel { background: rgba(255,255,255,0.88) !important; border-color: rgba(139,92,246,0.12) !important; box-shadow: 0 4px 30px rgba(0,0,0,0.07) !important; }
    html.light .card-bg { background: #fff !important; border-color: rgba(139,92,246,0.1) !important; }
    html.light #mobileMenu { background: #fff !important; border-color: rgba(139,92,246,0.12) !important; }
    html.light ::-webkit-scrollbar-track { background: #f5f0ff !important; }
    html.light ::-webkit-scrollbar-thumb { background: #c084fc !important; }
    html.light footer { background: #fff !important; border-color: rgba(0,0,0,0.06) !important; }
    html.light .gradient-divider { background: linear-gradient(to right,transparent,rgba(139,92,246,0.3),transparent) !important; }
    html.light canvas#particles { opacity: 0.15 !important; }
    html.light .text-white { color: #111827 !important; }
    html.light .text-gray-400 { color: #6b7280 !important; }
    html.light .text-gray-500 { color: #4b5563 !important; }
    html.light .text-gray-600 { color: #374151 !important; }
    html.light [class*="bg-white/5"], html.light .hover\\:bg-white\\/5:hover { background: rgba(0,0,0,0.04) !important; }
    html.light [class*="border-white"] { border-color: rgba(0,0,0,0.08) !important; }
    html.light .bg-\\[\\#0a0a0a\\], html.light [style*="background:#0a0a0a"], html.light [style*="background: #0a0a0a"] { background: #fff !important; }
    html.light .modal-overlay { background: rgba(0,0,0,0.4) !important; }
    html.light input, html.light textarea, html.light select { background: rgba(0,0,0,0.04) !important; color: #111827 !important; border-color: rgba(0,0,0,0.1) !important; }
    html.light input::placeholder, html.light textarea::placeholder { color: #9ca3af !important; }
  `;

  function applyTheme() {
    const html = document.documentElement;
    if (theme === 'light') { html.classList.remove('dark'); html.classList.add('light'); }
    else                   { html.classList.add('dark');  html.classList.remove('light'); }

    let s = document.getElementById('bs-light-css');
    if (!s) { s = document.createElement('style'); s.id = 'bs-light-css'; document.head.appendChild(s); }
    s.textContent = theme === 'light' ? LIGHT_CSS : '';
  }

  // ── Nav link → translation key by href pattern ──────────────────────────────
  const NAV_HREF_MAP = {
    '/index.html':          'nav.home',
    'index.html':           'nav.home',
    '#':                    'nav.home',
    '#accueil':             'nav.home',
    '../index.html':        'nav.home',
    '/pages/products.html': 'nav.products',
    'pages/products.html':  'nav.products',
    '#products':            'nav.products',
    '/pages/brands.html':   'nav.brands',
    'pages/brands.html':    'nav.brands',
    '#brands':              'nav.brands',
    '/pages/services.html': 'nav.services',
    'pages/services.html':  'nav.services',
    '#services':            'nav.services',
    '/pages/about.html':    'nav.about',
    'pages/about.html':     'nav.about',
    '#about':               'nav.about',
    '/pages/contact.html':  'nav.contact',
    'pages/contact.html':   'nav.contact',
    '#contact':             'nav.contact',
    '/blog/index.html':     'nav.blog',
    'blog/index.html':      'nav.blog',
    '../blog/index.html':   'nav.blog',
  };

  function translateNavLinks() {
    document.querySelectorAll('#navbar a, #mobileMenu a').forEach(a => {
      const href = (a.getAttribute('href') || '').trim();
      const key  = NAV_HREF_MAP[href];
      if (!key) return;
      // If link has an icon, update only the text node(s)
      const icon = a.querySelector('iconify-icon, svg');
      if (icon) {
        a.childNodes.forEach(n => {
          if (n.nodeType === Node.TEXT_NODE && n.textContent.trim()) n.textContent = ' ' + t(key);
        });
      } else {
        a.textContent = t(key);
      }
    });

    // "Order Now" / "Commander" CTA (white button with phone icon)
    document.querySelectorAll('#navbar a.bg-white, #navbar a[class*="bg-white"]').forEach(a => {
      const icon = a.querySelector('iconify-icon');
      a.innerHTML = (icon ? icon.outerHTML + ' ' : '') + t('nav.order');
    });
  }

  // ── Translate data-i18n elements ────────────────────────────────────────────
  function translateDataAttrs() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const v = T[el.dataset.i18n];
      if (v) el.textContent = v[lang] ?? el.textContent;
    });
    document.querySelectorAll('[data-i18n-html]').forEach(el => {
      const v = T[el.dataset.i18nHtml];
      if (v) el.innerHTML = v[lang] ?? el.innerHTML;
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const v = T[el.dataset.i18nPlaceholder];
      if (v) el.placeholder = v[lang] ?? el.placeholder;
    });
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      const v = T[el.dataset.i18nTitle];
      if (v) el.title = v[lang] ?? el.title;
    });
  }

  function translateAll() {
    document.documentElement.lang = lang;
    translateNavLinks();
    translateDataAttrs();
  }

  // ── Inject toggle buttons into nav ──────────────────────────────────────────
  function injectButtons() {
    const ctaDiv = document.querySelector('#navbar .flex.items-center.gap-3');
    if (!ctaDiv || document.getElementById('bs-lang-btn')) return;

    
    // Language toggle button
    const langBtn = document.createElement('button');
    langBtn.id        = 'bs-lang-btn';
    langBtn.title     = lang === 'ar' ? 'Switch to English' : 'التبديل إلى العربية';
    langBtn.className = 'p-1.5 rounded-xl hover:bg-white/5 transition-colors text-xs font-bold text-gray-400 hover:text-gold-400 w-9 h-9 flex items-center justify-center border border-white/10';
    langBtn.textContent = lang === 'ar' ? 'EN' : 'AR';
    langBtn.onclick = () => {
      lang = lang === 'ar' ? 'en' : 'ar';
      localStorage.setItem(LANG_KEY, lang);
      langBtn.textContent = lang === 'ar' ? 'EN' : 'AR';
      langBtn.title = lang === 'ar' ? 'Switch to English' : 'التبديل إلى العربية';
      translateAll();
    };


    // Theme toggle button
    const themeBtn = document.createElement('button');
    themeBtn.id        = 'bs-theme-btn';
    themeBtn.title     = theme === 'dark' ? 'Light mode' : 'Dark mode';
    themeBtn.className = 'p-2 rounded-xl hover:bg-white/5 transition-colors text-gray-400 hover:text-gold-400';
    themeBtn.innerHTML = theme === 'dark'
      ? '<iconify-icon icon="lucide:sun" width="18"></iconify-icon>'
      : '<iconify-icon icon="lucide:moon" width="18"></iconify-icon>';
    themeBtn.onclick = () => {
      theme = theme === 'dark' ? 'light' : 'dark';
      localStorage.setItem(THEME_KEY, theme);
      themeBtn.title = theme === 'dark' ? 'Light mode' : 'Dark mode';
      themeBtn.innerHTML = theme === 'dark'
        ? '<iconify-icon icon="lucide:sun" width="18"></iconify-icon>'
        : '<iconify-icon icon="lucide:moon" width="18"></iconify-icon>';
      applyTheme();
    };

    ctaDiv.insertBefore(themeBtn, ctaDiv.firstChild);
    ctaDiv.insertBefore(langBtn, ctaDiv.firstChild);

  // ── Init ────────────────────────────────────────────────────────────────────
  function init() {
    applyTheme();
    injectButtons();
    translateAll();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  // Public API
  window.BS       = window.BS || {};
  window.BS.t     = t;
  window.BS.lang  = () => lang;
  window.BS.theme = () => theme;
})();
