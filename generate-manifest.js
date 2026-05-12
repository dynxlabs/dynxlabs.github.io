const fs   = require('fs');
const path = require('path');

const POSTS_DIR     = path.join(__dirname, 'insights', 'posts');
const MANIFEST_PATH = path.join(__dirname, 'insights', 'manifest.json');

const CATEGORIES = {
  "automatizacion":           { color: "#7a3010", en: "Automation",            es: "Automatización" },
  "inteligencia-artificial":  { color: "#233444", en: "Artificial Intelligence", es: "Inteligencia Artificial" },
  "casos-reales":             { color: "#0d3320", en: "Real Cases",             es: "Casos Reales" },
  "workflows":                { color: "#2a1040", en: "Workflows",              es: "Workflows" }
};

const files = fs.readdirSync(POSTS_DIR)
  .filter(f => f.endsWith('.json') && f !== 'manifest.json' && f !== '.gitkeep');

const articles = files
  .map(file => {
    try {
      const raw  = fs.readFileSync(path.join(POSTS_DIR, file), 'utf8');
      const data = JSON.parse(raw);
      return data;
    } catch (e) {
      console.error(`❌ Error parsing ${file}:`, e.message);
      return null;
    }
  })
  .filter(Boolean)
  .sort((a, b) => new Date(b.date) - new Date(a.date));

const manifest = {
  generatedAt: new Date().toISOString(),
  total: articles.length,
  categories: CATEGORIES,
  articles
};

fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2), 'utf8');
console.log(`✅ manifest.json generado con ${articles.length} artículos.`);
