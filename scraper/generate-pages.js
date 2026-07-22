/**
 * Brand & Product Page Generator
 *
 * Reads scraper/output/samawa.json and splits into:
 *   scraper/output/by-brand/{slug}.json  — all products per brand
 *   scraper/output/brand-index.json      — brands directory (name, slug, count, preview)
 *
 * Usage: node generate-pages.js
 */

const fs   = require('fs');
const path = require('path');

const SAMAWA_FILE  = path.join(__dirname, 'output', 'samawa.json');
const BY_BRAND_DIR = path.join(__dirname, 'output', 'by-brand');
const INDEX_FILE   = path.join(__dirname, 'output', 'brand-index.json');

// ── Slugify brand name ────────────────────────────────────────────────────────
function slugify(name = '') {
  return name
    .toLowerCase()
    .replace(/[''`]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ── Main ──────────────────────────────────────────────────────────────────────
function main() {
  if (!fs.existsSync(SAMAWA_FILE)) {
    console.error('samawa.json not found — run samawa.js first');
    process.exit(1);
  }

  console.log('📂  Reading samawa.json…');
  const { products } = JSON.parse(fs.readFileSync(SAMAWA_FILE, 'utf8'));
  console.log(`    ${products.length} products`);

  // Group by brand slug
  const byBrand = new Map();

  for (const p of products) {
    const slug = slugify(p._handle
      ? p.brand                       // prefer original brand name for slug
      : p.brand);
    const brandSlug = slugify(p.brand);

    if (!byBrand.has(brandSlug)) {
      byBrand.set(brandSlug, { name: p.brand, slug: brandSlug, products: [] });
    }

    byBrand.get(brandSlug).products.push({
      name:          p.name,
      brand:         p.brand,
      handle:        p._handle || null,
      img:           p.img,
      price_gros:    p.price_gros,
      price_retail:  p.price_retail,
      badge:         p.badge,
      category_slug: p.category_slug,
      size:          p.size,
      tags:          p._tags || [],
      product_url:   p._url || null,
      sku:           p._sku || null,
    });
  }

  console.log(`    ${byBrand.size} unique brands`);

  // Write per-brand files
  fs.mkdirSync(BY_BRAND_DIR, { recursive: true });
  let written = 0;
  for (const [slug, brand] of byBrand) {
    fs.writeFileSync(
      path.join(BY_BRAND_DIR, `${slug}.json`),
      JSON.stringify({ name: brand.name, slug, products: brand.products }, null, 0)
    );
    written++;
  }
  console.log(`✅  ${written} by-brand files written → scraper/output/by-brand/`);

  // Build brand index — sorted by product count desc
  const index = [...byBrand.values()]
    .sort((a, b) => b.products.length - a.products.length)
    .map(({ name, slug, products }) => ({
      name,
      slug,
      count:    products.length,
      img:      products.find(p => p.img)?.img || null,
      preview:  products.slice(0, 6).map(p => ({
        name:   p.name,
        handle: p.handle,
        img:    p.img,
        price:  p.price_gros,
        badge:  p.badge,
      })),
    }));

  fs.writeFileSync(INDEX_FILE, JSON.stringify({
    generated_at: new Date().toISOString(),
    total_brands: index.length,
    brands: index,
  }, null, 2));

  console.log(`✅  brand-index.json written (${index.length} brands)`);
  console.log('\nTop 10 brands by product count:');
  index.slice(0, 10).forEach((b, i) =>
    console.log(`  ${i + 1}. ${b.name} (${b.count} products)`)
  );
}

main();
