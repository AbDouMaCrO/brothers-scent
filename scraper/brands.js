/**
 * Fragrantica Brand + Fragrance Scraper — UAE & Saudi Arabia
 *
 * Outputs:
 *   scraper/output/brands.json              — country → ranked brand list
 *   scraper/output/fragrances/{slug}.json   — top 10 fragrances per brand
 *   Supabase table: scraped_brands          (if SUPABASE_SERVICE_KEY set)
 *
 * Usage: node brands.js
 */

const { chromium } = require('playwright-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

chromium.use(StealthPlugin());

const SUPABASE_URL = 'https://lumhgprmkwjsbpvgckeq.supabase.co';
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_KEY;

const COUNTRIES = [
  { name: 'UAE',          url: 'https://www.fragrantica.com/country/United%20Arab%20Emirates.html' },
  { name: 'Saudi Arabia', url: 'https://www.fragrantica.com/country/Saudi%20Arabia.html' },
];

const delay = (ms) => new Promise((r) => setTimeout(r, ms));
const jitter = (base, spread = 2000) => base + Math.random() * spread;

// ── Country page: extract ranked brands ──────────────────────────────────────
async function scrapeCountry(page, country) {
  console.log(`\n🌍  ${country.name}…`);

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      await page.goto(country.url, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await delay(jitter(4000));
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
      await delay(jitter(1500));
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await delay(jitter(1500));

      const brands = await page.evaluate(() => {
        const map = {};
        document.querySelectorAll('a[href*="/designers/"]').forEach((a) => {
          const href = a.href;
          const text = (a.textContent || '').trim();
          if (!text || text.length < 2) return;
          const slug = href.split('/designers/')[1]?.replace('.html', '') || '';
          if (!slug) return;
          if (!map[slug]) map[slug] = { name: text, slug, url: href, mentions: 0 };
          map[slug].mentions++;
        });
        return Object.values(map).sort((a, b) => b.mentions - a.mentions).slice(0, 30);
      });

      if (!brands.length) throw new Error('0 brands — possible Cloudflare block');
      console.log(`   ✓ ${brands.length} brands`);
      return brands;
    } catch (err) {
      console.warn(`   ⚠ attempt ${attempt}: ${err.message}`);
      if (attempt < 3) await delay(jitter(8000, 5000));
    }
  }

  console.error(`   ✗ ${country.name} failed after 3 attempts`);
  return [];
}

// ── Brand page: extract top 10 fragrances ────────────────────────────────────
async function scrapeFragrances(page, brand) {
  const url = brand.url;
  console.log(`   🧴  ${brand.name}`);

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await delay(jitter(3000, 1500));
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
      await delay(jitter(1500));

      const fragrances = await page.evaluate(() => {
        const results = [];

        // Fragrantica perfume cards — link href always contains /perfume/
        const cards = document.querySelectorAll('a[href*="/perfume/"]');
        const seen  = new Set();

        for (const a of cards) {
          const href = a.href || '';
          if (seen.has(href) || !href.includes('/perfume/')) continue;

          // Extract numeric ID from URL end: /perfume/Brand/Name-12345.html
          const idMatch = href.match(/-(\d+)\.html$/);
          const id = idMatch ? idMatch[1] : null;

          // Image: look in parent tree for an img
          const img   = a.querySelector('img') || a.closest('[class]')?.querySelector('img');
          const imgSrc = img?.src || (id ? `https://fimgs.net/mdimg/perfume/375x500.${id}.jpg` : '');

          // Name: try itemprop, then plain text, then alt
          const nameEl = a.querySelector('[itemprop="name"], p, span');
          const name   = (nameEl?.textContent || img?.alt || a.textContent || '').trim();
          if (!name || name.length < 2) continue;

          // Rating: look near the card
          const container  = a.closest('[class]') || a.parentElement;
          const ratingEl   = container?.querySelector('[itemprop="ratingValue"], .ratingValue, [class*="rating"] span');
          const rating     = ratingEl ? parseFloat(ratingEl.textContent) : null;

          // Votes
          const votesEl    = container?.querySelector('[itemprop="ratingCount"], [class*="vote"], [class*="count"]');
          const votes      = votesEl ? parseInt(votesEl.textContent.replace(/\D/g, '')) || 0 : 0;

          seen.add(href);
          results.push({ name, url: href, img: imgSrc, rating, votes });
          if (results.length >= 10) break;
        }

        return results;
      });

      if (!fragrances.length) throw new Error('0 fragrances');
      console.log(`      ✓ ${fragrances.length} fragrances`);
      return fragrances;
    } catch (err) {
      console.warn(`      ⚠ attempt ${attempt}: ${err.message}`);
      if (attempt < 2) await delay(jitter(5000, 3000));
    }
  }

  return [];
}

// Gulf-region brand → category inference
const CATEGORY_MAP = {
  default: 'oriental',
  homme:   ['sauvage','bleu de chanel','y yves','gentleman','boss','acqua di gio','terre d\'hermes','fahrenheit'],
  femme:   ['black opium','chance','coco mademoiselle','la vie est belle','flora','daisy','mon guerlain'],
  unisexe: ['baccarat rouge','oud wood','aventus','silver mountain','molecule','escentric'],
};

