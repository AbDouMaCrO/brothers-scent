/**
 * Single-product test for samawa.js scraper logic.
 * Usage: node samawa-test.js <product-url>
 * Example: node samawa-test.js https://samawa.ae/products/armaf-club-de-nuit-intense-perfume-for-men-eau-de-toilette-105ml
 */

const url = process.argv[2];
if (!url) {
  console.error('Usage: node samawa-test.js <product-url>');
  process.exit(1);
}

// Extract handle from URL path
const handle = url.split('/products/')[1]?.split('?')[0];
if (!handle) {
  console.error('Not a valid /products/<handle> URL');
  process.exit(1);
}

const apiUrl = `https://samawa.ae/products/${handle}.json`;
console.log(`\nFetching: ${apiUrl}\n`);

// ── Same category/size helpers as samawa.js ───────────────────────────────────
const TAG_MAP = {
  homme:   ['men', "men's", 'for him', 'for men', 'homme'],
  femme:   ['women', "women's", 'for her', 'for women', 'femme', 'ladies'],
  unisexe: ['unisex', 'unisexe'],
  oriental: ['arabic', 'oud', 'oriental', 'bakhoor'],
  niche:   ['niche'],
};

function inferCategory(tags = [], title = '') {
  const haystack = [...tags, title].join(' ').toLowerCase();
  for (const [cat, keywords] of Object.entries(TAG_MAP)) {
    if (keywords.some((k) => haystack.includes(k))) return cat;
  }
  return 'oriental';
}

function extractSize(variantTitle = '', productTitle = '') {
  const text = variantTitle !== 'Default Title' ? variantTitle : productTitle;
  const m = text.match(/(\d+(?:\.\d+)?\s*(?:ml|g|oz))/i);
  return m ? m[1].replace(/\s+/, '').toLowerCase() : '100ml';
}

function stripHtml(html = '') {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

(async () => {
  const res  = await fetch(apiUrl);
  if (!res.ok) { console.error(`HTTP ${res.status}`); process.exit(1); }
  const { product: p } = await res.json();

  const variant = p.variants[0]; // first variant

  const result = {
    title:       p.title,
    brand:       p.vendor,
    description: stripHtml(p.body_html).slice(0, 300) + (p.body_html?.length > 300 ? '…' : ''),
    image:       p.images[0]?.src || null,
    all_images:  p.images.map((i) => i.src),
    price_aed:   parseFloat(variant.price),
    compare_at:  variant.compare_at_price ? parseFloat(variant.compare_at_price) : null,
    sku:         variant.sku,
    tags:        Array.isArray(p.tags) ? p.tags : (p.tags || '').split(',').map(t => t.trim()).filter(Boolean),
    category:    inferCategory(Array.isArray(p.tags) ? p.tags : (p.tags || '').split(','), p.title),
    size:        extractSize(variant.title, p.title),
    product_url: `https://samawa.ae/products/${p.handle}`,
  };

  console.log('─'.repeat(60));
  console.log('TITLE      :', result.title);
  console.log('BRAND      :', result.brand);
  console.log('PRICE (AED):', result.price_aed, result.compare_at ? `(was ${result.compare_at})` : '');
  console.log('SIZE       :', result.size);
  console.log('CATEGORY   :', result.category);
  console.log('SKU        :', result.sku);
  console.log('IMAGE      :', result.image);
  console.log('ALL IMAGES :', result.all_images.length, 'total');
  result.all_images.forEach((src, i) => console.log(`  [${i}] ${src}`));
  console.log('TAGS       :', result.tags.join(', '));
  console.log('DESC       :', result.description);
  console.log('URL        :', result.product_url);
  console.log('─'.repeat(60));

  console.log('\n✓ Would insert to Supabase as:');
  const row = {
    name:          result.title,
    brand:         result.brand,
    category_slug: result.category,
    size:          result.size,
    price_retail:  result.compare_at ?? result.price_aed,
    price_gros:    result.price_aed,
    stock:         999,
    badge:         result.compare_at ? 'SALE' : '',
    img:           result.image,
    active:        true,
  };
  console.log(JSON.stringify(row, null, 2));
})();
