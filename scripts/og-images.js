/* ============================================================
   DYNX Labs — Share images (Open Graph) generator
   File: scripts/og-images.js

   Renders a 1200x630 PNG per page and per Insights article into
   assets/images/og/. Needs Playwright (local only, not run in CI):

     npm i -D playwright && npx playwright install chromium
     node scripts/og-images.js            # pages + all articles
     node scripts/og-images.js <slug>     # one article
     node scripts/og-images.js --missing  # only images that don't exist yet (CI)

   Article pages point to assets/images/og/insights/<slug>.png; the
   GitHub Action runs this with --missing so new articles get theirs.
   ============================================================ */

'use strict';

const fs   = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.join(__dirname, '..');
const OUT  = path.join(ROOT, 'assets', 'images', 'og');
const SLOGAN = 'Automate the Work. Accelerate the Business.';

// Brand logo, recoloured for a black background.
const LOGO = fs.readFileSync(path.join(ROOT, 'assets', 'icons', 'logo.svg'), 'utf-8')
  .replace(/<\?xml[\s\S]*?\?>/, '')
  .replace(/<title>[\s\S]*?<\/title>/, '')
  .replace(/#B3B3B3|#BDBFC1/gi, '#FFFFFF')
  .replace(/#E6E6E6/gi, '#CFCFCF');

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const PAGES = [
  { file: 'home',       hero: true },
  { file: 'products',   label: 'Products',   title: 'AI products we are building to automate operations.' },
  { file: 'research',   label: 'Research',   title: 'Applied research on AI agents and automation.' },
  { file: 'faq',        label: 'FAQ',        title: 'Everything you need to know before getting started.' },
  { file: 'contact',    label: 'Contact',    title: 'Let’s talk about what you want to automate.' },
  { file: 'insights',   label: 'Insights',   title: 'Practical guides and real cases on AI and automation.' },
  { file: 'leadership', label: 'Leadership', title: 'Arois Monsalve', sub: 'Founder & CEO · DYNX Labs' }
];

function html({ hero, label, title, sub, meta }) {
  const size = hero ? 84 : title.length > 70 ? 54 : title.length > 45 ? 62 : 72;
  return `<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500&display=swap" rel="stylesheet">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{width:1200px;height:630px;background:#000;color:#fff;font-family:Inter,system-ui,sans-serif;-webkit-font-smoothing:antialiased;overflow:hidden;position:relative}
  .grid{position:absolute;inset:0;background-image:linear-gradient(#121212 1px,transparent 1px),linear-gradient(90deg,#121212 1px,transparent 1px);background-size:60px 60px}
  .glow{position:absolute;inset:0;background:radial-gradient(70% 80% at 88% 8%,rgba(255,255,255,.09),transparent 60%)}
  .wrap{position:absolute;inset:0;padding:64px 72px;display:flex;flex-direction:column}
  .logo svg{height:46px;width:auto;display:block}
  .body{margin-top:auto}
  .label{font-size:26px;color:#9a9a9a;margin-bottom:22px;letter-spacing:-.01em}
  h1{font-size:${size}px;font-weight:500;letter-spacing:-.035em;line-height:1.06;max-width:${hero ? 1060 : 1000}px}
  .sub{font-size:30px;color:#9a9a9a;margin-top:18px;letter-spacing:-.01em}
  .foot{display:flex;justify-content:space-between;align-items:center;margin-top:48px;padding-top:26px;border-top:1px solid #222;font-size:22px;color:#7a7a7a}
  .foot b{color:#cfcfcf;font-weight:500}
</style></head><body>
<div class="grid"></div><div class="glow"></div>
<div class="wrap">
  <div class="logo">${LOGO}</div>
  <div class="body">
    ${label ? `<div class="label">${esc(label)}</div>` : ''}
    <h1>${hero ? 'Automate the Work.<br>Accelerate the Business.' : esc(title)}</h1>
    ${sub ? `<div class="sub">${esc(sub)}</div>` : ''}
    <div class="foot"><b>dynxlabs.com</b><span>${esc(meta || (hero ? 'AI agents · Workflow automation · Systems integration' : SLOGAN))}</span></div>
  </div>
</div></body></html>`;
}

(async () => {
  const arg = process.argv[2];
  const missingOnly = arg === '--missing';
  const only = missingOnly ? null : arg;
  const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'insights', 'manifest.json'), 'utf-8'));
  const jobs = [];
  if (!only) PAGES.forEach(p => jobs.push({ out: path.join(OUT, p.file + '.png'), data: p }));
  manifest.articles
    .filter(a => !only || a.slug === only)
    .forEach(a => {
      const cat = (manifest.categories[a.category] || {}).en || a.category;
      jobs.push({
        out: path.join(OUT, 'insights', a.slug + '.png'),
        data: { label: 'Insights · ' + cat, title: a.en.title, meta: (a.readTime && a.readTime.en) || SLOGAN }
      });
    });

  fs.mkdirSync(path.join(OUT, 'insights'), { recursive: true });
  const todo = missingOnly ? jobs.filter(j => !fs.existsSync(j.out)) : jobs;
  if (!todo.length) { console.log('✅ Share images already up to date.'); return; }
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  for (const job of todo) {
    await page.setContent(html(job.data), { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: job.out, type: 'png' });
  }
  await browser.close();
  console.log(`✅ ${todo.length} share images written to assets/images/og/`);
})();
