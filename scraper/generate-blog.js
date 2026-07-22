/**
 * AI Blog Generator — BrotherScents
 *
 * Reads blog/topics.json, generates SEO articles via OpenRouter,
 * saves as blog/{slug}.html, updates blog/data.json + sitemap.xml.
 *
 * Usage: node generate-blog.js
 * Env:   OPENROUTER_API_KEY  (required)
 *        OPENROUTER_MODEL    (optional, default: openai/gpt-4o-mini)
 */

const fs   = require('fs');
const path = require('path');

const OPENROUTER_KEY   = process.env.OPENROUTER_API_KEY;
const MODEL            = process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini';
const SITE_URL         = 'https://brotherscents.vercel.app';
const BLOG_DIR         = path.join(__dirname, '..', 'blog');
const DATA_FILE        = path.join(BLOG_DIR, 'data.json');
const TOPICS_FILE      = path.join(__dirname, 'blog-topics.json');
const SITEMAP_FILE     = path.join(__dirname, '..', 'sitemap.xml');

if (!OPENROUTER_KEY) {
    console.error('OPENROUTER_API_KEY not set');
    process.exit(1);
}

const delay = (ms) => new Promise(r => setTimeout(r, ms));

// ── Generate article via OpenRouter ──────────────────────────────────────────
async function generateArticle(topic) {
    const systemPrompt = `You are an expert content writer for BrotherScents, a wholesale fragrance distributor in Dubai, UAE.
Write SEO-optimised blog articles targeting fragrance retailers and wholesale buyers in the GCC (UAE, Saudi Arabia, Kuwait, Qatar).

Writing rules:
- 1000-1400 words of actual body content
- Use H2 and H3 headings (HTML tags)
- Write in confident, authoritative tone — like a seasoned industry insider
- Include specific product names, brand names, and real market data where relevant
- Naturally mention BrotherScents once or twice as the supplier
- End with a clear call-to-action
- Return ONLY the article body HTML (no <html>/<head>/<body> tags) — just the content between <article> tags`;

    const userPrompt = `Write a complete SEO blog article about: "${topic.title}"

Target keywords: ${topic.keywords}
Category: ${topic.category}

Requirements:
- Start with a compelling intro paragraph (no H2 yet)
- Use 4-6 H2 sections with descriptive headings
- Include H3 subheadings within 2-3 sections
- Mention specific perfume brands and products by name (Armaf, Lattafa, Dior, Chanel, Rasasi, Al Haramain, etc.)
- Include practical advice for wholesale buyers
- Natural keyword placement — not spammy
- Internal links: reference BrotherScents catalogue at /pages/products.html and /pages/brands.html
- Final paragraph should be a soft CTA to contact BrotherScents

Return only the article body HTML — no doc structure.`;

    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${OPENROUTER_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': SITE_URL,
            'X-Title': 'BrotherScents Blog Generator',
        },
        body: JSON.stringify({
            model: MODEL,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user',   content: userPrompt },
            ],
            max_tokens: 2000,
        }),
    });

    if (!res.ok) throw new Error(`OpenRouter ${res.status}: ${await res.text()}`);
    const json = await res.json();
    return json.choices[0].message.content;
}

