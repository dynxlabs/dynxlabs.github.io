const fs   = require('fs');
const path = require('path');

const POSTS_DIR     = path.join(__dirname, 'insights', 'posts');
const MANIFEST_PATH = path.join(__dirname, 'insights', 'manifest.json');
const INSIGHTS_DIR  = path.join(__dirname, 'insights');

const CATEGORIES = {
  "automatizacion":           { color: "#7a3010", en: "Automation",             es: "Automatización" },
  "inteligencia-artificial":  { color: "#233444", en: "Artificial Intelligence", es: "Inteligencia Artificial" },
  "casos-reales":             { color: "#0d3320", en: "Real Cases",             es: "Casos Reales" },
  "workflows":                { color: "#2a1040", en: "Workflows",              es: "Workflows" }
};

// Read all article JSONs
const files = fs.readdirSync(POSTS_DIR)
  .filter(f => f.endsWith('.json') && f !== 'manifest.json' && f !== '.gitkeep');

const articles = files
  .map(file => {
    try {
      const raw  = fs.readFileSync(path.join(POSTS_DIR, file), 'utf8');
      return JSON.parse(raw);
    } catch (e) {
      console.error(`❌ Error parsing ${file}:`, e.message);
      return null;
    }
  })
  .filter(Boolean)
  .sort((a, b) => new Date(b.date) - new Date(a.date));

// Write manifest.json
const manifest = {
  generatedAt: new Date().toISOString(),
  total: articles.length,
  categories: CATEGORIES,
  articles
};
fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2), 'utf8');
console.log(`✅ manifest.json generado con ${articles.length} artículos.`);

// Generate one index.html per article slug
articles.forEach(article => {
  const slugDir = path.join(INSIGHTS_DIR, article.slug);
  if (!fs.existsSync(slugDir)) fs.mkdirSync(slugDir, { recursive: true });

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="refresh" content="0;url=/insights/insight-post.html?slug=${article.slug}" />
  <link rel="canonical" href="https://dynxlabs.com/insights/${article.slug}" />
  <title>${article.en.title} — DYNX Insights</title>
  <script>window.location.replace('/insights/insight-post.html?slug=${article.slug}');</script>
</head>
<body></body>
</html>`;

  fs.writeFileSync(path.join(slugDir, 'index.html'), html, 'utf8');
  console.log(`  → /insights/${article.slug}/index.html`);
});

console.log(`✅ ${articles.length} páginas de artículo generadas.`);
