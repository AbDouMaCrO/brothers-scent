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

  let lang  = localStorage.getItem(LANG_KEY)  || 'fr';
  let theme = localStorage.getItem(THEME_KEY) || 'dark';

  // ── Translation dictionary ──────────────────────────────────────────────────
  const T = {
    // Nav
    'nav.home':      { fr: 'Accueil',    en: 'Home' },
    'nav.products':  { fr: 'Produits',   en: 'Products' },
    'nav.brands':    { fr: 'Marques',    en: 'Brands' },
    'nav.services':  { fr: 'Services',   en: 'Services' },
    'nav.about':     { fr: 'À propos',   en: 'About' },
    'nav.contact':   { fr: 'Contact',    en: 'Contact' },
    'nav.blog':      { fr: 'Blog',       en: 'Blog' },
    'nav.order':     { fr: 'Commander',  en: 'Order Now' },
    'nav.signin':    { fr: 'Connexion',  en: 'Sign in' },
    'nav.menu':      { fr: 'Menu',       en: 'Menu' },

    // Index hero
    'hero.badge':    { fr: 'Grossiste Parfums — GCC & Algérie', en: 'Fragrance Wholesale — GCC & Algeria' },
    'hero.tag':      { fr: 'N°1 Grossiste Parfums',             en: '#1 Wholesale Fragrance Supplier' },
    'hero.title1':   { fr: 'La Meilleure Sélection',            en: 'The Best Selection' },
    'hero.title2':   { fr: 'de Parfums de Gros',                en: 'of Wholesale Fragrances' },
    'hero.subtitle': { fr: 'Marques mondiales et orientales au meilleur prix grossiste. Livraison rapide à travers la région.', en: 'International and oriental brands at the best wholesale prices. Fast delivery across the region.' },
    'hero.cta1':     { fr: 'Explorer les Produits',             en: 'Explore Products' },
    'hero.cta2':     { fr: 'Nous Contacter',                    en: 'Contact Us' },
    'hero.scroll':   { fr: 'Découvrir',                         en: 'Discover' },

    // Stats
    'stats.brands':    { fr: 'Marques',          en: 'Brands' },
    'stats.products':  { fr: 'Produits',          en: 'Products' },
    'stats.delivery':  { fr: 'Livraison Rapide',  en: 'Fast Delivery' },
    'stats.authentic': { fr: 'Authentique',        en: 'Authentic' },
    'stats.countries': { fr: 'Pays servis',        en: 'Countries Served' },

    // Section headings (index)
    'section.featured':        { fr: 'Produits Vedettes',              en: 'Featured Products' },
    'section.featured.sub':    { fr: 'Les plus demandés par nos clients grossistes', en: 'Most requested by our wholesale clients' },
    'section.brands':          { fr: 'Nos Marques',                    en: 'Our Brands' },
    'section.brands.sub':      { fr: 'Plus de 893 marques disponibles', en: 'Over 893 brands available' },
    'section.why':             { fr: 'Pourquoi Nous Choisir ?',        en: 'Why Choose Us?' },
    'section.why.sub':         { fr: 'Ce qui nous distingue',          en: 'What sets us apart' },
    'section.how':             { fr: 'Comment Commander',              en: 'How to Order' },
    'section.how.sub':         { fr: 'Simple et rapide',               en: 'Simple and fast' },
    'section.testimonials':    { fr: 'Témoignages',                    en: 'Testimonials' },

    // Why cards
    'why.auth':          { fr: 'Produits Authentiques',        en: 'Authentic Products' },
    'why.auth.text':     { fr: '100% authentiques, sourcés directement des marques ou distributeurs agréés.', en: '100% authentic, sourced directly from brands or authorised distributors.' },
    'why.price':         { fr: 'Prix Compétitifs',             en: 'Competitive Prices' },
    'why.price.text':    { fr: 'Meilleurs tarifs grossiste, adaptés à votre volume de commande.', en: 'Best wholesale rates, adapted to your order volume.' },
    'why.delivery':      { fr: 'Livraison Rapide',             en: 'Fast Delivery' },
    'why.delivery.text': { fr: 'Expédition sous 1–3 jours ouvrables. Couverture GCC complète.', en: 'Dispatch within 1–3 business days. Full GCC coverage.' },
    'why.support':       { fr: 'Support Dédié',                en: 'Dedicated Support' },
    'why.support.text':  { fr: 'Un gestionnaire de compte dédié pour chaque client Pro et Entreprise.', en: 'A dedicated account manager for every Pro and Enterprise client.' },

    // Products page
    'products.title':    { fr: 'Catalogue Produits',           en: 'Product Catalogue' },
    'products.subtitle': { fr: 'Tous nos parfums de gros',     en: 'All our wholesale fragrances' },
    'products.search':   { fr: 'Rechercher...',                en: 'Search...' },
    'products.all':      { fr: 'Tous',                         en: 'All' },
    'products.instock':  { fr: 'En stock',                     en: 'In Stock' },
    'products.filter':   { fr: 'Filtres',                      en: 'Filters' },
    'products.sort':     { fr: 'Trier par',                    en: 'Sort by' },
    'products.results':  { fr: 'résultats',                    en: 'results' },
    'products.empty':    { fr: 'Aucun produit trouvé.',        en: 'No products found.' },
    'products.loading':  { fr: 'Chargement...',                en: 'Loading...' },

    // Categories
    'cat.homme':    { fr: 'Homme',    en: 'Men' },
    'cat.femme':    { fr: 'Femme',    en: 'Women' },
    'cat.unisexe':  { fr: 'Unisexe', en: 'Unisex' },
    'cat.oriental': { fr: 'Oriental', en: 'Oriental' },
    'cat.niche':    { fr: 'Niche',    en: 'Niche' },

    // Brands page
    'brands.title':   { fr: 'Toutes les Marques',              en: 'All Brands' },
    'brands.subtitle':{ fr: 'Plus de 893 marques disponibles', en: 'Over 893 brands available' },
    'brands.search':  { fr: 'Rechercher une marque...',        en: 'Search brands...' },
    'brands.all':     { fr: 'Toutes',                          en: 'All' },
    'brands.alpha':   { fr: 'Par lettre',                      en: 'By letter' },
    'brands.fragrance':{ fr: 'fragrances',                     en: 'fragrances' },
    'brands.view':    { fr: 'Voir la marque',                  en: 'View brand' },

    // About page
    'about.title':        { fr: 'À propos de BrotherScents',   en: 'About BrotherScents' },
    'about.subtitle':     { fr: 'Votre grossiste de confiance en parfums', en: 'Your trusted wholesale fragrance distributor' },
    'about.who.title':    { fr: 'Qui sommes-nous ?',           en: 'Who We Are' },
    'about.who.text':     { fr: 'BrotherScents est un distributeur grossiste de parfums de premier plan desservant les détaillants à travers la région GCC — UAE, Arabie Saoudite, Qatar, Koweït, Bahreïn et Oman.', en: 'BrotherScents is a leading wholesale fragrance distributor serving retailers across the GCC region — UAE, Saudi Arabia, Qatar, Kuwait, Bahrain, and Oman.' },
    'about.mission.title':{ fr: 'Notre Mission',               en: 'Our Mission' },
    'about.mission.text': { fr: 'Permettre aux détaillants et distributeurs d\'accéder aux meilleures marques mondiales et orientales au meilleur prix grossiste — avec authenticité garantie.', en: 'Enabling retailers and distributors to access the best international and oriental fragrance brands at the best wholesale prices — with guaranteed authenticity.' },
    'about.values.title': { fr: 'Nos Valeurs',                 en: 'Our Values' },
    'about.auth':         { fr: 'Authenticité',                en: 'Authenticity' },
    'about.auth.text':    { fr: '100% produits authentiques, sourcés directement des marques ou distributeurs agréés. Zéro contrefaçon.', en: '100% authentic products, sourced directly from brands or authorised distributors. Zero counterfeits.' },
    'about.trust':        { fr: 'Confiance',                   en: 'Trust' },
    'about.trust.text':   { fr: 'Des relations durables construites sur la transparence et la livraison fiable.', en: 'Long-lasting relationships built on transparency and reliable delivery.' },
    'about.quality':      { fr: 'Qualité',                     en: 'Quality' },
    'about.quality.text': { fr: 'Chaque produit est soigneusement sélectionné pour son excellence.', en: 'Every product carefully selected for its excellence.' },
    'about.speed':        { fr: 'Rapidité',                    en: 'Speed' },
    'about.speed.text':   { fr: 'Traitement rapide des commandes et expédition dans les 24–48h.', en: 'Fast order processing and dispatch within 24–48h.' },
    'about.located':      { fr: 'Basé à Dubaï, UAE',           en: 'Based in Dubai, UAE' },
    'about.serving':      { fr: 'Servant toute la région GCC', en: 'Serving the entire GCC region' },
    'about.since':        { fr: 'Partenaire de confiance',     en: 'Trusted Partner' },

    // Services page
    'services.title':        { fr: 'Nos Services',              en: 'Our Services' },
    'services.subtitle':     { fr: 'Solutions grossiste pour votre business', en: 'Wholesale solutions for your business' },
    'services.tiers.title':  { fr: 'Paliers Grossiste',         en: 'Wholesale Tiers' },
    'services.tiers.sub':    { fr: 'Tarification adaptée à votre volume', en: 'Pricing adapted to your volume' },
    'services.starter':      { fr: 'Débutant',                  en: 'Starter' },
    'services.pro':          { fr: 'Professionnel',             en: 'Professional' },
    'services.enterprise':   { fr: 'Entreprise',                en: 'Enterprise' },
    'services.starter.desc': { fr: 'Parfait pour commencer',   en: 'Perfect to get started' },
    'services.pro.desc':     { fr: 'Pour les acheteurs réguliers', en: 'For regular buyers' },
    'services.enterprise.desc': { fr: 'Pour les grandes chaînes et distributeurs', en: 'For large chains & distributors' },
    'services.min':          { fr: 'Minimum',                   en: 'Minimum' },
    'services.units':        { fr: 'unités',                    en: 'units' },
    'services.custom':       { fr: 'Sur mesure',                en: 'Custom' },
    'services.priority':     { fr: 'Prioritaire',               en: 'Priority' },
    'services.dispatch':     { fr: 'Expédition prioritaire',    en: 'Priority dispatch' },
    'services.manager':      { fr: 'Gestionnaire dédié',        en: 'Dedicated account manager' },
    'services.exclusive':    { fr: 'SKUs exclusifs',            en: 'Exclusive SKUs' },
    'services.logistics':    { fr: 'Support logistique',        en: 'Logistics support' },

    // How to order
    'order.step1':   { fr: 'Parcourir',                         en: 'Browse' },
    'order.step1.d': { fr: 'Explorez notre catalogue de 25 000+ produits', en: 'Explore our catalogue of 25,000+ products' },
    'order.step2':   { fr: 'S\'inscrire',                       en: 'Register' },
    'order.step2.d': { fr: 'Créez votre compte professionnel',  en: 'Create your business account' },
    'order.step3':   { fr: 'Approbation',                       en: 'Approval' },
    'order.step3.d': { fr: 'Approbation admin sous 24h',        en: 'Admin approval within 24h' },
    'order.step4':   { fr: 'Commander',                         en: 'Order' },
    'order.step4.d': { fr: 'Via WhatsApp pour le traitement le plus rapide', en: 'Via WhatsApp for fastest processing' },

    // Contact page
    'contact.title':     { fr: 'Contactez-nous',                en: 'Contact Us' },
    'contact.subtitle':  { fr: 'Notre équipe répond sous 1h en heures ouvrables', en: 'Our team replies within 1 hour during business hours' },
    'contact.whatsapp':  { fr: 'WhatsApp (recommandé)',         en: 'WhatsApp (recommended)' },
    'contact.email.lbl': { fr: 'Email',                         en: 'Email' },
    'contact.location':  { fr: 'Emplacement',                   en: 'Location' },
    'contact.location.v':{ fr: 'Dubaï, UAE',                   en: 'Dubai, UAE' },
    'contact.hours':     { fr: 'Heures d\'ouverture',           en: 'Business Hours' },
    'contact.hours.v':   { fr: 'Dim – Jeu, 9h – 18h GST',      en: 'Sun – Thu, 9am – 6pm GST' },
    'contact.form.title':{ fr: 'Envoyer un message',            en: 'Send a Message' },
    'contact.name':      { fr: 'Votre nom',                     en: 'Your name' },
    'contact.company':   { fr: 'Nom de l\'entreprise',          en: 'Company name' },
    'contact.message':   { fr: 'Votre message',                 en: 'Your message' },
    'contact.send':      { fr: 'Envoyer via WhatsApp',          en: 'Send via WhatsApp' },
    'contact.response':  { fr: 'Réponse sous 1h en heures ouvrables', en: 'Response within 1h during business hours' },

    // FAQ
    'faq.title':    { fr: 'Questions Fréquentes',               en: 'Frequently Asked Questions' },
    'faq.subtitle': { fr: 'Tout ce que vous devez savoir',      en: 'Everything you need to know' },
    'faq.search':   { fr: 'Rechercher une question...',         en: 'Search questions...' },
    'faq.q1':       { fr: 'Puis-je commander en tant que particulier ?', en: 'Can I order as an individual?' },
    'faq.a1':       { fr: 'BrotherScents est une plateforme grossiste pour les entreprises. La commande minimum est de 10 unités.', en: 'BrotherScents is a wholesale platform for businesses. Minimum order is 10 units.' },
    'faq.q2':       { fr: 'Comment voir les prix ?',            en: 'How do I see prices?' },
    'faq.a2':       { fr: 'Inscrivez-vous, attendez l\'approbation admin, puis connectez-vous. Les prix sont cachés pour les non-connectés.', en: 'Register, wait for admin approval, then sign in. Prices are hidden from unapproved users.' },
    'faq.q3':       { fr: 'Quelle est la commande minimum ?',   en: 'What is the minimum order?' },
    'faq.a3':       { fr: '10 unités minimum pour le palier Débutant. Les unités peuvent être mélangées entre produits.', en: '10 units minimum for the Starter tier. Units can be mixed across products.' },
    'faq.q4':       { fr: 'Combien de temps dure la livraison ?', en: 'How long does delivery take?' },
    'faq.a4':       { fr: '1–3 jours ouvrables dans les UAE. Autres pays GCC : 3–7 jours selon la destination.', en: '1–3 business days in UAE. Other GCC countries: 3–7 days depending on destination.' },
    'faq.q5':       { fr: 'Les produits sont-ils authentiques ?', en: 'Are the products authentic?' },
    'faq.a5':       { fr: 'Oui. 100% authentiques, sourcés des marques ou distributeurs agréés. Zéro contrefaçon.', en: 'Yes. 100% authentic, sourced from brands or authorised distributors. Zero counterfeits.' },

    // Common buttons & labels
    'btn.order':      { fr: 'Commander',                        en: 'Order Now' },
    'btn.browse':     { fr: 'Parcourir',                        en: 'Browse' },
    'btn.contact':    { fr: 'Contactez-nous',                   en: 'Contact Us' },
    'btn.signin':     { fr: 'Se connecter',                     en: 'Sign In' },
    'btn.register':   { fr: 'S\'inscrire',                      en: 'Register' },
    'btn.viewall':    { fr: 'Voir tout',                        en: 'View All' },
    'btn.readmore':   { fr: 'Lire la suite',                    en: 'Read More' },
    'btn.whatsapp':   { fr: 'Commander sur WhatsApp',           en: 'Order on WhatsApp' },
    'btn.getstarted': { fr: 'Commencer',                        en: 'Get Started' },
    'btn.learn':      { fr: 'En savoir plus',                   en: 'Learn More' },

    // Price / Auth
    'price.signin':    { fr: '🔒 Connectez-vous pour le prix', en: '🔒 Sign in for price' },
    'price.retail':    { fr: 'Prix public',                     en: 'Retail price' },
    'price.wholesale': { fr: 'Prix gros',                       en: 'Wholesale price' },
    'price.moq':       { fr: 'QMC',                             en: 'MOQ' },
    'auth.login.title':    { fr: 'Connexion',                   en: 'Sign In' },
    'auth.register.title': { fr: 'Inscription',                 en: 'Register' },
    'auth.email':          { fr: 'Email',                       en: 'Email' },
    'auth.password':       { fr: 'Mot de passe',                en: 'Password' },
    'auth.name':           { fr: 'Nom complet',                 en: 'Full name' },
    'auth.company':        { fr: 'Entreprise',                  en: 'Company' },
    'auth.phone':          { fr: 'Téléphone',                   en: 'Phone' },
    'auth.submit.login':   { fr: 'Se connecter',                en: 'Sign In' },
    'auth.submit.reg':     { fr: 'Créer un compte',             en: 'Create Account' },
    'auth.switch.reg':     { fr: 'Pas de compte ? S\'inscrire', en: 'No account? Register' },
    'auth.switch.login':   { fr: 'Déjà inscrit ? Connexion',    en: 'Already registered? Sign In' },

    // Blog
    'blog.title':    { fr: 'Blog Parfums Grossiste',            en: 'Wholesale Fragrance Blog' },
    'blog.subtitle': { fr: 'Guides de marché et actualités pour les acheteurs GCC', en: 'Market guides and news for GCC buyers' },
    'blog.readtime': { fr: 'min de lecture',                    en: 'min read' },
    'blog.all':      { fr: 'Tous',                              en: 'All' },
    'blog.guide':    { fr: 'Guide Grossiste',                   en: 'Wholesale Guide' },
    'blog.market':   { fr: 'Intelligence Marché',               en: 'Market Intelligence' },
    'blog.brand':    { fr: 'Marque en Vedette',                 en: 'Brand Spotlight' },
    'blog.business': { fr: 'Guide Business',                    en: 'Business Guide' },

    // Footer
    'footer.rights':    { fr: '© 2025 BrotherScents. Tous droits réservés.', en: '© 2025 BrotherScents. All rights reserved.' },
    'footer.wholesale': { fr: 'Grossiste',                      en: 'Wholesale' },
    'footer.resources': { fr: 'Ressources',                     en: 'Resources' },
    'footer.pages':     { fr: 'Pages',                          en: 'Pages' },
    'footer.desc':      { fr: 'Distributeur grossiste de parfums — GCC & Algérie', en: 'Wholesale fragrance distributor — GCC & Algeria' },
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
    langBtn.title     = lang === 'fr' ? 'Switch to English' : 'Passer en Français';
    langBtn.className = 'p-1.5 rounded-xl hover:bg-white/5 transition-colors text-xs font-bold text-gray-400 hover:text-purple-400 w-9 h-9 flex items-center justify-center border border-white/10';
    langBtn.textContent = lang === 'fr' ? 'EN' : 'FR';
    langBtn.onclick = () => {
      lang = lang === 'fr' ? 'en' : 'fr';
      localStorage.setItem(LANG_KEY, lang);
      langBtn.textContent = lang === 'fr' ? 'EN' : 'FR';
      langBtn.title = lang === 'fr' ? 'Switch to English' : 'Passer en Français';
      translateAll();
    };

    // Theme toggle button
    const themeBtn = document.createElement('button');
    themeBtn.id        = 'bs-theme-btn';
    themeBtn.title     = theme === 'dark' ? 'Light mode' : 'Dark mode';
    themeBtn.className = 'p-2 rounded-xl hover:bg-white/5 transition-colors text-gray-400 hover:text-purple-400';
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
  }

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
