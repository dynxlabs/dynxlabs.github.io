/* ============================================================
   DYNX Labs — SEO audit: result collector and renderers
   File: scripts/seo/lib/report.js

   Levels:
     PASS        check met
     FAIL        real error (blocks CI)
     WARNING     non-blocking observation
     NOT TESTED  needs an external environment (never counted as PASS)
   ============================================================ */

'use strict';

const LEVELS = ['PASS', 'FAIL', 'WARNING', 'NOT TESTED'];

class Report {
  constructor() { this.results = []; this.counts = {}; }

  /* Record one check.
     checked  = how many items were examined
     problems = array of { where, expected, found } (or strings)
     level    = level used when problems exist ('FAIL' | 'WARNING') */
  check(group, id, title, checked, problems, level) {
    const lvl = problems.length ? (level || 'FAIL') : 'PASS';
    this.results.push({
      group, id, title, level: lvl, checked,
      problems: problems.map(p => (typeof p === 'string' ? { found: p } : p))
    });
  }

  note(group, id, title, level, detail) {
    this.results.push({ group, id, title, level, checked: 0, problems: detail ? [{ found: detail }] : [] });
  }

  count(key, n) { this.counts[key] = n; }

  totals() {
    const t = { PASS: 0, FAIL: 0, WARNING: 0, 'NOT TESTED': 0 };
    this.results.forEach(r => { t[r.level]++; });
    return t;
  }

  static fmtProblem(p) {
    const parts = [];
    if (p.where)    parts.push(p.where);
    if (p.expected !== undefined) parts.push(`esperado: ${p.expected}`);
    if (p.found !== undefined)    parts.push(`encontrado: ${p.found}`);
    return parts.join(' — ');
  }

  toConsole(maxDetails) {
    const max = maxDetails || 15;
    const lines = [];
    let group = null;
    for (const r of this.results) {
      if (r.group !== group) { group = r.group; lines.push('', `== ${group} ==`); }
      const n = r.checked ? ` (${r.checked})` : '';
      lines.push(`${r.level.padEnd(10)} ${r.id}  ${r.title}${n}`);
      if (r.level !== 'PASS') {
        r.problems.slice(0, max).forEach(p => lines.push(`             - ${Report.fmtProblem(p)}`));
        if (r.problems.length > max) lines.push(`             … y ${r.problems.length - max} más (ver informe JSON)`);
      }
    }
    const t = this.totals();
    lines.push('', `RESULTADO: ${t.PASS} PASS / ${t.FAIL} FAIL / ${t.WARNING} WARNING / ${t['NOT TESTED']} NOT TESTED`);
    return lines.join('\n');
  }

  toMarkdown(title) {
    const t = this.totals();
    const esc = s => String(s).replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
    const out = [`## ${title || 'Auditoría SEO'}`, '',
      `**Resultado:** ${t.PASS} PASS · ${t.FAIL} FAIL · ${t.WARNING} WARNING · ${t['NOT TESTED']} NOT TESTED`, ''];
    if (Object.keys(this.counts).length) {
      out.push('| Recuento | Valor |', '|---|---|');
      for (const k of Object.keys(this.counts)) out.push(`| ${esc(k)} | ${this.counts[k]} |`);
      out.push('');
    }
    out.push('| Estado | ID | Comprobación | Elementos |', '|---|---|---|---|');
    for (const r of this.results) out.push(`| ${r.level} | ${r.id} | ${esc(r.title)} | ${r.checked || ''} |`);
    const bad = this.results.filter(r => r.level !== 'PASS' && r.problems.length);
    if (bad.length) {
      out.push('', '### Detalle');
      for (const r of bad) {
        out.push('', `**${r.level} · ${r.id} · ${r.title}**`, '');
        r.problems.slice(0, 25).forEach(p => out.push(`- ${esc(Report.fmtProblem(p))}`));
        if (r.problems.length > 25) out.push(`- … y ${r.problems.length - 25} más`);
      }
    }
    return out.join('\n') + '\n';
  }

  toJSON() { return { totals: this.totals(), counts: this.counts, results: this.results }; }
}

module.exports = { Report, LEVELS };
