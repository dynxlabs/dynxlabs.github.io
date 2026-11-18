# DYNX Labs — Internacionalización ES/EN · Checkpoint Fases 1 y 2 (APROBADAS)

**Fecha:** 2026-11-12
**Entorno:** clon de prueba `scratchpad/dynx-site` (NO es `main`, NO es la carpeta local original, NO es producción)
**Estado:** Fase 1 y Fase 2 **aprobadas y cerradas**. Punto de control antes de la Fase 3 (Insights bilingües).

> ⚠️ El trabajo continúa **exclusivamente en el clon de prueba**. `main`, la carpeta local original y producción **no deben modificarse**. No hay commit, push, merge ni despliegue de este trabajo.

---

## 1. Commit base

- **Repositorio:** `dynxlabs/dynxlabs.github.io` (GitHub Pages → dynxlabs.com)
- **Commit base del clon:** `1e0190a` — *copy(products): rename Synapse Air to DYNX Synapse (#22)*
- El clon se creó como copia fresca del `main` actual de GitHub sobre ese commit.

---

## 2. Arquitectura implementada ES/EN

- **Páginas estáticas por idioma** bajo `/es/` y `/en/`, con el texto **ya horneado** en el HTML (no inyectado por JavaScript). Cada idioma es una página real e indexable.
- **Idioma por ruta:** el `i18n.js` es consciente de la ruta. `/es/` → español, `/en/` → inglés. La ruta **gana** sobre `localStorage` y sobre `?lang=`. En estas rutas **no** se añade `?lang=`. Las páginas legacy (raíz) conservan su comportamiento `?lang=`.
- **SEO por idioma:** `<title>`, `description`, `canonical`, `hreflang` (en/es/x-default→es), Open Graph y Twitter Cards localizados. Se marca `data-own-canonical` en `<html>` para que el runtime no sobrescriba el canonical estático.
- **URL canónica:** sin extensión (`/es/products`). GitHub Pages sirve el `.html` en ambas formas (con y sin extensión, HTTP 200, mismo contenido, sin redirección); el canonical estático consolida en la versión sin extensión.
- **Selector de idioma:** enlaces reales entre las versiones equivalentes (`/es/… ↔ /en/…`).
- **Schema.org (JSON-LD) localizado:** identidades corporativas globales por `@id`; entidades de página, breadcrumbs y FAQ localizados por idioma (detalle en §4).
- **Generación:** `scripts/build-i18n.js` lee las fuentes + `locales/*.json` y genera `/es/` y `/en/`. Reproducible e **idempotente**. No modifica los HTML originales.

---

## 3. Archivos creados y modificados (clon)

**Modificados (tracked):**
- `assets/js/i18n.js` — idioma por ruta (Fase 1): `routeLang()`, `detectLanguage()` prioriza ruta, `syncURL()` no añade `?lang=` en rutas `/es//en/`. Legacy intacto.
- `locales/en.json`, `locales/es.json` — único añadido: namespace `breadcrumb.*` (Fase 2).

**Creados (untracked):**
- `scripts/build-i18n.js` — generador i18n + localización de JSON-LD.
- `package.json`, `package-lock.json` — dependencia de build (`node-html-parser`).
- `.gitignore` — excluye `node_modules/`.
- `es/`, `en/` — 16 páginas generadas (8 por idioma: index, products, faq, research, insights, contact, leadership, 404).

**No modificados:** ningún HTML original, ni plantilla de artículos, ni CSS, ni diseño. `node_modules/` ignorado.

---

## 4. Decisiones técnicas aprobadas

### Fase 1
- Idioma determinado por la ruta; `localStorage` no lo sobrescribe; sin `?lang=` en `/es//en/`.
- Canónica **sin extensión**; `data-own-canonical` para proteger el canonical estático.
- El sitio es **solo oscuro** por diseño (no hay tema claro en el CSS); no se tocó el CSS.
- El **eslogan** "Automate the Work. Accelerate the Business." **no se traduce** (marca).

### Fase 2 (Schema.org)
- **Identidades globales estables por `@id`:**
  - `https://dynxlabs.com/#organization`
  - `https://dynxlabs.com/#person-arois`
  - `https://dynxlabs.com/#website`
- **Organization:** una sola `description` corporativa **global e idéntica** en ES/EN; `url`/`logo`/`sameAs` compartidos.
- **Person:** `jobTitle` canónico **"Founder & CEO"**; `sameAs` = LinkedIn oficial; **sin `url`** (entidad global = `@id` + `sameAs`); **sin `PostalAddress`** (era solo `addressCountry: CL`, no institucional).
- **Entidades de página** (`CollectionPage`, `ProfilePage`): `url`/`@id`/`inLanguage`/`isPartOf` localizados; `description` localizada vía la entidad de página.
- **BreadcrumbList** localizado (URLs `/es//en/` y nombres traducidos; el crumb raíz conserva la marca "DYNX Labs").
- **FAQPage** alimentado por las **mismas claves** (`faq.qN`/`faq.aN`) que el contenido visible → sin desincronización.
- **No** se inyectan entidades `WebPage` adicionales en páginas que no las tenían.
- **ItemList** de Insights: URLs de artículos **sin modificar** (diferido a la fase Insights).
- Transformación JSON-LD por **`JSON.parse`/`JSON.stringify` + splice**, nunca regex de reemplazo de contenido.

---

## 5. Pruebas ejecutadas y resultados

### Fase 1
| Prueba | Resultado |
|---|---|
| Páginas en ambos idiomas | ✅ 8 ES + 8 EN |
| Residuales `data-i18n` | ✅ 0 |
| Enlaces con prefijos duplicados (`/es/es/`) | ✅ 0 |
| `canonical` + `hreflang` por página | ✅ correcto (canonical `/es//en/`, hreflang recíproco en/es/x-default) |
| Toggle → página equivalente | ✅ `/es/… ↔ /en/…` verificado en navegador |
| Ruta vence a `localStorage` | ✅ con `localStorage=en`, `/es/leadership` se muestra en español |
| URLs sin `?lang=` | ✅ 0 en HTML y en navegación/recarga |
| Idempotencia (build ×2) | ✅ idéntico |
| Revisión visual escritorio + móvil | ✅ (tema oscuro único; animaciones esperadas antes de capturar) |
| GitHub Pages extensionless (prueba en producción, solo lectura) | ✅ `/products` y `/products.html` → 200/200, mismo contenido, sin redirección |

### Fase 2
| Prueba | Resultado |
|---|---|
| Parseo de todos los bloques JSON-LD | ✅ **22 bloques, 0 errores** (16 páginas) |
| Referencias `@id` globales consistentes ES/EN | ✅ `#organization`, `#person-arois`, `#website` |
| `Person` sin `url`, con `@id`/`jobTitle`/`sameAs` iguales ES/EN | ✅ |
| `ProfilePage.mainEntity` → `#person-arois` | ✅ ES y EN |
| `url`/`@id` de page-entities == canonical | ✅ |
| `inLanguage` correcto | ✅ es/en |
| FAQ visible == JSON-LD | ✅ (`faq.q1` ES = JSON-LD; 8/8) |
| Organization `description` global idéntica ES/EN | ✅ |
| `PostalAddress` eliminada de Person | ✅ |
| ItemList de artículos sin re-localizar | ✅ (0 localizadas) |
| Idempotencia (build ×2) | ✅ idéntico |

---

## 6. Validadores externos — PENDIENTES

**No ejecutados** (requieren URL pública o pegar el código manualmente; no se desplegó):
- **Schema Markup Validator** (validator.schema.org)
- **Google Rich Results Test**

La validación hecha aquí es **estructural/sintáctica local**. Recordatorio de la auditoría: validez ≠ elegibilidad a resultados enriquecidos. FAQ ya no genera rich result para sitios no gov/salud; BreadcrumbList sí es útil; BlogPosting/Article tienen elegibilidad limitada.

---

## 7. Problemas conocidos / pendientes para fases posteriores

1. **Insights bilingües (próxima fase):** generar `/es/insights/<slug>/` y `/en/insights/<slug>/` con `BlogPosting` localizado (renderer bilingüe en `generate-manifest.js` / `insight-render.js`). **No implementado.**
2. **ItemList de insights:** sus URLs de artículos siguen en esquema legacy; se localizan junto con los artículos.
3. **Sitemap:** regenerar al esquema `/es//en/`, listando **solo** las URLs canónicas sin extensión, con `hreflang` recíproco.
4. **`robots.txt`:** apunta a `sitemap_index.xml` (inexistente; archivo real `sitemap.xml`). **Bug pre-existente en producción**, a corregir en la fase de sitemap.
5. **Redirecciones de URLs antiguas** (`/products` → `/es//en/`) mediante stubs HTML (GitHub Pages no hace 301 de servidor).
6. **GitHub Actions:** extender el workflow para generar `/es//en/` y los artículos por idioma.
7. **Validadores externos** (§6) una vez haya URL pública o se peguen los bloques.

---

## 8. Estado Git actual (clon)

```
 M assets/js/i18n.js
 M locales/en.json
 M locales/es.json
?? .gitignore
?? scripts/build-i18n.js
?? package.json
?? package-lock.json
?? es/
?? en/
```
- `node_modules/` → ignorado por `.gitignore`.
- HTML originales → **sin modificaciones**.
- **Sin** commit, push, merge ni despliegue.

---

## 9. Reglas de continuidad

- Todo el trabajo permanece en **`scratchpad/dynx-site`**.
- **No** modificar `main`, la carpeta local original ni producción.
- La siguiente fase es **Insights bilingües**; **no** iniciarla hasta instrucción explícita.
