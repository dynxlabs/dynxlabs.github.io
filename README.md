<p align="center">
  <img src="assets/icons/logo.svg" alt="DYNX Labs" width="320">
</p>

<p align="center">
  <strong>Automate the Work. Accelerate the Business.</strong>
</p>

<p align="center">
  Sitio web oficial de <strong>DYNX Labs</strong> · <a href="https://dynxlabs.com">dynxlabs.com</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/estado-Activo-brightgreen?style=flat-square" alt="Estado">
  <img src="https://img.shields.io/badge/idioma-ES%20%7C%20EN-orange?style=flat-square" alt="Idioma">
  <img src="https://img.shields.io/badge/hosting-GitHub%20Pages%20%2B%20Cloudflare-blue?style=flat-square" alt="Hosting">
  <img src="https://img.shields.io/badge/licencia-Proprietary-red?style=flat-square" alt="Licencia">
  <a href="https://github.com/dynxlabs/dynxlabs.github.io/actions/workflows/seo-ci.yml"><img src="https://github.com/dynxlabs/dynxlabs.github.io/actions/workflows/seo-ci.yml/badge.svg" alt="SEO CI"></a>
</p>

---

## Qué es DYNX Labs

**DYNX Labs** construye software impulsado por IA que permite a los equipos automatizar operaciones, integrar herramientas y tomar decisiones más rápidas basadas en datos confiables.

### Soluciones

| Solución | Descripción |
|---|---|
| **AI Agents** | Agentes de inteligencia artificial para operaciones internas que aprenden, se adaptan y ejecutan tareas complejas de forma automática |
| **Workflow Automation** | Eliminamos procesos repetitivos conectando tus herramientas actuales para crear flujos de trabajo autónomos y eficientes |
| **Dashboards & Reporting** | Visualización de datos en tiempo real con insights accionables generados automáticamente por IA para decisiones estratégicas |
| **System Integrations** | Conectamos tus sistemas actuales creando ecosistemas unificados que comunican datos sin fricciones |
| **Business Intelligence** | Sistemas que transforman datos crudos en decisiones estratégicas automatizadas |
| **Custom SaaS** | Desarrollo de software como servicio a medida, diseñado específicamente para las necesidades únicas de tu negocio |

### Productos

| Producto | Descripción | Estado |
|---|---|---|
| **DYNX Synapse** | Plataforma de captura, gestión y análisis de leads con IA | En desarrollo |
| **DYNX Pulse** | Dashboard de inteligencia de negocio en tiempo real que muestra las métricas que realmente importan para tu operación | En desarrollo |
| **DYNX Connect** | Capa de integración sin código que conecta tus herramientas actuales sin escribir una sola línea de código | En desarrollo |

