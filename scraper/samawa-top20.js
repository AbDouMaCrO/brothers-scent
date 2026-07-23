/**
 * Samawa.ae — top 20 per brand scraper
 *
 * Fetches all products, groups by vendor, takes first 20 per brand
 * (catalogue default order ≈ featured/popular on Shopify stores).
 *
 * Usage:
 *   SUPABASE_SERVICE_KEY=xxx node samawa-top20.js
 *   node samawa-top20.js          # dry-run, saves to output/samawa-top20.json only
 */

const { createClient } = require('@supabase/supabase-js');
const fs   = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://lumhgprmkwjsbpvgckeq.supabase.co';
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_KEY;
const BASE_URL     = 'https://samawa.ae';
const DELAY_MS     = 1200;
const TOP_N        = 20;

const delay = ms => new Promise(r => setTimeout(r, ms));

const TAG_MAP = {
  homme:    ['men', "men's", 'for him', 'for men', 'homme'],
  femme:    ['women', "women's", 'for her', 'for women', 'femme', 'ladies'],
  unisexe:  ['unisex', 'unisexe'],
  oriental: ['arabic', 'oud', 'oriental', 'bakhoor', 'niche'],
};

function inferCategory(tags = [], title = '') {
  const h = [...tags, title].join(' ').toLowerCase();
  for (const [cat, kws] of Object.entries(TAG_MAP)) {
    if (kws.some(k => h.includes(k))) return cat;
  }
  return 'oriental';
}

function extractSize(variantTitle = '', productTitle = '') {
  const text = variantTitle !== 'Default Title' ? variantTitle : productTitle;
  const m = text.match(/(\d+(?:\.\d+)?\s*(?:ml|g|oz))/i);
  return m ? m[1].replace(/\s+/, '').toLowerCase() : '100ml';
}

async function fetchPage(page) {
  const url = `${BASE_URL}/products.json?limit=250&page=${page}`;
  const res  = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; scraper/1.0)', Accept: 'application/json' },
  });
  if (res.status === 400 || res.status === 404) return null;
  if (!res.ok) throw new Error(`HTTP ${res.status} on page ${page}`);
  const json = await res.json();
  return json.products || [];
}

async function fetchAll() {
  const all = [];
  let page = 1;
  while (true) {
    process.stdout.write(`  page ${page}… `);
    const batch = await fetchPage(page);
    if (!batch || !batch.length) { console.log('done'); break; }
    all.push(...batch);
    console.log(`+${batch.length} → ${all.length}`);
    page++;
    await delay(DELAY_MS);
  }
  return all;
}

function mapProduct(p, variant) {
  const retail    = variant.compare_at_price ? parseFloat(variant.compare_at_price) : parseFloat(variant.price);
  const wholesale = parseFloat(variant.price);
  return {
    name:          p.title,
    brand:         p.vendor,
    category_slug: inferCategory(p.tags || [], p.title),
    size:          extractSize(variant.title || '', p.title || ''),
    price_retail:  isNaN(retail)    ? 0 : Math.round(retail),
    price_gros:    isNaN(wholesale) ? 0 : Math.round(wholesale),
    stock:         999,
    badge:         variant.compare_at_price ? 'SALE' : '',
    img:           p.images?.[0]?.src || '',
    active:        true,
  };
}

function buildTop20(raw) {
  // Group products by vendor, preserving catalog order (position ≈ popularity on Shopify)
  const byBrand = new Map();
  for (const p of raw) {
    const brand = p.vendor || 'Unknown';
    if (!byBrand.has(brand)) byBrand.set(brand, []);
    byBrand.get(brand).push(p);
  }

  const rows = [];
  for (const [brand, products] of byBrand) {
    const top = products.slice(0, TOP_N);
    for (const p of top) {
      // Only take the first (default) variant to keep it simple
      const v = p.variants?.[0];
      if (v) rows.push(mapProduct(p, v));
    }
    console.log(`  ${brand}: ${top.length} products`);
  }
  return rows;
}

async function upsertToSupabase(rows) {
  if (!SERVICE_KEY) { console.log('\nNo SUPABASE_SERVICE_KEY — skipping upload'); return; }

  const sb = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Deduplicate on (name, brand, size)
  const seen = new Map();
  for (const r of rows) {
    const key = `${r.name}|${r.brand}|${r.size}`;
    if (!seen.has(key)) seen.set(key, r);
  }
  const deduped = [...seen.values()];
  console.log(`\nUpserting ${deduped.length} rows (${rows.length - deduped.length} dupes removed)…`);

  const BATCH = 50;
  let ok = 0;
  for (let i = 0; i < deduped.length; i += BATCH) {
    const { error } = await sb.from('products').upsert(deduped.slice(i, i + BATCH), { onConflict: 'name,brand,size' });
    if (error) console.error(`  batch ${Math.floor(i / BATCH) + 1} error:`, error.message);
    else { ok += Math.min(BATCH, deduped.length - i); process.stdout.write('.'); }
  }
  console.log(`\n✅  ${ok} rows upserted`);
}

async function main() {
  console.log('Samawa.ae top-20-per-brand scraper\n');

  const raw = await fetchAll();
  console.log(`\nFetched ${raw.length} raw products from ${[...new Set(raw.map(p => p.vendor))].length} brands\n`);

  console.log('Building top-20 per brand:');
  const rows = buildTop20(raw);
  console.log(`\nTotal rows: ${rows.length}`);

  const outDir  = path.join(__dirname, 'output');
  const outFile = path.join(outDir, 'samawa-top20.json');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(outFile, JSON.stringify({ scraped_at: new Date().toISOString(), count: rows.length, products: rows }, null, 2));
  console.log(`Saved → ${outFile}`);

  await upsertToSupabase(rows);
}

main().catch(err => { console.error('Fatal:', err.message); process.exit(1); });
