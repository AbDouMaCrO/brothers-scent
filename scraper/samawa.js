/**
 * Samawa.ae Product Scraper
 *
 * Uses Shopify's public products.json API — no browser required.
 *
 * Outputs:
 *   scraper/output/samawa.json          — all raw products
 *   Supabase table: products            (if SUPABASE_SERVICE_KEY set)
 *
 * Usage: node samawa.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs   = require('fs');
const path = require('path');

const SUPABASE_URL  = 'https://lumhgprmkwjsbpvgckeq.supabase.co';
const SERVICE_KEY   = process.env.SUPABASE_SERVICE_KEY;

const BASE_URL      = 'https://samawa.ae';
const DELAY_MS      = 1500; // polite delay between pages

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

// ── Category inference from Shopify tags ─────────────────────────────────────
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
  return 'oriental'; // default for Gulf store
}

// ── Size extraction ───────────────────────────────────────────────────────────
function extractSize(variantTitle = '', productTitle = '') {
  const text = variantTitle !== 'Default Title' ? variantTitle : productTitle;
  const m = text.match(/(\d+(?:\.\d+)?\s*(?:ml|g|oz))/i);
  return m ? m[1].replace(/\s+/, '').toLowerCase() : '100ml';
}

// ── Fetch one page — returns null on 400/404 (end of catalogue) ───────────────
async function fetchPage(page) {
  const url = `${BASE_URL}/products.json?limit=250&page=${page}`;
  const res  = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; scraper/1.0)',
      Accept: 'application/json',
    },
  });
  if (res.status === 400 || res.status === 404) return null; // Shopify end-of-catalogue
  if (!res.ok) throw new Error(`HTTP ${res.status} on page ${page}`);
  const json = await res.json();
  return json.products || [];
}

// ── Fetch ALL pages ───────────────────────────────────────────────────────────
async function fetchAllProducts() {
  const all = [];
  let page  = 1;

  while (true) {
    console.log(`  📄  page ${page}…`);
    const batch = await fetchPage(page);
    if (batch === null) { console.log('  ✓  done (end of catalogue)'); break; }
    if (!batch.length)  { console.log('  ✓  done (empty page)'); break; }
    all.push(...batch);
    console.log(`      +${batch.length} → total ${all.length}`);
    page++;
    await delay(DELAY_MS);
  }

  return all;
}

// ── Map Shopify product → our products table row ──────────────────────────────
function mapProduct(p, variant) {
  const retail    = variant.compare_at_price ? parseFloat(variant.compare_at_price) : parseFloat(variant.price);
  const wholesale = parseFloat(variant.price);
  const img       = p.images?.[0]?.src || null;
  const size      = extractSize(variant.title || '', p.title || '');

  return {
    name:          p.title,
    brand:         p.vendor,
    category_slug: inferCategory(p.tags || [], p.title),
    size,
    price_retail:  isNaN(retail)    ? 0 : retail,
    price_gros:    isNaN(wholesale) ? 0 : wholesale,
    stock:         999,
    badge:         variant.compare_at_price ? 'SALE' : '',
    img,
    active:        true,
    // extra metadata stored for reference (not in products table schema)
    _handle:       p.handle,
    _sku:          variant.sku,
    _tags:         p.tags,
    _product_type: p.product_type,
    _url:          `${BASE_URL}/products/${p.handle}`,
  };
}

function expandVariants(products) {
  const rows = [];
  for (const p of products) {
    for (const v of p.variants || []) {
      rows.push(mapProduct(p, v));
    }
  }
  return rows;
}

// ── Supabase upsert ───────────────────────────────────────────────────────────
async function uploadToSupabase(rows) {
  if (!SERVICE_KEY) { console.log('\nNo SUPABASE_SERVICE_KEY — skip upload'); return; }

  const sb = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Strip extra metadata fields before insert
  const clean = rows.map(({ _handle, _sku, _tags, _product_type, _url, ...r }) => r);

  // Deduplicate on (name, brand, size)
  const seen   = new Map();
  for (const r of clean) {
    const key = `${r.name}|${r.brand}|${r.size}`;
    if (!seen.has(key)) seen.set(key, r);
  }
  const deduped = [...seen.values()];
  console.log(`\n⬆️  Upserting ${deduped.length} rows (${clean.length - deduped.length} dupes removed)…`);

  const BATCH = 50;
  let upserted = 0;
  for (let i = 0; i < deduped.length; i += BATCH) {
    const batch = deduped.slice(i, i + BATCH);
    const { error } = await sb.from('products').upsert(batch, { onConflict: 'name,brand,size' });
    if (error) console.error(`❌  batch ${Math.floor(i / BATCH) + 1}:`, error.message);
    else { upserted += batch.length; process.stdout.write('.'); }
  }
  console.log(`\n✅  products: ${upserted} upserted`);
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🕌  Samawa.ae scraper starting…\n');

  const raw  = await fetchAllProducts();
  console.log(`\n✓ ${raw.length} products fetched`);

  const rows = expandVariants(raw);
  console.log(`✓ ${rows.length} rows after variant expansion`);

  // Save full output
  const outDir = path.join(__dirname, 'output');
  fs.mkdirSync(outDir, { recursive: true });

  const outFile = path.join(outDir, 'samawa.json');
  fs.writeFileSync(outFile, JSON.stringify({
    scraped_at: new Date().toISOString(),
    source:     BASE_URL,
    count:      rows.length,
    products:   rows,
  }, null, 2));
  console.log(`📄  samawa.json saved (${rows.length} rows)`);

  await uploadToSupabase(rows);
}

main().catch((err) => { console.error('Fatal:', err.message); process.exit(1); });