// ── Wrap article body in full HTML page ──────────────────────────────────────
function buildHtml(topic, body) {
    const schemaArticle = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Article',
        'headline': topic.title,
        'description': topic.description,
        'keywords': topic.keywords,
        'datePublished': topic.published,
        'dateModified': topic.updated || topic.published,
        'author': { '@type': 'Organization', 'name': 'BrotherScents', 'url': SITE_URL },
        'publisher': {
            '@type': 'Organization',
            'name': 'BrotherScents',
            'url': SITE_URL,
            'logo': { '@type': 'ImageObject', 'url': `${SITE_URL}/images/logo.png` },
        },
        'mainEntityOfPage': { '@type': 'WebPage', '@id': `${SITE_URL}/blog/${topic.slug}.html` },
    });

    const categoryColors = {
        'Wholesale Guide': 'text-purple-400 bg-purple-900/30',
        'Market Intelligence': 'text-blue-400 bg-blue-900/30',
        'Brand Spotlight': 'text-yellow-400 bg-yellow-900/30',
        'Business Guide': 'text-green-400 bg-green-900/30',
    };
    const catClass = categoryColors[topic.category] || 'text-gray-400 bg-gray-900/30';

    return `<!DOCTYPE html>
<html lang="en" class="dark scroll-smooth">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${topic.title} — BrotherScents</title>
    <meta name="description" content="${topic.description}">
    <meta name="keywords" content="${topic.keywords}">
    <link rel="canonical" href="${SITE_URL}/blog/${topic.slug}.html">
    <meta property="og:type" content="article">
    <meta property="og:title" content="${topic.title}">
    <meta property="og:description" content="${topic.description}">
    <meta property="og:url" content="${SITE_URL}/blog/${topic.slug}.html">
    <meta property="article:published_time" content="${topic.published}">
    <link rel="manifest" href="/manifest.json">
    <meta name="theme-color" content="#050505">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://code.iconify.design/iconify-icon/1.0.7/iconify-icon.min.js"></script>
    <script type="application/ld+json">${schemaArticle}</script>
    <script>
        tailwind.config = {
            darkMode:'class',
            theme:{extend:{fontFamily:{sans:['Inter','sans-serif']},colors:{purple:{400:'#c084fc',500:'#a855f7',600:'#9333ea',700:'#7e22ce',900:'#3b0764'}}}}
        }
    </script>
    <style>
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family:'Inter',sans-serif; background:#050505; color:#fff; overflow-x:hidden; }
        ::-webkit-scrollbar { width:6px; }
        ::-webkit-scrollbar-thumb { background:#3b0764; border-radius:3px; }
        .glass-panel { background:rgba(255,255,255,0.04); backdrop-filter:blur(12px); border:1px solid rgba(255,255,255,0.08); }
        .card-bg { background:linear-gradient(180deg,rgba(255,255,255,0.04) 0%,rgba(255,255,255,0.01) 100%); border:1px solid rgba(255,255,255,0.06); }
        .gradient-text { background:linear-gradient(to right,#e9d5ff,#a855f7,#6366f1); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
        .gradient-divider { height:1px; background:linear-gradient(to right,transparent,#3b0764,transparent); }
        .prose { color:#d1d5db; line-height:1.85; max-width:720px; margin:0 auto; }
        .prose h2 { color:#fff; font-size:1.35rem; font-weight:700; margin-top:2.5rem; margin-bottom:1rem; }
        .prose h3 { color:#e9d5ff; font-size:1.05rem; font-weight:600; margin-top:1.5rem; margin-bottom:0.5rem; }
        .prose p { margin-bottom:1.2rem; }
        .prose ul { list-style:disc; padding-left:1.5rem; margin-bottom:1.2rem; }
        .prose ol { list-style:decimal; padding-left:1.5rem; margin-bottom:1.2rem; }
        .prose li { margin-bottom:0.4rem; }
        .prose strong { color:#fff; font-weight:600; }
        .prose a { color:#c084fc; text-decoration:underline; text-underline-offset:3px; }
        .prose a:hover { color:#a855f7; }
        .prose blockquote { border-left:3px solid #7e22ce; padding-left:1rem; color:#9ca3af; margin:1.5rem 0; font-style:italic; }
    </style>
</head>
<body>

<!-- Nav -->
<nav class="fixed top-0 left-0 right-0 z-50 glass-panel">
    <div class="max-w-7xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between">
        <a href="/index.html" class="flex items-center gap-2">
            <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center">
                <iconify-icon icon="lucide:droplets" width="18" class="text-white"></iconify-icon>
            </div>
            <span class="font-semibold text-white text-sm">BrotherScents</span>
        </a>
        <div class="hidden lg:flex items-center gap-8">
            <a href="/index.html" class="text-sm text-gray-400 hover:text-purple-400 transition-colors">Home</a>
            <a href="/pages/products.html" class="text-sm text-gray-400 hover:text-purple-400 transition-colors">Products</a>
            <a href="/pages/brands.html" class="text-sm text-gray-400 hover:text-purple-400 transition-colors">Brands</a>
            <a href="/blog/index.html" class="text-sm text-purple-400">Blog</a>
            <a href="/pages/contact.html" class="text-sm text-gray-400 hover:text-purple-400 transition-colors">Contact</a>
        </div>
        <a href="/pages/contact.html" class="hidden md:inline-flex items-center gap-2 bg-white text-black text-sm font-semibold px-5 py-2.5 rounded-xl hover:scale-105 transition-transform">
            <iconify-icon icon="lucide:phone" width="14"></iconify-icon>
            Order Now
        </a>
    </div>
</nav>

<!-- Breadcrumb -->
<div class="pt-20 pb-4 px-4 max-w-3xl mx-auto">
    <div class="flex items-center gap-2 text-xs text-gray-500">
        <a href="/index.html" class="hover:text-purple-400">Home</a>
        <iconify-icon icon="lucide:chevron-right" width="10"></iconify-icon>
        <a href="/blog/index.html" class="hover:text-purple-400">Blog</a>
        <iconify-icon icon="lucide:chevron-right" width="10"></iconify-icon>
        <span class="text-gray-400 truncate">${topic.title}</span>
    </div>
</div>

<!-- Article hero -->
<header class="px-4 pb-10 max-w-3xl mx-auto">
    <span class="inline-block text-[10px] font-semibold px-2.5 py-1 rounded-full mb-4 ${catClass}">${topic.category}</span>
    <h1 class="text-3xl md:text-4xl font-bold leading-tight mb-4">${topic.title}</h1>
    <p class="text-gray-400 text-base leading-relaxed mb-6">${topic.description}</p>
    <div class="flex items-center gap-4 text-xs text-gray-500">
        <span class="flex items-center gap-1.5"><iconify-icon icon="lucide:building-2" width="12"></iconify-icon>BrotherScents</span>
        <span class="flex items-center gap-1.5"><iconify-icon icon="lucide:calendar" width="12"></iconify-icon>${new Date(topic.published).toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'})}</span>
        <span class="flex items-center gap-1.5"><iconify-icon icon="lucide:clock" width="12"></iconify-icon>${topic.readTime} read</span>
    </div>
</header>

<div class="gradient-divider max-w-3xl mx-auto mb-10"></div>

<!-- Article body -->
<main class="px-4 pb-16">
    <article class="prose">
        ${body}
    </article>

    <!-- CTA -->
    <div class="max-w-3xl mx-auto mt-16 card-bg rounded-2xl p-8 text-center">
        <iconify-icon icon="lucide:sparkles" width="28" class="text-purple-400 mb-4"></iconify-icon>
        <h3 class="text-xl font-bold mb-3">Ready to stock up?</h3>
        <p class="text-gray-400 text-sm mb-6">Browse 25,000+ authentic fragrances across 893 brands. Wholesale pricing unlocked after free account approval.</p>
        <div class="flex flex-col sm:flex-row gap-3 justify-center">
            <a href="https://wa.me/" id="waOrder"
               class="inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1fba5a] text-white font-semibold px-7 py-3.5 rounded-xl transition-colors text-sm">
                <iconify-icon icon="ic:baseline-whatsapp" width="18"></iconify-icon>
                Order via WhatsApp
            </a>
            <a href="/pages/brands.html"
               class="inline-flex items-center justify-center gap-2 glass-panel text-white font-semibold px-7 py-3.5 rounded-xl hover:border-purple-500/40 transition-colors text-sm">
                <iconify-icon icon="lucide:building-2" width="16"></iconify-icon>
                Browse Brands
            </a>
        </div>
    </div>
</main>

<!-- Footer -->
<footer class="border-t border-white/5 py-8 px-4">
    <div class="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div class="flex items-center gap-2">
            <div class="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center">
                <iconify-icon icon="lucide:droplets" width="14" class="text-white"></iconify-icon>
            </div>
            <span class="font-semibold text-sm">BrotherScents</span>
        </div>
        <p class="text-gray-500 text-xs">&copy; 2025 BrotherScents. All rights reserved.</p>
    </div>
</footer>

<script>
try {
    const s = JSON.parse(localStorage.getItem('ls_settings')||'{}');
    if (s.whatsappNumber) document.getElementById('waOrder').href = 'https://wa.me/'+s.whatsappNumber;
} catch(_){}
</script>
</body>
</html>`;
}

