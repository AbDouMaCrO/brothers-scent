/**
 * BrothersScent — Excel Product Importer
 * Usage:  node import-products.js stock.xlsx
 * Setup:  npm install xlsx @supabase/supabase-js
 *
 * Get your service role key from:
 * https://supabase.com/dashboard/project/lumhgprmkwjsbpvgckeq/settings/api
 * Then run:
 *   set SUPABASE_SERVICE_KEY=your_key_here   (Windows CMD)
 *   $env:SUPABASE_SERVICE_KEY="your_key"     (PowerShell)
 */

const XLSX    = require('xlsx');
const { createClient } = require('@supabase/supabase-js');
const path    = require('path');

const SUPABASE_URL = 'https://lumhgprmkwjsbpvgckeq.supabase.co';
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_KEY;

if (!SERVICE_KEY) {
  console.error('\n❌  Set SUPABASE_SERVICE_KEY environment variable first.\n');
  console.error('    PowerShell: $env:SUPABASE_SERVICE_KEY="your_service_role_key"');
  console.error('    CMD:        set SUPABASE_SERVICE_KEY=your_service_role_key\n');
  process.exit(1);
}

const sb = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// Column name aliases — supports both English and French headers
const col = (row, ...keys) => {
  for (const k of keys) {
    if (row[k] !== undefined && row[k] !== '') return row[k];
  }
  return undefined;
};

const VALID_CATS = ['homme', 'femme', 'unisexe', 'oriental'];

async function run(filePath) {
  console.log(`\n📂  Reading: ${filePath}`);
  const wb   = XLSX.readFile(filePath);
  const ws   = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });

  if (!rows.length) { console.error('No rows found.'); return; }
  console.log(`📋  ${rows.length} rows detected\n`);

  const products = [];
  const skipped  = [];

  for (let i = 0; i < rows.length; i++) {
    const r    = rows[i];
    const line = i + 2; // Excel row number (1-indexed + header)

    const name  = String(col(r, 'name', 'Name', 'Nom', 'NOM') || '').trim();
    const brand = String(col(r, 'brand', 'Brand', 'Marque', 'MARQUE') || '').trim();

    if (!name || !brand) {
      skipped.push(`Row ${line}: missing name or brand`);
      continue;
    }

    const catRaw = String(col(r, 'category', 'Category', 'categorie', 'Catégorie', 'CAT') || 'unisexe')
      .trim().toLowerCase();
    const category_slug = VALID_CATS.includes(catRaw) ? catRaw : 'unisexe';

    const price_retail = Number(col(r, 'price_retail', 'Prix Détail', 'prix_detail', 'retail') || 0);
    const price_gros   = Number(col(r, 'price_gros', 'Prix Gros', 'prix_gros', 'gros', 'wholesale') || 0);
    const stock        = Number(col(r, 'stock', 'Stock', 'qty', 'Qty', 'Quantité') || 0);

    if (price_gros <= 0) {
      skipped.push(`Row ${line} (${name}): price_gros is 0 — skipped`);
      continue;
    }

    products.push({
      name,
      brand,
      category_slug,
      size:  String(col(r, 'size', 'Size', 'Taille', 'ml') || '100ml').trim(),
      price_retail,
      price_gros,
      badge: String(col(r, 'badge', 'Badge', 'label', 'Label') || '').trim().slice(0, 10),
      stock,
      img:   String(col(r, 'img', 'image', 'Image', 'url', 'URL') || '').trim(),
      active: true
    });
  }

  if (skipped.length) {
    console.log('⚠️  Skipped rows:');
    skipped.forEach(s => console.log('   -', s));
    console.log();
  }

  if (!products.length) {
    console.error('❌  No valid products to import.');
    return;
  }

  console.log(`⬆️  Upserting ${products.length} products to Supabase...`);

  // Upsert in batches of 50
  const BATCH = 50;
  let total   = 0;
  for (let i = 0; i < products.length; i += BATCH) {
    const batch = products.slice(i, i + BATCH);
    const { error } = await sb
      .from('products')
      .upsert(batch, { onConflict: 'name,brand,size' });

    if (error) {
      console.error(`❌  Batch ${Math.floor(i/BATCH)+1} failed:`, error.message);
    } else {
      total += batch.length;
      console.log(`   ✓ Batch ${Math.floor(i/BATCH)+1}: ${batch.length} rows`);
    }
  }

  console.log(`\n✅  Done — ${total} products imported/updated.\n`);
}

const file = process.argv[2];
if (!file) {
  console.error('\nUsage:  node import-products.js <file.xlsx>\n');
  process.exit(1);
}

run(path.resolve(process.cwd(), file)).catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
