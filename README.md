# DYNX Labs

### Automate the Work. Accelerate the Business.

DYNX Labs builds AI-powered systems that automate operations, integrate business tools, and transform data into intelligent decisions.

Our mission is to architect the transition toward **autonomous business operations**.

---

## Core Capabilities

**AI Agents**
Autonomous agents designed to execute operational tasks and coordinate workflows.

**Workflow Automation**
Automation infrastructure that eliminates repetitive processes.

**System Integrations**
Connecting CRMs, internal platforms, and operational tools into unified ecosystems.

**Dashboards & Reporting**
Real-time operational visibility with AI-generated insights.

**Business Intelligence**
Data-driven systems that convert operational data into strategic decisions.

**Custom SaaS Platforms**
Software systems designed specifically for modern business operations.

---

## Technology Stack

### AI & LLMs

* Claude
* ChatGPT
* Gemini
* Grok
* DeepSeek

### Infrastructure

* API integrations
* automation workflows
* data pipelines
* cloud systems
* custom software architectures

---

## Vision

Modern companies run on fragmented tools and manual workflows.

DYNX Labs designs the infrastructure that allows organizations to move toward **autonomous operations powered by artificial intelligence**.

---

## Website

https://dynxlabs.com — available in Spanish (`/es/`, default) and English (`/en/`).

Contact us through the form available on our website.

---

## About this repository

Source of the DYNX Labs website. GitHub Pages publishes the `main` branch as-is; Cloudflare sits in front of it (DNS, TLS and redirects).

### Site structure

| Path | Content |
|---|---|
| `/es/`, `/en/` | Generated bilingual site: 7 main pages per language and one page per Insights article (`/es/insights/<slug>/`, `/en/insights/<slug>/`) |
| `sitemap.xml` | The only sitemap, generated: every canonical URL with its `es`, `en` and `x-default` (Spanish) alternates |
| `robots.txt` | Allows everything and declares `sitemap.xml` |

Every page has a self-referencing canonical and reciprocal hreflang. The pre-migration URLs (`/products`, `?lang=es`, `/insights/<slug>/`, `.html`…) are permanently redirected (301) by Cloudflare to their `/es/` or `/en/` equivalent; the rules live in [`.github/seo/phase-5.2/production/`](.github/seo/phase-5.2/production/PHASE-5.2-PRODUCTION.md).

### Repository layout

| Path | Role |
|---|---|
| `index.html`, `products.html`, `research.html`, `faq.html`, `contact.html`, `leadership.html`, `insights.html`, `404.html` | **Sources** of the main pages (not published as such: their old URLs redirect to `/es/` and `/en/`). `404.html` is also the error page GitHub Pages serves. |
| `insights/posts/*.json` | **Source of truth** of every article, in both languages |
| `insights/insight-post.html` | Article page template |
| `locales/es.json`, `locales/en.json` | Interface texts |
| `assets/` | CSS, JavaScript, icons and images (share images in `assets/images/og/`) |
| `en/`, `es/`, `sitemap.xml`, `insights/manifest.json`, `assets/js/insights-data.js` | **Generated** — do not edit by hand |
| `generate-manifest.js`, `scripts/` | Build and SEO audit |
| `_config.yml` | Keeps repository-only files (this README, `package.json`, `scripts/`, article JSON) out of the published site |
| `.github/` | CI workflows and SEO documentation |

### Working on the site

Requires Node.js 22 (`.nvmrc`).

```bash
npm ci
```

```bash
npm run build
```

```bash
npm test
```

- `npm run build` regenerates the manifest, the article pages, the sitemap and the `/es/` and `/en/` pages.
- `npm test` builds twice (reproducibility and drift) and runs the SEO audit: canonical, hreflang, JSON-LD, sitemap, links, metadata, HTML quality and the production redirect configuration.

**New article:** add its JSON file to `insights/posts/` and push to `main`. The *Generate Insights Manifest* workflow builds the pages, the sitemap and the share images, audits them and commits the result. No redirect changes are needed: new articles are born at `/es/` and `/en/`.

### Continuous integration

- **SEO CI** (`seo-ci.yml`, read-only): runs on every pull request and push to `main`; build reproducibility, the full SEO audit and the redirect configuration.
- **Generate Insights Manifest** (`build-manifest.yml`): the only workflow with write access; regenerates the generated files on `main` and refuses to commit output that fails the audit.
