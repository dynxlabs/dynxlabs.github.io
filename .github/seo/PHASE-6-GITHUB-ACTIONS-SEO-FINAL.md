# Fase 6 — GitHub Actions, control de calidad y auditoría SEO final

- **Proyecto:** sitio web de **[DYNX Labs](https://dynxlabs.com)** (migración SEO internacional ES/EN)
- **Revisión:** 3, del 18 de noviembre de 2026. La revisión 2 (14/11) incorporó los cuatro ajustes pedidos tras la del 13/11 (apartado 9). La revisión 3 no cambia código: añade la conciliación de recuentos, la verificación del sitemap y la prueba del menú móvil con clics reales (apartado 9.5).
- **Estado:** implementada y verificada en local. **Nada confirmado, subido ni desplegado.** Pendiente de autorización.
- **Documentos relacionados:** `SEO-FINAL-AUDIT-REPORT.md` (resultados y evidencia), `PHASE-6-EXECUTIVE-SUMMARY.md`, `PHASE-5.2-LEGACY-REDIRECTS-FINAL.md`

---

## 1. Entorno de trabajo

| Dato | Valor |
|---|---|
| Clon aislado | `C:\Users\monsa\AppData\Local\Temp\claude\a219d8d0f0860508\f2b574c3-5427-444a-bddb-d595a0fc01bf\scratchpad\dynx-site` |
| Repositorio de origen | `dynxlabs/dynxlabs.github.io` |
| Commit base | `1e0190a439149e72585deac536c91dd6cb484400` |
| Rama de trabajo | `seo/i18n-migration-phase-6`, creada sin commit sobre el commit base |
| `main` local y `origin/main` | Siguen en `1e0190a`; 0 commits nuevos |

---

## 2. Diagnóstico inicial

### 2.1 Qué había

| Elemento | Estado encontrado |
|---|---|
| Build | Dos comandos sueltos: `node generate-manifest.js` y `node scripts/build-i18n.js`. El orden importa y no estaba escrito en ningún sitio. |
| `package.json` | Sin script de build. `test` era un marcador que siempre fallaba. Sin versión de Node declarada. |
| Workflows | Uno solo, `build-manifest.yml`: en cada push a `main` que toca artículos regenera y hace commit automático. |
| Validación | Ninguna automatizada. |
| Dependencias | `node-html-parser` y `playwright`, con `package-lock.json` (versión 3). |
| Archivos generados | Se guardan en el repositorio, porque GitHub Pages publica la rama tal cual. |

### 2.2 Qué faltaba o podía pasar inadvertido

1. **El workflow existente no generaba el sitio nuevo.** No ejecutaba `build-i18n.js` y su `git add` no incluía `en/` ni `es/`.
2. **Ese workflow usaba Node 20** (fuera de soporte desde abril de 2026), acciones sin fijar a SHA y sin permisos declarados.
3. **El build no era reproducible entre Windows y Linux** por los finales de línea.
4. **Tres copias de los datos de artículos** (`insights/posts`, `manifest.json`, `insights-data.js`), una de ellas mantenida a mano y desactualizada.
5. **El menú principal ignoraba la ruta.** Se construye con JavaScript y tomaba el idioma de la preferencia guardada en el navegador, no de `/es/` o `/en/`.
6. **Ninguna comprobación** de canonicals, hreflang, JSON-LD, sitemap, enlaces o metadatos antes de publicar.

### 2.3 Dependencias externas y riesgos de ejecutar en GitHub Actions

- CI no necesita secretos, credenciales ni servicios externos. Solo descarga dependencias de npm según el lockfile.
- Playwright solo hace falta para generar imágenes OG de artículos nuevos; CI de validación no descarga navegadores.
- Riesgo principal: que el workflow con permiso de escritura publique contenido defectuoso. Mitigado con una auditoría obligatoria antes del commit.

---

## 3. Arquitectura implementada

```
package.json            scripts: build · build:check · audit:seo · audit:redirects · test
.nvmrc                  Node 22
.gitattributes          LF en salidas generadas; bytes intactos en entregables de la Fase 5.2
.github/
  workflows/
    seo-ci.yml          NUEVO  validación de solo lectura
    build-manifest.yml  MODIFICADO  regeneración en main, con auditoría previa al commit
  seo/
    phase-5.2/                            documento aprobado, slugs.txt y los dos scripts
    PHASE-6-GITHUB-ACTIONS-SEO-FINAL.md   este documento
    PHASES_1_2_APPROVED.md                MOVIDO desde la raíz
scripts/
  i18n-bake.js          NUEVO  horneado de textos compartido por los dos generadores
  build-i18n.js         MODIFICADO
  seo/
    audit.js            orquestador de la auditoría
    check-build.js      build doble, idempotencia y deriva
    lib/site.js         modelo del sitio esperado y utilidades
    lib/report.js       recolector de resultados y salidas (consola, JSON, Markdown)
    checks/             8 módulos de comprobación
generate-manifest.js    MODIFICADO  ahora también genera insights-data.js
assets/js/
  insights-data.js      GENERADO  antes se mantenía a mano
  megamenu.js           MODIFICADO  idioma y enlaces según la ruta
faq.html                MODIFICADO (3 líneas)
sitemap_index.xml       MODIFICADO (1 línea eliminada)
```

Principios:

- **El modelo esperado se deriva de las fuentes**, no del resultado. La lista de páginas sale de `insights/posts/*.json` y de la lista aprobada de 7 páginas principales.
- **Una sola fuente de datos de artículos:** `insights/posts`. El manifest, `insights-data.js`, las páginas, el sitemap y el JSON-LD se generan de ahí.
- **La auditoría es de solo lectura** y no usa red.
- **Lo mismo en local y en CI**: los workflows solo llaman a los scripts de `package.json`.
- **Cuatro niveles**: PASS, FAIL, WARNING y NOT TESTED. Solo FAIL cambia el código de salida. NOT TESTED nunca se cuenta como PASS.

---

## 4. Workflows

### 4.1 `seo-ci.yml` — nuevo, solo lectura

| Aspecto | Valor |
|---|---|
| Eventos | `pull_request` hacia `main`, `push` a `main`, `workflow_dispatch` |
| Permisos | `contents: read` |
| Secretos | Ninguno |
| Concurrencia | Un run por rama o PR; uno nuevo cancela el anterior (seguro: no tiene efectos) |
| Runner | `ubuntu-24.04` |
| Límite de tiempo | 10 minutos por job |

| Job | Qué hace |
|---|---|
| `build` | `npm ci --ignore-scripts` y `npm run build:check`: build dos veces, idempotencia, deriva y archivos inesperados |
| `seo-audit` | Matriz de 4 grupos en paralelo: arquitectura/canonical/hreflang · JSON-LD · sitemap/robots/metadatos · enlaces/recursos/menú/HTML. Sube el informe como artefacto |
| `legacy-redirects` | Consistencia estática con la Fase 5.2, `bash -n` del script Bash y análisis sintáctico del script PowerShell |
| `result` | Estado único: verde solo si los tres anteriores pasan. Pensado para marcarlo como check obligatorio |

### 4.2 `build-manifest.yml` — existente, modificado

Es el único workflow con permiso de escritura. Ya existía y ya hacía commit automático en `main`. No se creó ningún workflow de publicación.

| Cambio | Motivo |
|---|---|
| Ejecuta `npm ci` y `npm run build` | Antes no generaba `/es` ni `/en` |
| `git add` incluye `en`, `es` y `assets/js/insights-data.js` | Antes las páginas nuevas no se habrían confirmado; el archivo de datos ahora es una salida generada |
| Paso de auditoría antes del commit | Nunca confirma una salida que no pase la auditoría |
| `permissions: contents: write` explícito | Antes heredaba los permisos por defecto del repositorio |
| Acciones fijadas a SHA, Node desde `.nvmrc` | Seguridad y coherencia con CI |
| Concurrencia sin cancelación | Evita dos regeneraciones simultáneas |
| Más rutas en el disparador | Locales, páginas fuente y generadores también cambian la salida |

Sigue disparándose solo con push a `main` o a mano. No hace nada hasta que estos cambios se integren.

### 4.3 Versiones

| Componente | Versión | Referencia fijada |
|---|---|---|
| Node.js | 22 (`.nvmrc`) | Verificado en local con v22.19.0 |
| `actions/checkout` | v7.0.1 | `3d3c42e5aac5ba805825da76410c181273ba90b1` |
| `actions/setup-node` | v7.1.0 | `949feb2413d6458794dcd2491c4babbbce0c15c1` |
| `actions/upload-artifact` | v7.0.2 | `cf430e030ddbb5b0abf93d22962f4752f3646cd9` |

### 4.4 Dependencias

No se añadió ninguna. La auditoría usa `node-html-parser`, que ya era dependencia del build, y módulos nativos de Node.

---

## 5. Ejecutar las pruebas en local

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
| `npm run build` | Genera manifest, `insights-data.js`, artículos, sitemap y páginas `/es` `/en` |
| `npm run build:check` | Build dos veces; comprueba idempotencia, deriva y archivos inesperados |
| `npm run audit:seo` | Auditoría completa |
| `npm run audit:redirects` | Solo la consistencia de redirecciones legacy |
| `npm test` | `build:check` y después `audit:seo` |
| `node scripts/seo/audit.js --only=links,html` | Uno o varios grupos |
| `node scripts/seo/audit.js --list` | Lista los grupos |
| `node scripts/seo/audit.js --json=informe.json --md=informe.md` | Guarda el informe |
| `node scripts/seo/check-build.js --allow-drift` | La deriva pasa a WARNING (útil mientras se editan fuentes) |

Códigos de salida: 0 sin FAIL, 1 con algún FAIL, 2 si la auditoría no pudo ejecutarse.

---

## 6. Matriz de validaciones

La matriz completa, con resultado y número de elementos, está en `SEO-FINAL-AUDIT-REPORT.md`, apartado 6. La conciliación por grupo, en su apartado 2.

| Grupo del informe | `--only` | IDs | Total | Qué cubre |
|---|---|---|---|---|
| 0. Build | (`build:check`) | BLD-01 a 04 | 4 | Build correcto, idempotente, sin deriva, sin archivos fuera de las salidas |
| 1. Arquitectura y páginas | `architecture` | ARC-01 a 12 | 12 | Artículos fuente íntegros, 14 páginas, 29+29 artículos, 404, sin archivos ni idiomas inesperados, `lang`, duplicados, coherencia de las fuentes de datos, sin documentación interna en la raíz |
| 2. Canonical | `canonical` | CAN-01 a 07 | 7 | Canonical único, absoluto, propio, sin cruce de idioma, sin legacy, no 404 |
| 3. Hreflang | `canonical` | HRF-01 a 07 | 7 | Hreflang completo, recíproco, x-default, sin códigos erróneos |
| 4. Schema.org / JSON-LD | `jsonld` | LD-01 a 10 | 10 | Parseo, tipos por página, identidades globales, breadcrumbs, FAQ contra texto visible, BlogPosting, author/publisher, ItemList, URLs |
| 5. Sitemap y robots.txt | `sitemap` | SMP-01 a 12, RBT-01 a 02 | 14 | XML bien formado, 72 URLs exactas, sin duplicados ni legacy, hreflang recíproco e igual al del HTML, `sitemap_index.xml`, robots.txt |
| 6. Enlaces internos y recursos | `links` | LNK-01 a 14, MNU-01 a 03 | 17 | Rotos, cruce de idioma, legacy, prefijos duplicados, `.html`, parámetros, 404, forma canónica, selector de idioma, anclas, recursos, huérfanas, listado; menú JavaScript |
| 7. Metadatos y social sharing | `metadata` | MET-01 a 11 | 11 | Title, description, Open Graph, og:locale, og:image real, Twitter Cards, herencia legacy, traducción, duplicados |
| 8. Calidad técnica | `html` | HTM-01 a 11 | 11 | Estructura, h1, alt, noindex, textos horneados, contenido sin JavaScript, URLs absolutas, contenido mixto, ids |
| 9. Redirecciones legacy | `legacy` | LGC-01 a 11, LGC-NT1 a 6 | 17 | Hashes de los entregables, 29 slugs, conjuntos A y B, 4 expresiones, 4 destinos, 7 entradas Bulk, destinos en el sitemap, bucles |
| **Total** | | | **110** | |

---

## 7. Resultados

| Bloque | Total | PASS | FAIL | WARNING | NOT TESTED |
|---|---|---|---|---|---|
| Build y reproducibilidad | 4 | 4 | 0 | 0 | 0 |
| Auditoría SEO | 106 | 99 | 0 | 1 | 6 |
| **Total** | **110** | **103** | **0** | **1** | **6** |

- Build: correcto e idempotente; 301 archivos comparados, 77 generados.
- Sitemap: 72 URLs (36 ES y 36 EN; 7 páginas principales y 29 artículos por idioma), sin las 2 páginas 404, confirmado además por una verificación independiente (10 de 10).
- Menú móvil: 6 de 6 casos correctos con clics reales y navegación comprobada.
- Reproducibilidad: el build desde fuentes con CRLF (clon en Windows) y desde fuentes con LF (copia de simulación) produce los mismos bytes.
- Detección: 49 fallos inyectados, 49 detectados.
- Artículo nuevo: basta añadir su JSON y sus imágenes; la auditoría sigue en 0 FAIL.
- Navegador: menú y selector de idioma correctos en 16 de 16 páginas probadas.
- Workflows: YAML válido, 9 usos de acciones fijados a SHA, sin secretos, sin acciones de despliegue.

**No ejecutado:** los workflows nunca han corrido en GitHub Actions, porque no están confirmados ni subidos.

---

## 8. Errores encontrados y corregidos en la primera revisión

| # | Error | Corrección | Efecto visible |
|---|---|---|---|
| 1 | Navegación y pie de los artículos sin hornear: las páginas en español llevaban esos textos en inglés en el HTML inicial | `generate-manifest.js` los hornea con el módulo compartido `scripts/i18n-bake.js` | Ninguno con JavaScript |
| 2 | El selector de idioma de los artículos no llevaba al artículo equivalente | Enlaces reales ES ↔ EN, como en las páginas principales | El selector ahora navega |
| 3 | El listado de Insights no tenía enlaces estáticos a los artículos | `build-i18n.js` hornea las 29 tarjetas con el mismo marcado que genera el navegador | Ninguno |
| 4 | `og:locale` ausente en 12 páginas principales | El build lo añade si falta | Ninguno |
| 5 | Twitter Cards ausentes en el listado de Insights | El build las añade si faltan | Ninguno |
| 6 | `faq.html` enlazaba dos favicons que no existen | Se igualó a las demás páginas (3 líneas) | Ninguno |
| 7 | Build no reproducible entre Windows y Linux | Los generadores escriben siempre LF; `.gitattributes` | Ninguno |
| 8 | La lista `ItemList` del JSON-LD no incorporaba artículos nuevos | El build la sincroniza sin cambiar el orden actual | Ninguno |
| 9 | El workflow existente no generaba ni confirmaba `/es` y `/en` | Apartado 4.2 | Ninguno hasta integrar |

---

## 9. Ajustes de la segunda revisión

### 9.1 Tarjetas de Insights

- **Fuente de verdad:** `insights/posts/*.json`, la misma de la que ya salían la página, las imágenes, el sitemap y el JSON-LD de cada artículo.
- **Cambio:** `assets/js/insights-data.js` deja de mantenerse a mano y lo genera `generate-manifest.js`. No se redactó ningún texto.
- **Resultado:** las 20 tarjetas con diferencias muestran ahora el título y el resumen de su artículo, en ambos idiomas. El detalle por artículo está en el informe de auditoría, apartado 8.
- **Control:** ARC-11 pasa de advertencia a error; una edición manual del archivo también dispara la deriva del build (BLD-03).
- La redacción anterior se conserva en `evidence/insights-data.before.js`.

### 9.2 Selector de idioma móvil y menú principal

La causa era más amplia que el selector. El menú (`assets/js/megamenu.js`) tomaba el idioma de la preferencia guardada en el navegador. En una página `/es/` con preferencia en inglés:

- las etiquetas del menú salían en inglés;
- todos sus enlaces apuntaban a las rutas antiguas (`/products`, `/#ai-agents`), fuera de `/es/`;
- el menú móvil marcaba "English" como activo y pulsarlo no hacía nada.

Corrección, solo en `megamenu.js` (38 líneas añadidas, 7 cambiadas, sin tocar CSS ni HTML):

- En rutas `/es/` y `/en/` el idioma lo decide la ruta, igual que en `i18n.js`.
- Los enlaces del menú se localizan con la misma regla que usa el build; los de artículos llevan su barra final.
- Los botones de idioma del menú móvil navegan a la página equivalente reutilizando el enlace del selector de cabecera, así que ambos coinciden siempre.
- En las páginas legacy el comportamiento no cambia.

Control: tres comprobaciones nuevas (MNU-01 a 03) ejecutan la función del menú y la comparan con la del build y con las páginas generadas. Efecto visible: en `/es/` el menú aparece siempre en español y navega dentro de `/es/`.

### 9.3 Documentación interna

`PHASES_1_2_APPROVED.md` se movió a `.github/seo/` sin modificar su contenido (mismo SHA256). No tenía referencias en código, workflows ni páginas. GitHub Pages no publica `.github/` (comprobado en producción: los archivos de esa carpeta responden 404). ARC-12 falla si reaparece documentación interna en la raíz.

### 9.4 `sitemap_index.xml`

Se conserva, corregido. No se eliminó porque tiene una dependencia real:

- El `robots.txt` que hoy está publicado en producción declara `Sitemap: https://dynxlabs.com/sitemap_index.xml`, y ese archivo responde 200. Los buscadores conocen esa URL.
- No es posible comprobar desde aquí si además está registrado en Search Console o Bing.
- Dentro del repositorio no lo referencia nada: ni páginas, ni scripts, ni workflows. El `robots.txt` nuevo apunta a `sitemap.xml`.

Eliminarlo haría que una URL de sitemap conocida empezara a responder 404 al publicar. Mantenerlo no cuesta nada, pero contenía una fecha `<lastmod>` escrita a mano (22/10/2026) que habría indicado a los buscadores que el sitemap no cambió con la migración. Se eliminó esa línea. El archivo queda como índice válido de un único sitemap. SMP-11 y SMP-12 lo vigilan.

Recomendación: retirarlo en la etapa posterior a la publicación, cuando se revise Search Console.

### 9.5 Verificaciones de la revisión 3 (sin cambios de código)

- **Conciliación de recuentos.** Las 110 comprobaciones ejecutadas tienen identificadores únicos, sin duplicados ni exclusiones. Todas las tablas de la revisión 2 ya sumaban 110, pero la tabla por grupos no tenía columna de total ni fila de totales, lo que permitía leer 92 (la suma de la columna PASS de las nueve primeras filas). El informe tiene ahora una tabla de conciliación con identificadores, total por grupo y fila de totales, y su generador se niega a escribirlo si algún recuento no cuadra.
- **Sitemap.** 72 URLs, ninguna página 404, todas canónicas, indexables y sin redirección según las reglas de GitHub Pages, emparejadas ES/EN, sin duplicados ni URLs antiguas, con hreflang idéntico al de cada página. Lo confirma también una segunda implementación independiente. La cifra de 74 URLs que aparece en el informe pertenece a la simulación con un artículo número 30, no al sitio actual; el informe lo indica ahora expresamente.
- **`sitemap_index.xml`.** No se modificó de nuevo. Análisis completo en el informe, apartado 5.2.
- **Menú móvil.** 6 casos con clics reales (ES ↔ EN en inicio, productos y un artículo), con la preferencia guardada en el idioma contrario: 6 correctos, navegación real a la página equivalente, sin enlaces antiguos ni errores de JavaScript.
- **Páginas legacy.** Comportamiento idéntico al original, comprobado con una copia A/B que usa el `megamenu.js` del commit base. Se documenta un defecto que ya existía y que no se corrige por instrucción: en esas páginas el botón de idioma del menú móvil solo traduce el menú.

---

## 10. Limitaciones

1. **Ejecución real en GitHub Actions sin probar.**
2. **Redirecciones legacy:** solo consistencia estática.
3. **Dependencia del año.** El pie de página hornea el año actual. En enero la comprobación de deriva fallará hasta regenerar el sitio; el mensaje de error lo indica.
4. **Formato de fechas.** Depende del motor de internacionalización de Node. Mitigado fijando Node 22.
5. **El menú principal sigue construyéndose con JavaScript.** Sus enlaces no están en el HTML inicial; los enlaces estáticos del pie cubren las páginas principales. La auditoría verifica la lógica del menú, no su renderizado en un navegador.
6. **Pruebas de navegador fuera de CI.** La comprobación del menú en navegador fue manual, con clics reales, y sin capturas: el panel del navegador estaba oculto.
7. **Defecto preexistente en páginas legacy.** El botón de idioma del menú móvil solo traduce el menú, no la página. No se corrigió para no alterar las páginas legacy, que dejarán de recibir tráfico con las redirecciones de la Fase 5.
8. **Validación HTML parcial**: estructura relevante para SEO, no conformidad completa.
9. **Enlaces externos sin comprobar** (650).
10. **Archivos de desarrollo publicados.** GitHub Pages servirá `package.json`, `scripts/` y `generate-manifest.js`, como ya sirve hoy `README.md`. No contienen información sensible.

---

## 11. Elementos que requieren staging

| ID | Qué falta comprobar |
|---|---|
| LGC-NT1 | Que las 4 expresiones y la regla Bulk se guarden sin error en el editor |
| LGC-NT2 | Código 301 y encabezado `Location` reales |
| LGC-NT3 | Destino final 200, un solo salto, sin bucles |
| LGC-NT4 | `lang` ausente, `lang=ES`, `Lang=es`, `lang=%65s` y parámetros repetidos |
| LGC-NT5 | Coincidencia de las entradas Bulk con query string |
| LGC-NT6 | Respuesta del origen para `/products/` y rutas inexistentes |

---

## 12. Elementos que requieren intervención manual

| Elemento | Quién | Cuándo |
|---|---|---|
| Autorizar commit, push y pull request | Arois | Siguiente paso |
| Marcar `SEO CI result` como check obligatorio de `main` | Arois, en GitHub | Tras la integración; opcional |
| Retirar `sitemap_index.xml` tras revisar Search Console | Arois | Etapa posterior a la publicación |
| Dominio de staging y acciones en registrador, DNS y Cloudflare | Arois | Fase de redirecciones |

---

## 13. Riesgos residuales

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Un workflow falla en GitHub por algo no reproducible en local | CI en rojo en el primer run | Primer run en un PR, sin efecto en producción |
| `build-manifest.yml` confirma en `main` contenido defectuoso | Publicación de errores | Auditoría obligatoria antes del commit |
| Deriva por cambio de año o de versión de Node | CI en rojo sin cambios de contenido | Mensaje de error explícito; Node fijado |
| El menú se comporta distinto en un navegador real que en la prueba local | Navegación incorrecta | Probado en 16 páginas; repetir la prueba en el PR antes de fusionar |
| Las tarjetas del listado cambian de texto respecto a producción | Cambio editorial visible en 20 tarjetas | Es el texto de cada artículo; el anterior está guardado |
| Redirecciones legacy sin validar con tráfico real | Algún caso podría no redirigir como se diseñó | Staging antes de producción |
| Carpeta local original desactualizada | Está en un commit anterior a `origin/main` y tiene cambios propios sin confirmar | No se tocó. La integración debe partir del clon o de `origin/main` |
| El clon está en una carpeta temporal | Pérdida del trabajo si se borra | Confirmar los cambios en la rama en cuanto se autorice |

---

## 14. Procedimiento de activación futura

Ninguno de estos pasos se ha ejecutado.

**Acciones técnicas de Claude (cada una con autorización previa)**

1. Preparación de cambios: separar los cambios en commits por fase y confirmar en la rama `seo/i18n-migration-phase-6`.
2. Integración autorizada: subir la rama y abrir un pull request hacia `main`. `seo-ci.yml` se ejecutará por primera vez en ese PR.
3. Revisar el resultado real de CI y corregir lo que solo aparezca en GitHub.
4. Build de producción: `npm ci` y `npm test` sobre la rama actualizada con `main`.
5. Despliegue: fusionar el PR. GitHub Pages publica `main` como hasta ahora; no hay workflow de despliegue nuevo.
6. Verificaciones posteriores: 72 URLs canónicas con 200, `sitemap.xml`, `sitemap_index.xml` y `robots.txt` publicados, una ruta inexistente con 404, páginas legacy operativas, menú y selector de idioma en móvil.
7. Fase de redirecciones: procedimiento de staging de la Fase 5.2 y, después, réplica en producción.

**Acciones manuales de Arois**

1. Autorizar el commit, el push y el pull request.
2. Aprobar y fusionar el pull request, o autorizarlo.
3. Opcional en GitHub: marcar `SEO CI result` como check obligatorio de `main`. No hace falta ningún secreto ni cambio de permisos.
4. Para las redirecciones: dominio de staging, acceso al registrador y acciones en Cloudflare.
5. Autorización final de publicación.

---

## 15. Checklist de publicación

- [x] Fase 6 revisada; cuatro ajustes aplicados
- [ ] Autorización de commit, push y pull request
- [ ] Cambios confirmados en la rama de trabajo
- [ ] Rama subida y pull request abierto
- [ ] `SEO CI` en verde en GitHub (primera ejecución real)
- [ ] `npm test` en verde sobre la rama actualizada con `main`
- [ ] Menú y selector de idioma comprobados en el PR, en móvil y escritorio
- [ ] Pull request aprobado y fusionado
- [ ] 72 URLs canónicas con 200 en producción
- [ ] `sitemap.xml`, `sitemap_index.xml` y `robots.txt` correctos en producción
- [ ] Páginas legacy siguen operativas
- [ ] Staging de redirecciones validado (29/0 y 116/0)
- [ ] Redirecciones activadas en producción con autorización
- [ ] Analítica y Search Console: etapa posterior, no iniciada

---

## 16. Mantenimiento

- **Artículo nuevo:** añadir su JSON en `insights/posts`. El build genera el resto, incluido `insights-data.js`. No requiere tocar `slugs.txt` ni las reglas legacy.
- **No editar a mano** `assets/js/insights-data.js`, `insights/manifest.json`, `sitemap.xml`, `en/` ni `es/`: son salidas del build.
- **Enlace nuevo en el menú:** añadirlo en `assets/js/megamenu.js` con la ruta sin prefijo de idioma (`/pagina`); el menú la localiza.
- **Página principal nueva:** añadirla en `PAGES` de `scripts/build-i18n.js`, en `MAIN_SLUGS` de `generate-manifest.js` y en `MAIN_PAGES` de `scripts/seo/lib/site.js`, y declarar sus tipos de JSON-LD en `scripts/seo/checks/jsonld.js`.
- **Actualizar una acción:** cambiar el SHA y el comentario de versión en los dos workflows.
- **Cambiar los entregables de la Fase 5.2:** exige actualizar los hashes fijados en `scripts/seo/checks/legacy-redirects.js`.
- **Comprobación nueva:** añadir un módulo en `scripts/seo/checks/` y registrarlo en `GROUPS` de `scripts/seo/audit.js`.
