#!/usr/bin/env node
/* ============================================================
   DYNX Labs — SEO audit of the generated site
   File: scripts/seo/audit.js

   Audits the built /es and /en pages, sitemap.xml, robots.txt and
   the approved legacy-redirect design. Read-only: it never writes
   to the site and never contacts the network.

   Usage:
     node scripts/seo/audit.js                 all groups
     node scripts/seo/audit.js --only=links    one or more groups (comma separated)
     node scripts/seo/audit.js --json=out.json --md=out.md
     node scripts/seo/audit.js --list          list the groups

   Exit code: 0 = no FAIL, 1 = at least one FAIL, 2 = the audit crashed.
   WARNING and NOT TESTED never change the exit code and are never
   reported as PASS.

   In GitHub Actions the Markdown report is also appended to the job
   summary ($GITHUB_STEP_SUMMARY) and each FAIL is emitted as an
   ::error annotation.
   ============================================================ */

'use strict';

const fs   = require('fs');
const path = require('path');
const S    = require('./lib/site.js');
const { Report } = require('./lib/report.js');

const GROUPS = {
  architecture: require('./checks/architecture.js'),
  canonical:    require('./checks/canonical-hreflang.js'),
  jsonld:       require('./checks/jsonld.js'),
  sitemap:      require('./checks/sitemap-robots.js'),
  links:        require('./checks/links.js'),
  metadata:     require('./checks/metadata.js'),
  html:         require('./checks/html-quality.js'),
  legacy:       require('./checks/legacy-redirects.js')
};

function arg(name) {
  const a = process.argv.find(x => x === `--${name}` || x.startsWith(`--${name}=`));
  if (!a) return undefined;
  return a.includes('=') ? a.slice(a.indexOf('=') + 1) : true;
}

function main() {
  if (arg('list')) { console.log(Object.keys(GROUPS).join('\n')); return 0; }

  const only = arg('only') ? String(arg('only')).split(',').map(x => x.trim()) : Object.keys(GROUPS);
  const unknown = only.filter(g => !GROUPS[g]);
  if (unknown.length) { console.error(`Grupo desconocido: ${unknown.join(', ')}. Válidos: ${Object.keys(GROUPS).join(', ')}`); return 2; }

  const posts   = S.loadPosts();
  const pages   = S.expectedPages(posts);
  const locales = { es: S.loadLocale('es'), en: S.loadLocale('en') };
  const ctx     = { S, posts, pages, locales };
  const report  = new Report();

  for (const g of only) GROUPS[g](ctx, report);

  console.log(report.toConsole());

  const title = `Auditoría SEO — ${only.length === Object.keys(GROUPS).length ? 'completa' : only.join(', ')}`;
  const md = report.toMarkdown(title);
  if (arg('json')) { fs.mkdirSync(path.dirname(path.resolve(arg('json'))), { recursive: true }); fs.writeFileSync(arg('json'), JSON.stringify(report.toJSON(), null, 2)); }
  if (arg('md'))   { fs.mkdirSync(path.dirname(path.resolve(arg('md'))), { recursive: true });   fs.writeFileSync(arg('md'), md); }

  if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, md + '\n');
  if (process.env.GITHUB_ACTIONS) {
    const esc = s => String(s).replace(/%/g, '%25').replace(/\r/g, '%0D').replace(/\n/g, '%0A');
    for (const r of report.results.filter(x => x.level === 'FAIL')) {
      const first = r.problems[0] ? Report.fmtProblem(r.problems[0]) : '';
      console.log(`::error title=${esc(`${r.id} ${r.title}`)}::${esc(`${r.problems.length} problema(s). ${first}`)}`);
    }
  }

  return report.totals().FAIL > 0 ? 1 : 0;
}

try { process.exitCode = main(); }
catch (e) { console.error('La auditoría no pudo completarse:', e && e.stack ? e.stack : e); process.exitCode = 2; }
