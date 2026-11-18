#!/usr/bin/env node
/* ============================================================
   DYNX Labs — Build reproducibility check
   File: scripts/seo/check-build.js

   Runs the official build twice and compares content hashes of the
   whole working tree (node_modules and .git excluded):

     S0  tree as found (in CI: exactly what is committed)
     S1  after build #1
     S2  after build #2

     BLD-01  build #1 and #2 exit with code 0
     BLD-02  S1 == S2            the build is idempotent
     BLD-03  S0 == S1            the committed/generated output is up to date
                                 with its sources (no drift)
     BLD-04  the build only writes inside its declared outputs
             (no temporary or stray files anywhere else)

   Usage:  node scripts/seo/check-build.js [--allow-drift]
   --allow-drift turns BLD-03 into a WARNING (useful locally right
   after editing sources, before regenerating).
   Exit code: 0 = no FAIL, 1 = FAIL.
   ============================================================ */

'use strict';

const fs     = require('fs');
const path   = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');
const { Report } = require('./lib/report.js');

const ROOT = path.join(__dirname, '..', '..');
const G = '0. Build';

// What the build is allowed to write (declared outputs).
const OUTPUTS = [/^en\//, /^es\//, /^sitemap\.xml$/, /^insights\/manifest\.json$/, /^assets\/js\/insights-data\.js$/];
const IGNORE  = new Set(['node_modules', '.git']);
const BUILD   = [
  ['node', ['generate-manifest.js']],
  ['node', [path.join('scripts', 'build-i18n.js')]]
];

function snapshot() {
  const map = new Map();
  (function walk(dir, relDir) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (relDir === '' && IGNORE.has(e.name)) continue;
      const full = path.join(dir, e.name);
      const r = relDir ? `${relDir}/${e.name}` : e.name;
      if (e.isDirectory()) walk(full, r);
      else map.set(r, crypto.createHash('sha256').update(fs.readFileSync(full)).digest('hex'));
    }
  })(ROOT, '');
  return map;
}

function compare(a, b) {
  const out = [];
  for (const [f, h] of b) {
    if (!a.has(f)) out.push({ file: f, change: 'creado' });
    else if (a.get(f) !== h) out.push({ file: f, change: 'modificado' });
  }
  for (const f of a.keys()) if (!b.has(f)) out.push({ file: f, change: 'eliminado' });
  return out;
}

function build() {
  for (const [cmd, args] of BUILD) {
    const r = spawnSync(cmd, args, { cwd: ROOT, encoding: 'utf-8' });
    if (r.status !== 0) return { ok: false, step: `${cmd} ${args.join(' ')}`, out: `${r.stdout || ''}${r.stderr || ''}`.trim().split('\n').slice(-12).join('\n') };
  }
  return { ok: true };
}

const allowDrift = process.argv.includes('--allow-drift');
const report = new Report();

const s0 = snapshot();
const b1 = build();
const s1 = snapshot();
const b2 = b1.ok ? build() : { ok: false, step: 'no ejecutado', out: 'el primer build falló' };
const s2 = snapshot();

report.check(G, 'BLD-01', 'El build oficial termina correctamente (dos ejecuciones)', 2,
  [b1, b2].filter(b => !b.ok).map(b => ({ where: b.step, expected: 'código de salida 0', found: b.out })));

const idem = compare(s1, s2);
report.check(G, 'BLD-02', 'Build idempotente: la segunda ejecución no cambia nada', s2.size,
  idem.map(d => ({ where: d.file, expected: 'sin cambios entre el build 1 y el 2', found: d.change })));

const drift = compare(s0, s1);
const inOutputs = f => OUTPUTS.some(re => re.test(f));
report.check(G, 'BLD-03', 'Salida generada al día con sus fuentes (sin deriva)', s1.size,
  drift.filter(d => inOutputs(d.file)).map(d => ({
    where: d.file,
    expected: 'idéntico al resultado del build',
    found: `${d.change} por el build — ejecutar "npm run build" e incluir el resultado (si solo cambia el año del copyright, regenerar tras el cambio de año)`
  })), allowDrift ? 'WARNING' : 'FAIL');

report.check(G, 'BLD-04', 'El build solo escribe en sus salidas declaradas (sin archivos temporales)', s2.size,
  compare(s0, s2).filter(d => !inOutputs(d.file)).map(d => ({ where: d.file, expected: 'sin cambios fuera de en/, es/, sitemap.xml, insights/manifest.json y assets/js/insights-data.js', found: d.change })));

report.count('Archivos del árbol comparados', s2.size);
report.count('Archivos generados (salidas declaradas)', [...s2.keys()].filter(inOutputs).length);

console.log(report.toConsole(30));
if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, report.toMarkdown('Build y reproducibilidad') + '\n');
if (process.env.GITHUB_ACTIONS) {
  for (const r of report.results.filter(x => x.level === 'FAIL')) {
    console.log(`::error title=${r.id} ${r.title}::${r.problems.length} problema(s). ${Report.fmtProblem(r.problems[0] || {}).replace(/\r?\n/g, ' ')}`);
  }
}
const jsonArg = process.argv.find(a => a.startsWith('--json='));
if (jsonArg) fs.writeFileSync(jsonArg.slice(7), JSON.stringify(report.toJSON(), null, 2));
process.exitCode = report.totals().FAIL > 0 ? 1 : 0;