// ── Regenerate sitemap.xml ────────────────────────────────────────────────────
function regenerateSitemap(articles) {
    const staticPages = [
        { url: '/', priority: '1.0', changefreq: 'weekly' },
        { url: '/pages/products.html', priority: '0.9', changefreq: 'daily' },
        { url: '/pages/brands.html',   priority: '0.9', changefreq: 'daily' },
        { url: '/pages/services.html', priority: '0.7', changefreq: 'monthly' },
        { url: '/pages/about.html',    priority: '0.6', changefreq: 'monthly' },
        { url: '/pages/contact.html',  priority: '0.7', changefreq: 'monthly' },
        { url: '/pages/faq.html',      priority: '0.6', changefreq: 'monthly' },
        { url: '/blog/index.html',     priority: '0.8', changefreq: 'weekly' },
    ];

    const now = new Date().toISOString().split('T')[0];
    const urls = [
        ...staticPages.map(p => `
    <url>
        <loc>${SITE_URL}${p.url}</loc>
        <lastmod>${now}</lastmod>
        <changefreq>${p.changefreq}</changefreq>
        <priority>${p.priority}</priority>
    </url>`),
        ...articles.map(a => `
    <url>
        <loc>${SITE_URL}/blog/${a.slug}.html</loc>
        <lastmod>${a.updated || a.published}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.7</priority>
    </url>`),
    ].join('');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

    fs.writeFileSync(SITEMAP_FILE, xml.trim());
    console.log(`📄  sitemap.xml updated (${staticPages.length + articles.length} URLs)`);
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
    if (!fs.existsSync(TOPICS_FILE)) {
        console.error('blog-topics.json not found');
        process.exit(1);
    }

    const topics   = JSON.parse(fs.readFileSync(TOPICS_FILE, 'utf8'));
    const dataFile = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    const published = new Set(dataFile.articles.map(a => a.slug));

    const toGenerate = topics.filter(t => !published.has(t.slug));
    console.log(`📝  ${toGenerate.length} new topics to generate (${topics.length - toGenerate.length} already published)\n`);

    if (!toGenerate.length) {
        console.log('Nothing to generate. Add topics to blog-topics.json.');
        regenerateSitemap(dataFile.articles);
        return;
    }

    for (const topic of toGenerate) {
        console.log(`Generating: ${topic.title}`);
        try {
            const body    = await generateArticle(topic);
            const html    = buildHtml(topic, body);
            const outFile = path.join(BLOG_DIR, `${topic.slug}.html`);

            fs.writeFileSync(outFile, html);
            console.log(`  ✓ ${topic.slug}.html`);

            // Add to data.json
            dataFile.articles.unshift({
                slug:        topic.slug,
                title:       topic.title,
                description: topic.description,
                keywords:    topic.keywords,
                category:    topic.category,
                published:   topic.published || new Date().toISOString().split('T')[0],
                updated:     new Date().toISOString().split('T')[0],
                readTime:    topic.readTime || '6 min',
                featured:    topic.featured || false,
            });
            fs.writeFileSync(DATA_FILE, JSON.stringify(dataFile, null, 2));

            await delay(2000); // rate limit
        } catch (err) {
            console.error(`  ✗ ${topic.slug}: ${err.message}`);
        }
    }

    regenerateSitemap(dataFile.articles);
    console.log('\n✅  Blog generation complete');
}

main().catch(err => { console.error('Fatal:', err.message); process.exit(1); });
