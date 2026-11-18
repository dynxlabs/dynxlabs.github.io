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
| **DYNX Orah** | Plataforma de reservas y agendamiento que convierte cada hora disponible en una cita confirmada | En desarrollo |
| **DYNX Synapse** | Plataforma de captura, gestión y análisis de leads con IA | En desarrollo |
| **DYNX Pulse** | Dashboard de inteligencia de negocio en tiempo real que muestra las métricas que realmente importan para tu operación | En desarrollo |
| **DYNX Connect** | Capa de integración sin código que conecta tus herramientas actuales sin escribir una sola línea de código | En desarrollo |

Textos y estados tomados del sitio publicado ([soluciones](https://dynxlabs.com/es/) y [productos](https://dynxlabs.com/es/products)).

Este repositorio contiene el código fuente del sitio web.

---

## Características principales

- **Sitio bilingüe**: español en `/es/` (versión por defecto) e inglés en `/en/`. Son 7 páginas principales y 29 artículos de Insights por idioma, 72 URLs en total.
- **SEO internacional**: canonical autorreferente, `hreflang` recíproco (`es`, `en` y `x-default` hacia español), JSON-LD localizado y un único `sitemap.xml` con las alternativas de idioma.
- **HTML prerenderizado**: el contenido y los metadatos están en el HTML inicial, sin depender de JavaScript para indexarse.
- **Imágenes para redes por idioma**: cada artículo tiene su imagen Open Graph en español y en inglés.
- **Redirecciones permanentes**: las URLs anteriores a la migración (`?lang=es`, `.html`, `/insights/<slug>/`) redirigen con 301 a su equivalente en `/es/` o `/en/` desde Cloudflare.
- **Calidad automatizada**: cada cambio pasa por un build reproducible y una auditoría SEO de 103 comprobaciones en GitHub Actions.
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
                                   | 103 comprobaciones |                |
                                   +--------------------+                v
                                                                 [Visitantes y
                                                                  buscadores]
```

**Flujo completo:**
1. El contenido se edita en las **fuentes**: las páginas de la raíz, los artículos en `insights/posts/*.json` y los textos en `locales/`.
2. El **build** genera las páginas de `/es/` y `/en/`, el manifest de artículos y el `sitemap.xml`. En `main`, el workflow de publicación también genera las imágenes para redes de los artículos nuevos (`scripts/og-images.js`).
3. **SEO CI** valida cada pull request: build reproducible, canonical, hreflang, JSON-LD, sitemap, enlaces, metadatos, calidad HTML y la configuración de redirecciones.
4. Al integrar en `main`, **GitHub Pages** publica el sitio y **Cloudflare** lo sirve con TLS y las redirecciones permanentes.

---

## Estructura del repositorio

```
dynxlabs.github.io/
|
+-- .github/
|   +-- workflows/
|   |   +-- seo-ci.yml                   Validación de PR y main (solo lectura)
|   |   +-- build-manifest.yml           Regeneración y publicación de contenido en main
|   +-- seo/                             Documentación de la migración SEO
|       +-- phase-5.2/production/        Configuración de redirecciones en producción
|
+-- index.html, products.html, ...       Fuentes de las páginas principales
+-- 404.html                             Página de error (GitHub Pages)
|
+-- insights/
|   +-- posts/*.json                     Fuente de verdad de cada artículo (ES + EN)
|   +-- insight-post.html                Plantilla de artículo
|   +-- manifest.json                    Generado
|
+-- es/, en/                             Sitio publicado (generado)
+-- locales/                             Textos de la interfaz (es.json, en.json)
+-- assets/                              CSS, JavaScript, iconos e imágenes
+-- scripts/                             Build y auditoría SEO
|
+-- generate-manifest.js
+-- sitemap.xml                          Generado
+-- robots.txt
+-- _config.yml                          Excluye de la publicación los archivos del repositorio
+-- package.json
+-- README.md
```

> No edites a mano `en/`, `es/`, `sitemap.xml`, `insights/manifest.json` ni `assets/js/insights-data.js`: son salidas del build.

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
| Cloudflare | Plan Free | DNS, proxy, TLS y redirecciones 301 |
| GitHub Actions | — | SEO CI y publicación de contenido |

---

## Componentes

| Componente | Estado |
|---|---|
| Sitio bilingüe ES/EN (72 URLs) | :green_circle: Activo |
| Insights (29 artículos por idioma) | :green_circle: Activo |
| Redirecciones permanentes (8 Redirect Rules + lista Bulk de 54) | :green_circle: Activo en 301 |
| SEO CI (auditoría de 103 comprobaciones) | :green_circle: Activo |
| Publicación automática de artículos (`build-manifest.yml`) | :green_circle: Activo |
| Traducción de slugs de artículos al inglés | :white_circle: Pendiente, sin fecha |

---

## Desarrollo local

Requiere **Node.js 22** (`.nvmrc`).

```bash
npm ci
```

```bash
npm run build
```

```bash
npm test
```

| Comando | Qué hace |
|---|---|
| `npm run build` | Genera el manifest, los artículos, el sitemap y las páginas `/es/` y `/en/` |
| `npm test` | Build doble (reproducibilidad y deriva) y auditoría SEO completa |
| `npm run audit:seo` | Solo la auditoría SEO |
| `npm run audit:redirects` | Solo la configuración de redirecciones |

**Publicar un artículo nuevo:** añade su JSON en `insights/posts/` e intégralo en `main`. El workflow *Generate Insights Manifest* genera las páginas, el sitemap y las imágenes para redes, los audita y confirma el resultado. No hace falta tocar las redirecciones: los artículos nuevos nacen en `/es/` y `/en/`.

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
- El sitio no usa secretos: los workflows de GitHub Actions no requieren ninguno.
- Para reportar una vulnerabilidad, usa el formulario de contacto de [dynxlabs.com](https://dynxlabs.com/).

---

## Última actualización

**18 Nov 2026** — Migración SEO internacional publicada: sitio bilingüe en `/es/` y `/en/` con canonical, hreflang y sitemap únicos, y redirecciones permanentes (301) en Cloudflare desde todas las URLs anteriores, verificadas en producción (939 de 940 escenarios). Limpieza posterior: se retiraron los artículos y el sitemap antiguos, los archivos de desarrollo dejaron de publicarse y SEO CI valida ahora la configuración real de redirecciones.

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
