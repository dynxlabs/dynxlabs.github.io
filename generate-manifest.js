const fs   = require('fs');
const path = require('path');

const POSTS_DIR    = path.join(__dirname, 'insights', 'posts');
const MANIFEST_OUT = path.join(__dirname, 'insights', 'manifest.json');

const CATEGORIES = {
  "automatizacion":           { color: "#7a3010", en: "Automation",             es: "Automatización" },
  "inteligencia-artificial":  { color: "#233444", en: "Artificial Intelligence", es: "Inteligencia Artificial" },
  "casos-reales":             { color: "#0d3320", en: "Real Cases",              es: "Casos Reales" },
  "workflows":                { color: "#2a1040", en: "Workflows",               es: "Workflows" }
};

const files = fs.readdirSync(POSTS_DIR)
  .filter(f => f.endsWith('.json') && f !== '.gitkeep');

const articles = files.map(file => {
  const raw     = fs.readFileSync(path.join(POSTS_DIR, file), 'utf-8');
  const article = JSON.parse(raw);

  // Strip body from manifest — body stays only in the post JSON
  const { body: _enBody, ...enWithoutBody } = article.en || {};
  const { body: _esBody, ...esWithoutBody } = article.es || {};

  return {
    slug:     article.slug,
    category: article.category,
    date:     article.date,
    readTime: article.readTime,
    en:       enWithoutBody,
    es:       esWithoutBody
  };
}).sort((a, b) => new Date(b.date) - new Date(a.date));

const manifest = {
  generatedAt: new Date().toISOString(),
  total:       articles.length,
  categories:  CATEGORIES,
  articles
};

fs.writeFileSync(MANIFEST_OUT, JSON.stringify(manifest, null, 2));
console.log(`✅ Manifest generated with ${articles.length} articles.`);