Textos y estados tomados del sitio publicado ([soluciones](https://dynxlabs.com/es/) y [productos](https://dynxlabs.com/es/products)).

Este repositorio contiene el código fuente del sitio web.

---

## Características principales

- **Sitio bilingüe**: español en `/es/` (versión por defecto) e inglés en `/en/`. Cada idioma tiene **38 URLs**: 7 páginas principales, 2 páginas legales (privacidad y términos) y 29 artículos de Insights. Total: **76 URLs** en el sitemap.
- **SEO internacional**: canonical autorreferente, `hreflang` recíproco (`es`, `en` y `x-default` hacia español), JSON-LD localizado y un único `sitemap.xml` con las alternativas de idioma.
- **HTML prerenderizado**: el contenido y los metadatos están en el HTML inicial, sin depender de JavaScript para indexarse.
- **Imágenes para redes por idioma**: cada artículo tiene su imagen Open Graph en español y en inglés.
- **Redirecciones permanentes**: las URLs anteriores a la migración redirigen con 301 a su equivalente en `/es/` o `/en/` desde Cloudflare.
- **Datos estructurados**: Organization, Person y WebSite en la home; BreadcrumbList; FAQPage en preguntas frecuentes; BlogPosting con `dateModified` en cada artículo.
- **Feeds RSS 2.0** de Insights en cada idioma.
- **Protocolos de rastreo y contacto**: `robots.txt` con política de crawlers de IA, `llms.txt`, `security.txt` (RFC 9116) e IndexNow.
- **Accesibilidad WCAG 2.1 AA** verificada con axe-core en todas las páginas.
- **Calidad automatizada**: cada cambio pasa por un build reproducible y una auditoría SEO en GitHub Actions. Resultado actual: **98 PASS / 0 FAIL / 1 WARNING** (MET-11, preexistente).
- **Publicación automática de artículos**: basta añadir el JSON del artículo. El workflow genera las páginas, el sitemap y las imágenes, los audita y los publica.

---

## Arquitectura

```
                                   FLUJO DE PUBLICACIÓN

  [Fuentes]                        [Build]                      [Publicación]
      |                               |                               |
      v                               v                               v
  +------------------+   npm run   +--------------------+   main   +--------------+
  | Páginas raíz     |   build     | generate-manifest  |  ------> | GitHub Pages |
  | insights/posts   | ----------> | build-i18n         |          | (origen)     |
  | locales/         |             |                    |          +--------------+
  +------------------+             +--------------------+                 |
                                             |                           v
                                     /es/  /en/  sitemap         +--------------+
                                             |                   | Cloudflare   |
                                             v                   | DNS · TLS ·  |
                                   +--------------------+        | redirecciones|
                                   | Auditoría SEO (CI) |        +--------------+
                                   | 98 PASS / 0 FAIL   |                |
                                   +--------------------+                v
                                                                 [Visitantes y
                                                                  buscadores]
```

**Flujo completo:**
1. El contenido se edita en las **fuentes**: las páginas de la raíz, los artículos en `insights/posts/*.json` y los textos en `locales/`.
2. El **build** genera las páginas de `/es/` y `/en/`, el manifest de artículos, los feeds RSS y el `sitemap.xml`. En `main`, el workflow de publicación también genera las imágenes para redes de los artículos nuevos (`scripts/og-images.js`).
3. **SEO CI** valida cada pull request: build reproducible, canonical, hreflang, JSON-LD, sitemap, enlaces, metadatos, calidad HTML y la configuración de redirecciones.
4. Al integrar en `main`, **GitHub Pages** publica el sitio, **Cloudflare** lo sirve con TLS y las redirecciones permanentes, y el workflow **IndexNow** avisa a los buscadores de las URLs que cambiaron.

---

## Estrategia SEO implementada

Esta sección es la referencia de qué se implementó, cuándo y por qué. Cada elemento indica su PR y su fecha de integración en `main`.

### 1. Indexación y arquitectura de idiomas

| Elemento | Implementación | Fecha / PR |
|---|---|---|
| Rutas por idioma | `/es/` y `/en/`. El idioma lo determina la ruta; `localStorage` y `?lang=` no lo cambian en rutas nuevas. Las páginas raíz conservan su comportamiento legado. | Fases 1–2 (`.github/seo/PHASES_1_2_APPROVED.md`) |
| Canonical | Autorreferente en cada página, sin parámetros | Migración SEO, 18/11/2026 |
| Hreflang | `es`, `en` y `x-default` hacia español; reciprocidad verificada por la auditoría | Migración SEO, 18/11/2026 |
| Sitemap | Un único `sitemap.xml` con las 76 URLs y sus alternativas de idioma | Migración SEO, 18/11/2026 |
| Contenido en HTML inicial | Los textos `data-i18n` se hornean en el build (`scripts/i18n-bake.js`), no dependen de JavaScript | Migración SEO, 18/11/2026 |
| Sin `?lang=` | Auditado en HTML, navegación y recarga (HTM-09) | Fase 2 |

### 2. Redirecciones de URLs antiguas

| Elemento | Implementación | Fecha / PR |
|---|---|---|
| Redirect Rules (Cloudflare) | 8 reglas dinámicas, tipo 301, con tratamiento de query explícito. Documentadas en `.github/seo/phase-5.2/production/`. | 18/11/2026 |
| Lista Bulk | 54 entradas 301 para URLs `.html` y `/insights/<slug>/` (la lista Bulk no lee la query string) | 18/11/2026 |
| Verificación | 939 de 940 escenarios correctos en producción. Las 76 URLs del sitemap no coinciden con ninguna regla (LGC-10). | 18/11/2026 |
| Regla `?lang=` duplicado | Regla de Cloudflare que envía `/es/?lang=es` y equivalentes a la URL limpia con 301 | 25/11/2026 |

> **Nota:** la regla de `?lang=` se creó en el panel de Cloudflare y **no está listada en la documentación de las 8 reglas del repo**. Para mantenimiento, debe agregarse a `.github/seo/phase-5.2/production/` y a la auditoría LGC.

### 3. Rastreo, IA y contacto

| Elemento | Implementación | Fecha / PR |
|---|---|---|
| `robots.txt` | `Allow: /` para todos. Bloqueo total a los crawlers de entrenamiento: `GPTBot`, `ClaudeBot`, `CCBot`, `Google-Extended`. Permitidos los de búsqueda y citación: `OAI-SearchBot`, `Claude-SearchBot`. Incluye `Sitemap:`. | PR #34, 23/11/2026 |
| `llms.txt` | Resumen para modelos de lenguaje, en español completo seguido de inglés completo. Un único `H1`. Los productos aparecen como "En desarrollo". | PR #33, 23/11/2026 |
| IndexNow | Workflow `indexnow.yml`: en cada push a `main` que toque HTML, `sitemap.xml` o el manifest, envía las URLs cambiadas a `api.indexnow.org` (`scripts/indexnow-urls.js`). La clave se sirve en `/95f737087d1517a07480f1ba09106933.txt`. Excluye `llms.txt` y `robots.txt`. | PR #35, 23/11/2026 |
| `security.txt` | `/.well-known/security.txt` (RFC 9116). `Contact: mailto:security@dynxlabs.com`, `Preferred-Languages: es, en`, `Expires: 2027-11-23`, `Policy` a la página de privacidad. `_config.yml` incluye `.well-known` en la publicación. | PR #36, 23/11/2026 |

### 4. Datos estructurados y feeds

| Elemento | Implementación | Fecha / PR |
|---|---|---|
| Home | Organization, Person, WebSite | Migración SEO |
| FAQ | FAQPage | Migración SEO |
| Breadcrumbs | BreadcrumbList | Migración SEO |
| Artículos | BlogPosting con `headline`, `datePublished` y `dateModified` (si no existe, se usa `datePublished`). Se genera en el build (`assets/js/insight-render.js`). | `dateModified`: PR #39, 25/11/2026 |
| Feed RSS 2.0 | `/es/insights/feed.xml` y `/en/insights/feed.xml`, 29 elementos cada uno, con `dc:creator`, fechas RFC 822 y escape XML. Generado en `generate-manifest.js`. Enlazado como `<link rel="alternate">` desde Insights. | PR #41, 25/11/2026 |
| Open Graph | Imagen por artículo y por idioma | Migración SEO |

### 5. Página 404

| Elemento | Implementación | Fecha / PR |
|---|---|---|
| Diseño | Bilingüe, con el mismo header y footer del sitio. Formato "404 | mensaje". | PR #37, 25/11/2026 |
| Ajustes | Tamaño del mensaje limitado (`.nf-section .nf-msg`), alineación del "404" con el texto, `min-width: 0` para que no se corte en móvil | PR #38, 25/11/2026 |
| Indexación | `noindex` (HTM-05) | — |

### 6. Accesibilidad WCAG 2.1 AA

Accesibilidad y SEO se miden juntos: los buscadores valoran la experiencia y Google usa la accesibilidad como señal de calidad.

| Elemento | Implementación | Fecha / PR |
|---|---|---|
| Selector de idioma | Usa `aria-current="true"` en el idioma activo. `aria-pressed` solo es válido en `<button>`, no en enlaces. | PR #40, 25/11/2026 |
| Búsqueda del menú | `aria-label` traducido en el campo | PR #40, 25/11/2026 |
| Contraste | Texto secundario con ≥ 4.5:1 sobre fondo. Valores de referencia: `#8a8a8a` (6.08:1 sobre `#000`), `#9a9a9a` (7.04:1 sobre `#0a0a0a`), `rgba(255,255,255,0.55)` ≈ `#8c8c8c`. | PR #40 (home) y PR #42 (resto) |
| Resultado axe-core 4.10.2 | 0 violaciones en todas las páginas ES y EN | PR #42, 25/11/2026 |
| Resultado Lighthouse | **100 en accesibilidad en la home** (desktop y móvil). Las demás páginas no se volvieron a medir con Lighthouse después del PR #42. | 25/11/2026 |

### 7. Medición

| Elemento | Implementación | Fecha |
|---|---|---|
| GA4 | Activo con Consent Mode y banner de cookies propio. Datos reales desde esa fecha. | 21/11/2026 |
| Search Console | Propiedad de dominio `dynxlabs.com` | Línea base 23/11/2026 |
| Bing Webmaster Tools | 76 URLs descubiertas tras reenvío manual del sitemap | 23/11/2026 |

---

## Metodología

El trabajo SEO sigue este orden. Es la misma secuencia que se debe usar en cualquier sitio nuevo.

1. **Línea base** antes de tocar nada: estado técnico verificado en el repo, métricas de Search Console, Bing y GA4. Documentada en el tracker del equipo (`SEO_Linea_Base_2026-11-23.md`, fuera de este repo).
2. **Priorizar** con matriz impacto / esfuerzo. Primero lo que no requiere configuración externa.
3. **Lotes** de cambios relacionados.
4. **Una rama y un PR por cambio**, con auditoría en verde antes del PR.
5. **Revisión a las 4 semanas.** Ningún cambio se juzga antes de la revisión. Criterios:
   - Sube el número de páginas indexadas frente a la línea base.
   - Bing reconoce las URLs del sitemap.
   - Las URLs antiguas dejan de aparecer en resultados.

Próxima revisión: **21/12/2026**.

---

## Estructura del repositorio

```
dynxlabs.github.io/
|
+-- .github/
|   +-- workflows/
|   |   +-- seo-ci.yml                   Validación de PR y main (solo lectura)
|   |   +-- build-manifest.yml           Regeneración y publicación de contenido en main
|   |   +-- indexnow.yml                 Aviso de URLs cambiadas a IndexNow
|   +-- seo/                             Documentación de la migración SEO
|       +-- phase-5.2/production/        Configuración de redirecciones en producción
|
+-- .well-known/
|   +-- security.txt                     Contacto de seguridad (RFC 9116)
|
+-- index.html, products.html, ...       Fuentes de las páginas principales
+-- 404.html                             Página de error (GitHub Pages)
+-- 95f737087d1517a07480f1ba09106933.txt Clave de verificación de IndexNow
|
+-- insights/
|   +-- posts/*.json                     Fuente de verdad de cada artículo (ES + EN)
|   +-- insight-post.html                Plantilla de artículo
|   +-- manifest.json                    Generado
|
+-- es/, en/                             Sitio publicado (generado)
|   +-- insights/feed.xml                Feed RSS del idioma (generado)
+-- locales/                             Textos de la interfaz (es.json, en.json)
+-- assets/                              CSS, JavaScript, iconos e imágenes
+-- scripts/                             Build, auditoría SEO e IndexNow
|
+-- generate-manifest.js                 Manifest, páginas, feeds y sitemap
+-- sitemap.xml                          Generado
+-- robots.txt                           Política de rastreo
+-- llms.txt                             Resumen para modelos de lenguaje
+-- _config.yml                          Excluye de la publicación los archivos del repositorio
+-- package.json
+-- README.md
```

> No edites a mano `en/`, `es/`, `sitemap.xml`, `insights/manifest.json`, `assets/js/insights-data.js` ni los feeds: son salidas del build.

---

## Stack tecnológico

| Tecnología | Versión | Propósito |
|---|---|---|
| HTML / CSS / JavaScript | ES6+ | Sitio estático |
| Tailwind CSS (CDN) | — | Utilidades de estilo |
| Inter (Google Fonts) | — | Tipografía |
| Node.js | 22 | Build y auditoría |
| node-html-parser | 9.x | Procesamiento de HTML en el build y la auditoría |
| Playwright | 1.x | Generación de imágenes Open Graph |
| GitHub Pages | — | Publicación de `main` |
| Cloudflare | Plan Free | DNS, proxy, TLS, redirecciones 301 y Email Routing |
| GitHub Actions | — | SEO CI, publicación de contenido e IndexNow |

---

## Componentes

| Componente | Estado |
|---|---|
| Sitio bilingüe ES/EN (76 URLs) | :green_circle: Activo |
| Insights (29 artículos por idioma, con RSS) | :green_circle: Activo |
| Redirecciones permanentes (8 Redirect Rules + lista Bulk de 54 + regla `?lang=`) | :green_circle: Activo en 301 |
| robots.txt, llms.txt, security.txt | :green_circle: Activo |
| IndexNow | :green_circle: Activo |
| SEO CI (98 PASS / 0 FAIL / 1 WARNING) | :green_circle: Activo |
| Publicación automática de artículos (`build-manifest.yml`) | :green_circle: Activo |
| Traducción de slugs de artículos al inglés | :white_circle: Pendiente, sin fecha |

---

## Verificación

Comandos para comprobar el estado del sitio antes de integrar un cambio:

```bash
npm ci
npm run build
npm test
```

| Comando | Qué hace |
|---|---|
| `npm run build` | Genera el manifest, los artículos, los feeds, el sitemap y las páginas `/es/` y `/en/` |
| `npm test` | Build doble (reproducibilidad y deriva) y auditoría SEO completa |
| `npm run audit:seo` | Solo la auditoría SEO |
| `npm run audit:redirects` | Solo la configuración de redirecciones |

**Comprobaciones manuales en producción:**

```bash
curl -sI https://dynxlabs.com/robots.txt
curl -s  https://dynxlabs.com/llms.txt | head -5
curl -s  https://dynxlabs.com/.well-known/security.txt
curl -sI https://dynxlabs.com/es/insights/feed.xml
curl -sI https://dynxlabs.com/en/insights/feed.xml
```

**Caché:** los recursos (CSS, JS) se sirven con `max-age=14400` (4 horas). Después de un despliegue, el navegador puede mostrar versiones antiguas. Para validar, usar Ctrl+Shift+R o una ventana privada.

**Publicar un artículo nuevo:** añade su JSON en `insights/posts/` e intégralo en `main`. El workflow *Generate Insights Manifest* genera las páginas, el sitemap, los feeds y las imágenes para redes, los audita y confirma el resultado. No hace falta tocar las redirecciones: los artículos nuevos nacen en `/es/` y `/en/`.

---

## Pendientes

| Pendiente | Estado |
|---|---|
| Traducción de slugs de artículos al inglés | Sin fecha |
| Decidir el destino de `/products` (inglés o español) | Decisión pendiente |
| Revisión de resultados en Search Console y Bing | 21/12/2026 |
| Casos de éxito | Pendiente de clientes |
| Focus visible explícito en todos los enlaces e iconos (mejora más allá de WCAG AA) | Opcional |

---

## Documentación

| Documento | Descripción |
|---|---|
| [Redirecciones en producción](.github/seo/phase-5.2/production/PHASE-5.2-PRODUCTION.md) | Reglas de Cloudflare, decisiones, verificación y mantenimiento |
| [Fase 6: CI y auditoría SEO](.github/seo/PHASE-6-GITHUB-ACTIONS-SEO-FINAL.md) | Workflows, comprobaciones de la auditoría y su mantenimiento |
| [Fases 1 y 2](.github/seo/PHASES_1_2_APPROVED.md) | Punto de control de la internacionalización ES/EN (fases 1 y 2) |

---

## Document Authority

### Autor

**Arois Monsalve**
Founder & CEO
**DYNX Labs**

### Desarrollo y mantenimiento

| Rol | Responsable |
|---|---|
| Ingeniera Líder & Arquitecta de Producto | Lyra (Claude Code) |
| QA & Performance | Lyra (Claude Code) |
| Aprobación y dirección de producto | ArMons |

---

## Sitio web

:globe_with_meridians: **[dynxlabs.com](https://dynxlabs.com/)**

Contacto a través del formulario del sitio web.

---

## Seguridad

> :warning: Este repositorio es **público**. El código y el contenido son propiedad de DYNX Labs.

- No incluir tokens, API keys, credenciales ni archivos `.env` en commits.
- El sitio no usa secretos: los workflows de GitHub Actions no requieren ninguno. La clave de IndexNow es pública por diseño (verifica la propiedad del dominio).
- Para reportar una vulnerabilidad, escribe a **security@dynxlabs.com** (ver [`/.well-known/security.txt`](https://dynxlabs.com/.well-known/security.txt)) o usa el formulario de [dynxlabs.com](https://dynxlabs.com/).

---

## Última actualización

**26 Nov 2026** — Se completó la documentación SEO de referencia. Se publicaron en `main` los PRs #33 a #42 (23 al 25 de noviembre): llms.txt, robots.txt con política de crawlers de IA, IndexNow, security.txt, página 404 rediseñada, dateModified en artículos, feeds RSS de Insights y correcciones de accesibilidad WCAG 2.1 AA en todas las páginas. Este README reemplaza la descripción anterior, que solo cubría la migración del 18 de noviembre.

---

## Aviso legal

```
Copyright (c) 2026 Dynamic Neuromorphic Labs SpA (DYNX Labs)
Todos los derechos reservados.

Este software es propiedad exclusiva de Dynamic Neuromorphic Labs SpA.
Su uso, copia, modificación o distribución sin autorización expresa y
por escrito de DYNX Labs está estrictamente prohibida.

Web: https://dynxlabs.com/
```
