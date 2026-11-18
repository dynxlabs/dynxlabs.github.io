# Fase 5.2 — Redirecciones de URLs antiguas en producción

- **Proyecto:** sitio web de **[DYNX Labs](https://dynxlabs.com)**
- **Estado:** activas en producción desde el 18/11/2026, con código **301**.
- **Sustituye a:** el diseño de staging de la Fase 5.2 (4 reglas sobre el marcador `staging.tudominio`), que queda en el historial de git.
- **Archivos de este directorio:**
  - `REGLAS-PRODUCCION.txt`: expresiones y destinos literales de las 8 Redirect Rules, la lista Bulk y la regla Bulk, tal como están en Cloudflare.
  - `dynx_redirects.csv`: la lista Bulk (54 entradas) en el formato de importación de Cloudflare.
- **Control continuo:** `scripts/seo/checks/legacy-redirects.js` (grupo 9 de la auditoría SEO) reconstruye las reglas desde `../slugs.txt` y las páginas principales, las compara con estos archivos y simula todas las URLs antiguas en cada ejecución de CI.

## 1. Infraestructura

| Elemento | Configuración |
|---|---|
| DNS del dominio principal | 4 registros A hacia GitHub Pages, **con proxy de Cloudflare** |
| `www` | Con proxy de Cloudflare. Fuera de las reglas, GitHub Pages redirige `www` al dominio principal. |
| SSL/TLS | Modo Full. Certificado público de Cloudflare para `dynxlabs.com` y `*.dynxlabs.com`. |
| Page Rules existentes | `http://dynxlabs.com/*` → `https://` (conserva los parámetros) y `/ley-privacidad` → bcn.cl |
| Plan | Free: 8 de 10 Redirect Rules usadas. Bulk: 1 lista, 54 URLs, 1 regla. |

## 2. Reglas

Redirect Rules (Single Redirects), todas de tipo **Dynamic** con código **301**. Las expresiones literales están en `REGLAS-PRODUCCION.txt`.

| Regla | Cubre | Destino | Query |
|---|---|---|---|
| S1 | ES · artículo antiguo sin barra (29) | `/es/insights/<slug>/` | Se descarta |
| S2 | ES · raíz, 6 páginas principales y artículo antiguo con barra (36) | `/es/…` | Se descarta |
| S3 | ES · artículo antiguo `/index.html` (29) | `/es/insights/<slug>/` (`wildcard_replace`) | Se descarta |
| S4 | EN · artículo antiguo sin barra | `/en/insights/<slug>/` | Se descarta |
| S5 | EN · 6 páginas principales y artículo antiguo con barra; raíz solo con `?lang=en` | `/en/…` | Se descarta |
| S6 | EN · artículo antiguo `/index.html` | `/en/insights/<slug>/` (`wildcard_replace`) | Se descarta |
| S7 | Variante `/index.html` de artículos nuevos | `/es|en/insights/<slug>/` | Se conserva |
| S8 | Host canónico: `www` (fuera de las rutas de la lista Bulk) | `https://dynxlabs.com` + ruta | Se conserva |

**Español o inglés:** una regla en español se aplica cuando la query contiene `lang=es` exacto, porque el campo no se decodifica y distingue mayúsculas. Cualquier otro caso va a inglés, salvo la raíz.

**Lista Bulk `dynx_redirects`:** 27 rutas × 2 hosts (`dynxlabs.com` y `www.dynxlabs.com`).

| Rutas | Destino | Query |
|---|---|---|
| `/` (raíz), `/index.html`, `/index` | `/es/` | Se descarta |
| `/products.html`, `/research.html`, `/faq.html`, `/contact.html`, `/leadership.html`, `/insights.html` | `/en/<página>` | Se descarta |
| `/insights/insight-post`, `/insights/insight-post.html` (plantilla) | `/en/insights` | Se descarta |
| `/es/` y `/en/` + `index`, `index.html` y las 6 `<página>.html` | URL limpia del mismo idioma | Se conserva |

**Regla Bulk `dynx-redirects`:** `(http.host in {"dynxlabs.com" "www.dynxlabs.com"}) and (http.request.full_uri in $dynx_redirects)`.

**Orden en el panel:** S3, S6, S1, S2, S4, S5, S7, S8. Es obligatorio que cada regla en español vaya antes que su equivalente en inglés (S3/S6, S1/S4, S2/S5) y que S8 vaya la última. Las Redirect Rules se evalúan antes que las Bulk y que las Page Rules.

## 3. Decisiones

- **Raíz → `/es/`:** coherente con `x-default`. Solo `/?lang=en` va a `/en/`.
- **`.html` antiguas → inglés:** la lista Bulk no puede leer la query string, así que `/products.html?lang=es` va a `/en/products`.
- **Sin parámetros residuales:** las redirecciones de URLs antiguas descartan la query string completa, UTM incluidos.
- **Eslogan:** se mantiene en inglés en ambos idiomas, por decisión de marca.

## 4. Verificación en producción (18/11/2026)

| Prueba | Resultado |
|---|---|
| 940 escenarios: 816 URLs antiguas (102 rutas × `lang` × 2 hosts × http/https), 114 residuos y controles, 6 de host con punto final y 4 de URLs nuevas por `http` | **939 de 940**, en fase 302 y de nuevo en 301 |
| URLs antiguas | 816 de 816: un salto, destino 200, sin query, canonical = destino e idioma correcto |
| Auditoría de metadatos de las 72 URLs del sitemap | 72 de 72: 200, indexables, canonical autorreferente, hreflang recíproco |

**Residuo aceptado:** `https://dynxlabs.com./es/products` (dominio principal con punto final y URL nueva) responde 200. Cloudflare elimina el punto final de `http.host` antes de evaluar las reglas, así que S8 no lo distingue. La página declara el canonical limpio.

## 5. Mantenimiento

- **Artículos o contenido nuevos:** no requieren cambios. Nacen en `/es/` y `/en/`, y S7 y S8 funcionan por patrón.
- **Página principal nueva:** funciona sin cambios. Para cubrir su variante `.html`, hay que añadirla a la lista Bulk, a la exclusión de S8 y a este directorio. La auditoría lo exigirá.
- **Renombrar o eliminar uno de los 29 artículos antiguos:** hay que actualizar `slugs.txt`, S1 a S6 y estos archivos. La auditoría falla mientras no coincidan.
- **Traducción de slugs (pendiente):** necesitará redirecciones nuevas. Se recomienda la lista Bulk, porque quedan solo 2 Redirect Rules libres.

## 6. Reversión

- Desactivar una regla en Cloudflare es inmediato. Un 301 ya recibido permanece en la caché de esos navegadores.
- Quitar el proxy (nube gris) desactiva todas las reglas y las Page Rules. Las URLs antiguas pasarían a 404, porque sus archivos ya no están en el repositorio.