function inferCategory(name = '', brand = '') {
  const q = (name + ' ' + brand).toLowerCase();
  if (CATEGORY_MAP.homme.some(k => q.includes(k)))   return 'homme';
  if (CATEGORY_MAP.femme.some(k => q.includes(k)))   return 'femme';
  if (CATEGORY_MAP.unisexe.some(k => q.includes(k))) return 'unisexe';
  return CATEGORY_MAP.default; // Gulf brands default to oriental
}

// ── Supabase upload ───────────────────────────────────────────────────────────
async function uploadToSupabase(results, allBrands) {
  if (!SERVICE_KEY) { console.log('\nNo SUPABASE_SERVICE_KEY — skip upload'); return; }

  const sb = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // 1. Upsert scraped_brands
  const brandRows = [];
  const scrapedAt = new Date().toISOString();
  for (const [country, brands] of Object.entries(results)) {
    brands.forEach((b, i) => {
      brandRows.push({
        country, rank: i + 1,
        brand_name: b.name, brand_slug: b.slug, brand_url: b.url,
        mentions: b.mentions, scraped_at: scrapedAt,
      });
    });
  }
  for (const country of Object.keys(results)) {
    await sb.from('scraped_brands').delete().eq('country', country);
  }
  const { error: brandErr } = await sb.from('scraped_brands').insert(brandRows);
  if (brandErr) console.error('❌  scraped_brands:', brandErr.message);
  else console.log(`✅  scraped_brands: ${brandRows.length} rows`);

  // 2. Upsert fragrances → products table
  const fragranceDir = path.join(__dirname, 'output', 'fragrances');
  if (!fs.existsSync(fragranceDir)) return;

  const productRows = [];
  for (const brand of allBrands.values()) {
    const file = path.join(fragranceDir, `${brand.slug}.json`);
    if (!fs.existsSync(file)) continue;
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    for (const f of (data.fragrances || [])) {
      if (!f.name || !brand.name) continue;
      productRows.push({
        name:          f.name,
        brand:         brand.name,
        category_slug: inferCategory(f.name, brand.name),
        size:          '100ml',
        price_retail:  0,
        price_gros:    0,
        stock:         0,
        badge:         '',
        img:           f.img || null,
        active:        true,
      });
    }
  }

  // Deduplicate on (name, brand, size) — same fragrance can appear across multiple countries
  const seen = new Map();
  for (const r of productRows) {
    const key = `${r.name}|${r.brand}|${r.size}`;
    if (!seen.has(key)) seen.set(key, r);
  }
  const deduped = [...seen.values()];

  if (!deduped.length) { console.log('No product rows to upsert'); return; }

  console.log(`\n⬆️  Upserting ${deduped.length} products (${productRows.length - deduped.length} dupes removed)…`);
  const productRows_orig = productRows; // keep reference
  // replace productRows with deduped for the loop below
  productRows.length = 0;
  deduped.forEach(r => productRows.push(r));
  const BATCH = 50;
  let upserted = 0;
  for (let i = 0; i < productRows.length; i += BATCH) {
    const batch = productRows.slice(i, i + BATCH);
    const { error } = await sb.from('products').upsert(batch, { onConflict: 'name,brand,size' });
    if (error) console.error(`❌  products batch ${Math.floor(i/BATCH)+1}:`, error.message);
    else { upserted += batch.length; console.log(`   ✓ batch ${Math.floor(i/BATCH)+1}: ${batch.length}`); }
  }
  console.log(`✅  products: ${upserted} upserted`);
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    locale: 'en-US',
    viewport: { width: 1366, height: 768 },
    extraHTTPHeaders: {
      'Accept-Language': 'en-US,en;q=0.9',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    },
  });

  const page = await context.newPage();

  // 1. Scrape country pages
  const results = {};
  for (const country of COUNTRIES) {
    results[country.name] = await scrapeCountry(page, country);
    await delay(jitter(5000, 3000));
  }

  // 2. Dedupe brands across countries, scrape top 10 fragrances each
  const allBrands = new Map();
  for (const brands of Object.values(results)) {
    for (const b of brands) {
      if (!allBrands.has(b.slug)) allBrands.set(b.slug, b);
    }
  }

  console.log(`\n🧴  Scraping fragrances for ${allBrands.size} unique brands…`);
  const fragranceDir = path.join(__dirname, 'output', 'fragrances');
  fs.mkdirSync(fragranceDir, { recursive: true });

  let done = 0;
  for (const brand of allBrands.values()) {
    const fragrances = await scrapeFragrances(page, brand);
    const outFile = path.join(fragranceDir, `${brand.slug}.json`);
    fs.writeFileSync(outFile, JSON.stringify({
      scraped_at:  new Date().toISOString(),
      brand_name:  brand.name,
      brand_slug:  brand.slug,
      brand_url:   brand.url,
      fragrances,
    }, null, 2));
    done++;
    await delay(jitter(3000, 2000)); // polite delay between brand pages
  }
  console.log(`\n✓ ${done} fragrance files saved`);

  await browser.close();

  // 3. Save brands.json
  const outDir = path.join(__dirname, 'output');
  fs.writeFileSync(
    path.join(outDir, 'brands.json'),
    JSON.stringify({ scraped_at: new Date().toISOString(), data: results }, null, 2)
  );
  console.log('📄  brands.json saved');

  // 4. Supabase
  await uploadToSupabase(results, allBrands);
}

main().catch((err) => { console.error('Fatal:', err.message); process.exit(1); });
