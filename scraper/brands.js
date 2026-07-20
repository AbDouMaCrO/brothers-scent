/**
 * Fragrantica Brand Scraper — UAE & Saudi Arabia
 * Runs via GitHub Actions cron or manually.
 *
 * Outputs:
 *   scraper/output/brands.json   — raw scraped data
 *   Supabase table: scraped_brands (if SUPABASE_SERVICE_KEY set)
 *
 * Usage:
 *   node brands.js
 */

const { chromium } = require('playwright-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

chromium.use(StealthPlugin());

const SUPABASE_URL = 'https://lumhgprmkwjsbpvgckeq.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

const COUNTRIES = [
  {
    name: 'UAE',
    slug: 'uae',
    url: 'https://www.fragrantica.com/country/United%20Arab%20Emirates.html',
  },
  {
    name: 'Saudi Arabia',
    slug: 'saudi',
    url: 'https://www.fragrantica.com/country/Saudi%20Arabia.html',
  },
];

const delay = (ms) => new Promise((r) => setTimeout(r, ms));
const jitter = (base, spread = 2000) => base + Math.random() * spread;

async function scrapeCountry(page, country) {
  console.log(`\n🌍  Scraping ${country.name}…`);

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      await page.goto(country.url, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await delay(jitter(4000));

      // Scroll to trigger lazy-loaded content
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
      await delay(jitter(2000));
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await delay(jitter(2000));

      const brands = await page.evaluate(() => {
        const map = {};

        // Brand links on Fragrantica always point to /designers/BrandName.html
        document.querySelectorAll('a[href*="/designers/"]').forEach((a) => {
          const href = a.href;
          const text = (a.textContent || '').trim();
          if (!text || text.length < 2) return;

          // Normalize brand name: strip trailing .html, decode URI
          const slug = href.split('/designers/')[1]?.replace('.html', '') || '';
          const name = text;

          if (!map[slug]) {
            map[slug] = {
              name,
              slug,
              url: href,
              mentions: 0,
            };
          }
          map[slug].mentions++;
        });

        // Also try to grab explicit "top brands" table/list if Fragrantica added one
        const topSection = document.querySelector('.top-brands, [class*="topbrand"], [class*="designer-list"]');
        if (topSection) {
          topSection.querySelectorAll('a').forEach((a, rank) => {
            const text = (a.textContent || '').trim();
            const href = a.href || '';
            if (text && href.includes('/designers/')) {
              const slug = href.split('/designers/')[1]?.replace('.html', '') || '';
              if (map[slug]) map[slug].rank = rank + 1;
            }
          });
        }

        return Object.values(map)
          .sort((a, b) => b.mentions - a.mentions)
          .slice(0, 50); // top 50 brands per country
      });

      if (!brands.length) throw new Error('No brands found — possible Cloudflare block');

      console.log(`   ✓ ${brands.length} brands found`);
      return brands;
    } catch (err) {
      console.warn(`   ⚠ Attempt ${attempt} failed: ${err.message}`);
      if (attempt < 3) await delay(jitter(8000, 5000));
    }
  }

  console.error(`   ✗ Failed to scrape ${country.name} after 3 attempts`);
  return [];
}

async function uploadToSupabase(results) {
  if (!SERVICE_KEY) {
    console.log('\nSUPABASE_SERVICE_KEY not set — skipping upload');
    return;
  }

  const sb = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const rows = [];
  const scrapedAt = new Date().toISOString();

  for (const [country, brands] of Object.entries(results)) {
    brands.forEach((b, i) => {
      rows.push({
        country,
        rank: i + 1,
        brand_name: b.name,
        brand_slug: b.slug,
        brand_url: b.url,
        mentions: b.mentions,
        scraped_at: scrapedAt,
      });
    });
  }

  console.log(`\n⬆️  Uploading ${rows.length} rows to Supabase…`);

  // Delete old data for these countries first, then insert fresh
  for (const country of Object.keys(results)) {
    await sb.from('scraped_brands').delete().eq('country', country);
  }

  const { error } = await sb.from('scraped_brands').insert(rows);
  if (error) {
    console.error('❌  Supabase upload failed:', error.message);
  } else {
    console.log('✅  Supabase upload complete');
  }
}

async function main() {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    locale: 'en-US',
    viewport: { width: 1366, height: 768 },
    extraHTTPHeaders: {
      'Accept-Language': 'en-US,en;q=0.9',
      Accept:
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    },
  });

  const page = await context.newPage();
  const results = {};

  for (const country of COUNTRIES) {
    results[country.name] = await scrapeCountry(page, country);
    if (COUNTRIES.indexOf(country) < COUNTRIES.length - 1) {
      await delay(jitter(6000, 4000)); // polite pause between countries
    }
  }

  await browser.close();

  // Save JSON output
  const outDir = path.join(__dirname, 'output');
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, 'brands.json');
  fs.writeFileSync(
    outFile,
    JSON.stringify({ scraped_at: new Date().toISOString(), data: results }, null, 2)
  );
  console.log(`\n📄  Saved → scraper/output/brands.json`);

  // Print summary
  for (const [country, brands] of Object.entries(results)) {
    console.log(`\n${country} — top 10:`);
    brands.slice(0, 10).forEach((b, i) => console.log(`  ${i + 1}. ${b.name} (${b.mentions} mentions)`));
  }

  // Upload to Supabase
  await uploadToSupabase(results);
}

main().catch((err) => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
