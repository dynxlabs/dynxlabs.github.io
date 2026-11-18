# Fase 5.2 — Migración de URLs legacy: diseño final de redirecciones 301

- **Proyecto:** sitio web de **[DYNX Labs](https://dynxlabs.com)** (migración i18n de `?lang=es` a `/es/` y `/en/`)
- **Fecha del documento:** 13 de noviembre de 2026
- **Estado:** diseño final y validación simulada completos. **Nada implementado.** Pendiente de aprobación.
- **Marcador:** `staging.tudominio` es un marcador provisional. Debe sustituirse por el hostname real de staging en el momento de implementar. No es `dynxlabs.com`.

---

## 1. Arquitectura final

| Capa | Mecanismo | Cantidad | Función |
|---|---|---|---|
| 1 | Cloudflare Single Redirects (dinámicas) | 4 reglas | Redirigen las URLs legacy sin extensión (raíz, 6 páginas principales, 29 artículos con y sin barra final) a `/es/…` o `/en/…` según el parámetro `lang` |
| 2 | Cloudflare Bulk Redirects | 1 lista de 7 entradas + 1 regla | Redirigen las 7 URLs legacy `.html` a su canónica en inglés |
| 3 | Origen (build estático) | 72 URLs canónicas | Sirve los destinos con 200 y las rutas inexistentes con 404 (`404.html`) |

Principios del diseño:

1. **Un solo salto.** Toda URL legacy cubierta llega a su canónica con un único 301. Los artículos sin barra final reciben la barra en el propio destino de la regla.
2. **Primera coincidencia termina.** La acción Redirect es terminal: la primera regla que coincide detiene la evaluación. Por eso las reglas de español van primero (prioridades 1 y 2) y las de inglés (3 y 4) no necesitan negar la condición de idioma.
3. **Las Single Redirects se evalúan antes que las Bulk Redirects.** Las rutas `.html` no pertenecen a los conjuntos A ni B, así que solo la capa Bulk las captura.
4. **Sin bucles.** Ningún destino (`/en/…`, `/es/…`) pertenece a los conjuntos A o B ni a la lista Bulk.
5. **Aislamiento por hostname.** Todas las reglas exigen `http.host eq "staging.tudominio"`. No pueden afectar a ningún otro hostname.

Esquema de URLs canónicas (72 = 7 principales × 2 idiomas + 29 artículos × 2 idiomas):

- Inicio: `/en/` y `/es/` (con barra final).
- Páginas principales: `/en/products`, `/es/products`, etc. (sin barra final).
- Artículos: `/en/insights/<slug>/` y `/es/insights/<slug>/` (con barra final).

---

## 2. Conjuntos de rutas

### 2.1 Conjunto A — 36 rutas (raíz, páginas principales y artículos con barra final)

```
/
/products
/research
/faq
/contact
/leadership
/insights
/insights/5-tareas-repetitivas-que-tu-equipo-no-deberia-hacer/
/insights/agentic-ai-de-asistentes-a-ejecutores/
/insights/ai-agents-reemplazando-tareas-administrativas/
/insights/ai-agents-y-apis-capa-de-ejecucion/
/insights/ai-governance-reglas-antes-de-escalar/
/insights/ciberseguridad-e-ia-amenazas-defensas/
/insights/como-escribir-un-buen-prompt/
/insights/como-medir-roi-automatizacion/
/insights/como-reducir-tiempo-respuesta-cliente-con-ia/
/insights/data-quality-base-de-toda-ia/
/insights/de-excel-a-dashboard-en-tiempo-real/
/insights/de-silos-a-flujo-unico-integracion-datos/
/insights/diferencia-automatizacion-inteligencia-artificial/
/insights/human-in-the-loop-autonomia-ia/
/insights/ia-en-ventas-b2b-lead-scoring-cierre/
/insights/ia-para-rrhh-screening-onboarding/
/insights/knowledge-management-con-ia/
/insights/low-code-no-code-automatizacion-sin-it/
/insights/multimodal-ai-texto-imagen-voz/
/insights/por-que-proyectos-ia-no-pasan-del-piloto/
/insights/procesamiento-inteligente-documentos/
/insights/que-es-un-llm-y-como-puede-trabajar-en-tu-operacion/
/insights/que-es-un-pipeline-de-datos/
/insights/que-es-un-trigger-y-por-que-importa/
/insights/que-es-un-workflow-y-por-que-importa/
/insights/quick-wins-por-donde-empezar-a-automatizar/
/insights/rag-empresarial-conecta-ia-a-tu-informacion/
/insights/sistemas-multi-agente-orquestacion/
/insights/slms-vs-llms-modelo-pequeno-mejor/
```

### 2.2 Conjunto B — 29 rutas (artículos sin barra final)

```
/insights/5-tareas-repetitivas-que-tu-equipo-no-deberia-hacer
/insights/agentic-ai-de-asistentes-a-ejecutores
/insights/ai-agents-reemplazando-tareas-administrativas
/insights/ai-agents-y-apis-capa-de-ejecucion
/insights/ai-governance-reglas-antes-de-escalar
/insights/ciberseguridad-e-ia-amenazas-defensas
/insights/como-escribir-un-buen-prompt
/insights/como-medir-roi-automatizacion
/insights/como-reducir-tiempo-respuesta-cliente-con-ia
/insights/data-quality-base-de-toda-ia
/insights/de-excel-a-dashboard-en-tiempo-real
/insights/de-silos-a-flujo-unico-integracion-datos
/insights/diferencia-automatizacion-inteligencia-artificial
/insights/human-in-the-loop-autonomia-ia
/insights/ia-en-ventas-b2b-lead-scoring-cierre
/insights/ia-para-rrhh-screening-onboarding
/insights/knowledge-management-con-ia
/insights/low-code-no-code-automatizacion-sin-it
/insights/multimodal-ai-texto-imagen-voz
/insights/por-que-proyectos-ia-no-pasan-del-piloto
/insights/procesamiento-inteligente-documentos
/insights/que-es-un-llm-y-como-puede-trabajar-en-tu-operacion
/insights/que-es-un-pipeline-de-datos
/insights/que-es-un-trigger-y-por-que-importa
/insights/que-es-un-workflow-y-por-que-importa
/insights/quick-wins-por-donde-empezar-a-automatizar
/insights/rag-empresarial-conecta-ia-a-tu-informacion
/insights/sistemas-multi-agente-orquestacion
/insights/slms-vs-llms-modelo-pequeno-mejor
```

Origen de los datos: los 29 slugs se leyeron de `insights/posts/*.json` del build de trabajo (nombre de archivo y campo `slug` coinciden en los 29) y los 29 figuran en `sitemap.xml` en ambos idiomas.

---

## 3. Configuración completa de las Single Redirects

Parámetros comunes a las cuatro reglas:

| Parámetro | Valor |
|---|---|
| Tipo | Dynamic |
| Código de estado | 301 |
| Preserve query string | ON |
| Estado al implementar | Activa solo en la zona de staging |

Condición de idioma español (literal):

```
any(http.request.uri.args["lang"][*] == "es")
```

### Prioridad 1 — Español, artículos sin barra final (conjunto B)

Expresión (1559 caracteres):

```
(http.host eq "staging.tudominio") and any(http.request.uri.args["lang"][*] == "es") and (http.request.uri.path in {"/insights/5-tareas-repetitivas-que-tu-equipo-no-deberia-hacer" "/insights/agentic-ai-de-asistentes-a-ejecutores" "/insights/ai-agents-reemplazando-tareas-administrativas" "/insights/ai-agents-y-apis-capa-de-ejecucion" "/insights/ai-governance-reglas-antes-de-escalar" "/insights/ciberseguridad-e-ia-amenazas-defensas" "/insights/como-escribir-un-buen-prompt" "/insights/como-medir-roi-automatizacion" "/insights/como-reducir-tiempo-respuesta-cliente-con-ia" "/insights/data-quality-base-de-toda-ia" "/insights/de-excel-a-dashboard-en-tiempo-real" "/insights/de-silos-a-flujo-unico-integracion-datos" "/insights/diferencia-automatizacion-inteligencia-artificial" "/insights/human-in-the-loop-autonomia-ia" "/insights/ia-en-ventas-b2b-lead-scoring-cierre" "/insights/ia-para-rrhh-screening-onboarding" "/insights/knowledge-management-con-ia" "/insights/low-code-no-code-automatizacion-sin-it" "/insights/multimodal-ai-texto-imagen-voz" "/insights/por-que-proyectos-ia-no-pasan-del-piloto" "/insights/procesamiento-inteligente-documentos" "/insights/que-es-un-llm-y-como-puede-trabajar-en-tu-operacion" "/insights/que-es-un-pipeline-de-datos" "/insights/que-es-un-trigger-y-por-que-importa" "/insights/que-es-un-workflow-y-por-que-importa" "/insights/quick-wins-por-donde-empezar-a-automatizar" "/insights/rag-empresarial-conecta-ia-a-tu-informacion" "/insights/sistemas-multi-agente-orquestacion" "/insights/slms-vs-llms-modelo-pequeno-mejor"})
```

Destino:

```
concat("https://staging.tudominio/es", http.request.uri.path, "/")
```

### Prioridad 2 — Español, raíz, páginas principales y artículos con barra final (conjunto A)

Expresión (1660 caracteres):

```
(http.host eq "staging.tudominio") and any(http.request.uri.args["lang"][*] == "es") and (http.request.uri.path in {"/" "/products" "/research" "/faq" "/contact" "/leadership" "/insights" "/insights/5-tareas-repetitivas-que-tu-equipo-no-deberia-hacer/" "/insights/agentic-ai-de-asistentes-a-ejecutores/" "/insights/ai-agents-reemplazando-tareas-administrativas/" "/insights/ai-agents-y-apis-capa-de-ejecucion/" "/insights/ai-governance-reglas-antes-de-escalar/" "/insights/ciberseguridad-e-ia-amenazas-defensas/" "/insights/como-escribir-un-buen-prompt/" "/insights/como-medir-roi-automatizacion/" "/insights/como-reducir-tiempo-respuesta-cliente-con-ia/" "/insights/data-quality-base-de-toda-ia/" "/insights/de-excel-a-dashboard-en-tiempo-real/" "/insights/de-silos-a-flujo-unico-integracion-datos/" "/insights/diferencia-automatizacion-inteligencia-artificial/" "/insights/human-in-the-loop-autonomia-ia/" "/insights/ia-en-ventas-b2b-lead-scoring-cierre/" "/insights/ia-para-rrhh-screening-onboarding/" "/insights/knowledge-management-con-ia/" "/insights/low-code-no-code-automatizacion-sin-it/" "/insights/multimodal-ai-texto-imagen-voz/" "/insights/por-que-proyectos-ia-no-pasan-del-piloto/" "/insights/procesamiento-inteligente-documentos/" "/insights/que-es-un-llm-y-como-puede-trabajar-en-tu-operacion/" "/insights/que-es-un-pipeline-de-datos/" "/insights/que-es-un-trigger-y-por-que-importa/" "/insights/que-es-un-workflow-y-por-que-importa/" "/insights/quick-wins-por-donde-empezar-a-automatizar/" "/insights/rag-empresarial-conecta-ia-a-tu-informacion/" "/insights/sistemas-multi-agente-orquestacion/" "/insights/slms-vs-llms-modelo-pequeno-mejor/"})
```

Destino:

```
concat("https://staging.tudominio/es", http.request.uri.path)
```

### Prioridad 3 — Inglés, artículos sin barra final (conjunto B)

Expresión (1509 caracteres):

```
(http.host eq "staging.tudominio") and (http.request.uri.path in {"/insights/5-tareas-repetitivas-que-tu-equipo-no-deberia-hacer" "/insights/agentic-ai-de-asistentes-a-ejecutores" "/insights/ai-agents-reemplazando-tareas-administrativas" "/insights/ai-agents-y-apis-capa-de-ejecucion" "/insights/ai-governance-reglas-antes-de-escalar" "/insights/ciberseguridad-e-ia-amenazas-defensas" "/insights/como-escribir-un-buen-prompt" "/insights/como-medir-roi-automatizacion" "/insights/como-reducir-tiempo-respuesta-cliente-con-ia" "/insights/data-quality-base-de-toda-ia" "/insights/de-excel-a-dashboard-en-tiempo-real" "/insights/de-silos-a-flujo-unico-integracion-datos" "/insights/diferencia-automatizacion-inteligencia-artificial" "/insights/human-in-the-loop-autonomia-ia" "/insights/ia-en-ventas-b2b-lead-scoring-cierre" "/insights/ia-para-rrhh-screening-onboarding" "/insights/knowledge-management-con-ia" "/insights/low-code-no-code-automatizacion-sin-it" "/insights/multimodal-ai-texto-imagen-voz" "/insights/por-que-proyectos-ia-no-pasan-del-piloto" "/insights/procesamiento-inteligente-documentos" "/insights/que-es-un-llm-y-como-puede-trabajar-en-tu-operacion" "/insights/que-es-un-pipeline-de-datos" "/insights/que-es-un-trigger-y-por-que-importa" "/insights/que-es-un-workflow-y-por-que-importa" "/insights/quick-wins-por-donde-empezar-a-automatizar" "/insights/rag-empresarial-conecta-ia-a-tu-informacion" "/insights/sistemas-multi-agente-orquestacion" "/insights/slms-vs-llms-modelo-pequeno-mejor"})
```

Destino:

```
concat("https://staging.tudominio/en", http.request.uri.path, "/")
```

### Prioridad 4 — Inglés, raíz, páginas principales y artículos con barra final (conjunto A)

Expresión (1610 caracteres):

```
(http.host eq "staging.tudominio") and (http.request.uri.path in {"/" "/products" "/research" "/faq" "/contact" "/leadership" "/insights" "/insights/5-tareas-repetitivas-que-tu-equipo-no-deberia-hacer/" "/insights/agentic-ai-de-asistentes-a-ejecutores/" "/insights/ai-agents-reemplazando-tareas-administrativas/" "/insights/ai-agents-y-apis-capa-de-ejecucion/" "/insights/ai-governance-reglas-antes-de-escalar/" "/insights/ciberseguridad-e-ia-amenazas-defensas/" "/insights/como-escribir-un-buen-prompt/" "/insights/como-medir-roi-automatizacion/" "/insights/como-reducir-tiempo-respuesta-cliente-con-ia/" "/insights/data-quality-base-de-toda-ia/" "/insights/de-excel-a-dashboard-en-tiempo-real/" "/insights/de-silos-a-flujo-unico-integracion-datos/" "/insights/diferencia-automatizacion-inteligencia-artificial/" "/insights/human-in-the-loop-autonomia-ia/" "/insights/ia-en-ventas-b2b-lead-scoring-cierre/" "/insights/ia-para-rrhh-screening-onboarding/" "/insights/knowledge-management-con-ia/" "/insights/low-code-no-code-automatizacion-sin-it/" "/insights/multimodal-ai-texto-imagen-voz/" "/insights/por-que-proyectos-ia-no-pasan-del-piloto/" "/insights/procesamiento-inteligente-documentos/" "/insights/que-es-un-llm-y-como-puede-trabajar-en-tu-operacion/" "/insights/que-es-un-pipeline-de-datos/" "/insights/que-es-un-trigger-y-por-que-importa/" "/insights/que-es-un-workflow-y-por-que-importa/" "/insights/quick-wins-por-donde-empezar-a-automatizar/" "/insights/rag-empresarial-conecta-ia-a-tu-informacion/" "/insights/sistemas-multi-agente-orquestacion/" "/insights/slms-vs-llms-modelo-pequeno-mejor/"})
```

Destino:

```
concat("https://staging.tudominio/en", http.request.uri.path)
```

---

## 4. Bulk Redirects

### 4.1 Lista `dynx_html_staging` (7 entradas)

| # | URL de origen | URL de destino | Estado | Preserve query string | Subpath matching |
|---|---|---|---|---|---|
| 1 | `staging.tudominio/index.html` | `https://staging.tudominio/en/` | 301 | ON | OFF |
| 2 | `staging.tudominio/products.html` | `https://staging.tudominio/en/products` | 301 | ON | OFF |
| 3 | `staging.tudominio/research.html` | `https://staging.tudominio/en/research` | 301 | ON | OFF |
| 4 | `staging.tudominio/faq.html` | `https://staging.tudominio/en/faq` | 301 | ON | OFF |
| 5 | `staging.tudominio/contact.html` | `https://staging.tudominio/en/contact` | 301 | ON | OFF |
| 6 | `staging.tudominio/leadership.html` | `https://staging.tudominio/en/leadership` | 301 | ON | OFF |
| 7 | `staging.tudominio/insights.html` | `https://staging.tudominio/en/insights` | 301 | ON | OFF |

Los demás parámetros de cada entrada quedan en OFF (Include subdomains, Preserve path suffix).

Formato CSV para importar la lista (columnas: origen, destino, estado, preserve query string, include subdomains, subpath matching, preserve path suffix):

```
staging.tudominio/index.html,https://staging.tudominio/en/,301,TRUE,FALSE,FALSE,FALSE
staging.tudominio/products.html,https://staging.tudominio/en/products,301,TRUE,FALSE,FALSE,FALSE
staging.tudominio/research.html,https://staging.tudominio/en/research,301,TRUE,FALSE,FALSE,FALSE
staging.tudominio/faq.html,https://staging.tudominio/en/faq,301,TRUE,FALSE,FALSE,FALSE
staging.tudominio/contact.html,https://staging.tudominio/en/contact,301,TRUE,FALSE,FALSE,FALSE
staging.tudominio/leadership.html,https://staging.tudominio/en/leadership,301,TRUE,FALSE,FALSE,FALSE
staging.tudominio/insights.html,https://staging.tudominio/en/insights,301,TRUE,FALSE,FALSE,FALSE
```

### 4.2 Regla Bulk Redirect (obligatoria)

**Crear la lista no basta.** Una lista Bulk Redirect no hace nada hasta que una regla Bulk Redirect activa la referencia. Configuración de la regla:

| Parámetro | Valor |
|---|---|
| Nombre | `dynx-html-staging` |
| Lista asociada | `dynx_html_staging` |
| Key | `http.request.full_uri` |
| Estado al implementar | Enabled |

Expresión:

```
(http.host eq "staging.tudominio") and (http.request.full_uri in $dynx_html_staging)
```

Las listas y reglas Bulk Redirect son de nivel de cuenta, no de zona. La condición de hostname en la expresión y el hostname en cada URL de origen garantizan, por dos vías, que solo aplican a staging.

Decisión documentada: las 7 URLs `.html` van siempre a la canónica en inglés, también cuando llegan con `?lang=es` (el parámetro se conserva en el destino pero no cambia el idioma). Es la decisión aprobada en la auditoría de `.html`.

---

## 5. Matriz de comportamiento

### 5.1 Parámetro `lang`

| Entrada | Regla que coincide | Destino | Fundamento |
|---|---|---|---|
| `/products?lang=es` | 2 | `/es/products?lang=es` | `any()` verdadero |
| `/products?lang=en` | 4 | `/en/products?lang=en` | ningún valor es `es`; cae en la regla de inglés |
| `/products` (parámetro ausente) | 4 | `/en/products` | sin clave `lang`, `any()` es falso |
| `/products?lang=ES` | 4 | `/en/products?lang=ES` | la comparación de valores distingue mayúsculas |
| `/products?Lang=es` | 4 | `/en/products?Lang=es` | la clave del mapa distingue mayúsculas |
| `/products?lang=en&lang=es` (repetido) | 2 | `/es/products?lang=en&lang=es` | `any()` recorre todos los valores de la clave |
| `/products?lang=%65s` | 4 | `/en/products?lang=%65s` | `http.request.uri.args` no decodifica; `%65s` no es igual a `es` |
| `/products?xlang=es` | 4 | `/en/products?xlang=es` | la clave es otra |
| `/products?utm_campaign=lang=es` | 4 | `/en/products?utm_campaign=lang=es` | no existe la clave `lang` |

### 5.2 Rutas

| Entrada | Regla | Destino | Saltos |
|---|---|---|---|
| `/` | 4 | `/en/` | 1 |
| `/?lang=es` | 2 | `/es/?lang=es` | 1 |
| `/insights` | 4 | `/en/insights` | 1 |
| `/insights/<slug>/` | 4 | `/en/insights/<slug>/` | 1 |
| `/insights/<slug>` | 3 | `/en/insights/<slug>/` | 1 |
| `/insights/<slug>/?lang=es` | 2 | `/es/insights/<slug>/?lang=es` | 1 |
| `/insights/<slug>?lang=es` | 1 | `/es/insights/<slug>/?lang=es` | 1 |
| `/products.html` (y las otras 6 `.html`) | Bulk | `/en/products` (canónica en inglés) | 1 |
| `/en/products`, `/es/insights/<slug>/` (ya migradas) | ninguna | se sirve con 200 | 0 |
| `/insights/no-existe`, `/ruta-inexistente` | ninguna | 404 del origen | 0 |
| `/products/` (página principal con barra final) | ninguna | lo decide el origen | no garantizado |

### 5.3 Parámetros UTM

Con Preserve query string en ON se conserva la query completa, incluido `lang`:

- `/products?lang=es&utm_source=li` → `/es/products?lang=es&utm_source=li`
- `/products?utm_source=li` → `/en/products?utm_source=li`

No existe en el plan Free una opción que elimine solo `lang` y conserve los UTM (eso exige `regex_replace`, disponible desde el plan Business). La alternativa OFF descarta todos los parámetros, UTM incluidos. Decisión aprobada: ON. Consecuencia: el destino lleva un `?lang=es` residual; las páginas canónicas declaran `rel="canonical"` sin parámetros, que es la señal que consolida la URL para los buscadores.

### 5.4 Cadenas y bucles

- **Cadenas:** ninguna esperada para las 72 entradas legacy cubiertas más las 7 `.html`. Cada una resuelve en 1 salto a un destino que el origen sirve con 200.
- **Bucles:** ninguno esperado. Los destinos empiezan por `/en/` o `/es/` y ninguna ruta de los conjuntos A, B ni de la lista Bulk empieza así.
- **Rutas inexistentes:** no coinciden con ninguna regla (los conjuntos son listas cerradas, no prefijos). El origen responde 404.

---

## 6. Límites del plan Cloudflare Free aplicables

| Límite | Valor | Uso de este diseño | Estado |
|---|---|---|---|
| Single Redirects por zona | 10 | 4 | Dentro del límite |
| Longitud de expresión | 4.096 caracteres | máximo 1660 | Dentro del límite |
| Funciones `regex_replace` y operador `matches` | No disponibles (Business o superior) | No se usan | Compatible |
| Bulk Redirects | Cuota separada de las Single Redirects | 1 lista, 1 regla, 7 entradas | Dentro del límite |

Nota sobre la cuota Bulk: la documentación ha publicado cifras distintas para el plan Free a lo largo del tiempo (20 redirecciones por cuenta en cuentas antiguas; miles en la actual). Con 7 entradas el diseño cabe en cualquiera de las dos. La cifra vigente para la cuenta se confirma en el panel al crear la lista.

Las longitudes de expresión de este documento se calcularon con el marcador `staging.tudominio` (17 caracteres). Un hostname real más largo suma esa diferencia una vez por regla; el margen es de más de 2.400 caracteres.

---

## 7. Resultados y alcance de las pruebas

### 7.1 Lo que se ejecutó realmente

| Prueba | Herramienta | Resultado |
|---|---|---|
| Sintaxis PowerShell | Parser AST (`System.Management.Automation.Language.Parser`) | 0 errores |
| Sintaxis Bash | `bash -n` | 0 errores |
| Ejecución completa de `validate_redirects.ps1` con `curl.exe` simulado | Arnés local | 29 PASS / 0 FAIL |
| Ejecución completa de `validate_redirects.sh` con `curl` simulado | Arnés local | 29 PASS / 0 FAIL |
| Conteo y consistencia de slugs | Lectura de `insights/posts/*.json` y `sitemap.xml` | 29 slugs, 29 en el sitemap en ambos idiomas |
| Longitud de las 4 expresiones | Cálculo sobre el texto final | 1559, 1660, 1509, 1610 caracteres |
| Comportamiento actual de producción (solo lectura) | `curl` contra el sitio en GitHub Pages | `/insights/<slug>` sin barra responde 301 a la versión con barra; las 7 `.html` responden 200 |

La simulación sustituye `curl` por respuestas que codifican el comportamiento **diseñado** de las reglas. Demuestra que los scripts extraen, comparan y dictaminan bien. **No demuestra que Cloudflare se comporte así.**

### 7.2 Confirmado solo por documentación de Cloudflare

- `http.request.uri.args` no decodifica valores y conserva el orden y las repeticiones.
- La acción Redirect es terminal.
- Las Single Redirects se evalúan antes que las Bulk Redirects.
- Las reglas inactivas no se evalúan (tampoco en herramientas de simulación de Cloudflare).

### 7.3 Requiere tráfico HTTP real contra staging con reglas activas

Nada de lo siguiente se ha probado en Cloudflare:

- Que las 4 expresiones y la regla Bulk se guarden sin error en el editor.
- Código 301 y encabezado `Location` de cada caso.
- Destino final 200, número de saltos y ausencia de bucles.
- Comportamiento real de `lang` ausente, `lang=ES`, `Lang=es`, `lang=%65s` y parámetros repetidos.
- Coincidencia de las entradas Bulk cuando la URL trae query string.
- Respuesta del origen de staging para `/products/` y para rutas inexistentes.

### 7.4 Scripts de validación

| Archivo | SHA256 |
|---|---|
| `validate_redirects.ps1` | `E44A3A10E1E3A38BC487001CF095936B3A6BDEF64333F702BC572B8C7B661C40` |
| `validate_redirects.sh` | `7E5FEFFDDAA641E495DD3DDF3FCCF30238DA877D6821C44311F0CFCB8B53A0B3` |

Cada script cubre 29 casos y prueba un artículo de muestra (`como-escribir-un-buen-prompt`). La verificación de los 29 artículos se hace con los bucles del apartado 9, paso 9. Antes de ejecutarlos hay que sustituir `staging.tudominio` en la primera línea de variables de cada script.

---

## 8. Limitaciones conocidas

1. **Parámetro `lang` residual.** El destino conserva `?lang=es` (apartado 5.3). Es el coste de conservar los UTM en el plan Free.
2. **`/products/` y demás páginas principales con barra final.** No están en los conjuntos. El resultado depende del origen. El requisito es solo que no se produzca una redirección directa imprevista a `/en/` o `/es/`; el script lo comprueba así.
3. **Sensibilidad a mayúsculas.** `lang=ES` y `Lang=es` se tratan como inglés. En la arquitectura anterior el sitio solo generaba `lang=es` en minúsculas.
4. **`.html` con `?lang=es`.** Va a la canónica en inglés (decisión aprobada).
5. **Indexación de las `.html`.** No se pudo verificar en Google Search Console ni en Bing Webmaster Tools (sin acceso). Las redirecciones Bulk cubren el caso tanto si están indexadas como si no.
6. **Mantenimiento.** Los conjuntos son listas cerradas de artículos legacy. Los artículos nuevos nacen ya en `/en/` y `/es/` y no requieren tocar las reglas. Solo habría que editarlas si se renombra o elimina un slug legacy.
7. **`x-default`.** El sitemap y los `hreflang` declaran `x-default` hacia español, mientras que las URLs legacy sin parámetro redirigen a inglés (así se decidió porque el inglés era el idioma por defecto de la arquitectura anterior). Son señales distintas y no entran en conflicto técnico, pero queda anotado.
8. **Dominio de staging.** El procedimiento del apartado 9 exige un dominio independiente ya registrado a nombre del titular. Este documento no autoriza comprar ni registrar ninguno.

---

## 9. Procedimiento de staging (preparado, no ejecutado)

Ninguno de estos pasos se ha ejecutado. Cada uno requiere autorización expresa.

**Paso 1 — Requisitos del dominio y acceso al registrador**

- Un dominio independiente de `dynxlabs.com`, ya registrado, sin tráfico ni correo en uso (o con ambos inventariados).
- Acceso de administrador al registrador para cambiar nameservers.
- Cuenta de Cloudflare (plan Free) con acceso de administrador.
- Definir el hostname de staging (por ejemplo, un subdominio `staging` de ese dominio) y sustituir el marcador `staging.tudominio` en las 4 expresiones, los 4 destinos, la lista Bulk, la regla Bulk y los 2 scripts.

**Paso 2 — Incorporación del dominio a Cloudflare**

- Añadir el dominio como zona nueva (Add a site, plan Free).
- Revisar los registros DNS que Cloudflare importa automáticamente.
- No cambiar todavía los nameservers.

**Paso 3 — DNS y verificación de correo y servicios antes de cambiar nameservers**

- Exportar la zona DNS actual desde el proveedor vigente y guardarla como respaldo.
- Comparar registro por registro con lo importado por Cloudflare: MX, SPF (TXT), DKIM, DMARC, verificaciones de terceros (TXT), CNAME y A/AAAA de servicios existentes.
- Completar a mano lo que falte. Los registros de correo quedan en modo DNS only (sin proxy).
- Anotar los nameservers actuales (plan de reversión: restaurarlos en el registrador).
- Solo entonces cambiar los nameservers en el registrador y esperar a que la zona figure como activa.
- Verificar después del cambio: `nslookup -type=MX` y `nslookup -type=TXT` del dominio, y un correo de prueba de entrada y salida si el dominio tiene correo.

**Paso 4 — Publicación del build mediante Cloudflare Pages**

- Crear un proyecto de Pages por carga directa (Direct Upload), sin conectar el repositorio de GitHub.
- Subir el contenido del build de trabajo. Excluir `node_modules`, `package.json`, `package-lock.json`, `scripts`, `generate-manifest.js` y el archivo `CNAME` (es de GitHub Pages).
- Comprobar en la URL `*.pages.dev` que las 72 canónicas responden 200 y que una ruta inexistente responde 404 (el build incluye `404.html` en la raíz; sin él, Pages responde 200 a todo).
- Las reglas de la zona no aplican al hostname `*.pages.dev`: ahí solo se valida el origen.

**Paso 5 — Asociación del dominio de staging**

- En el proyecto de Pages, Custom domains: añadir el hostname de staging.
- Cloudflare crea el registro CNAME con proxy activo y emite el certificado. Esperar al estado activo.
- El proxy activo (nube naranja) es imprescindible: sin él las reglas no se ejecutan.

**Paso 6 — Activación de las reglas exclusivamente para ese hostname**

- Rules → Redirect Rules: crear las 4 Single Redirects en el orden 1 a 4, pegando expresión y destino con el editor de expresiones. Tipo Dynamic, 301, Preserve query string ON.
- Confirmar que cada una se guarda sin error de sintaxis y que el orden en la lista es 1, 2, 3, 4.
- Nivel de cuenta → Bulk Redirects: crear la lista `dynx_html_staging` con las 7 entradas y luego la regla Bulk que la referencia (apartado 4.2), habilitada.
- Revisar que todas las expresiones contienen el hostname de staging y ningún otro.

**Paso 7 — Pruebas HTTP de cada ruta y de las redirecciones**

PowerShell:

```powershell
powershell -ExecutionPolicy Bypass -File .\validate_redirects.ps1
```

Bash:

```bash
bash ./validate_redirects.sh
```

Resultado exigido: `RESULTADO: 29 PASS / 0 FAIL` en ambos.

**Paso 8 — Comprobación de 301, Location, destino final 200, cadenas y bucles**

Cada caso de los scripts verifica: número de saltos (1 para legacy, 0 para migradas), código final (200 o 404), ruta final exacta sin query, y contenido de `Location`. Para inspeccionar un caso a mano:

```bash
curl -sI "https://staging.tudominio/products?lang=es&utm_source=li"
```

Debe mostrar `HTTP/2 301` y `location: https://staging.tudominio/es/products?lang=es&utm_source=li`.

```bash
curl -s -o /dev/null -L --max-redirs 5 -w "%{num_redirects} %{http_code} %{url_effective}\n" "https://staging.tudominio/products?lang=es&utm_source=li"
```

Debe mostrar `1 200` y la URL canónica. Un bucle haría fallar el comando por exceso de redirecciones.

**Paso 9 — Verificación de las 7 rutas `.html` y de los 29 artículos**

Las 7 `.html` están cubiertas por los scripts. Para los 29 artículos en sus 4 variantes (116 peticiones), con el archivo `slugs.txt` de este paquete:

```bash
H="staging.tudominio"; ok=0; bad=0
while read -r s; do
  for v in "/insights/$s|en" "/insights/$s/|en" "/insights/$s?lang=es|es" "/insights/$s/?lang=es|es"; do
    u="${v%%|*}"; l="${v#*|}"
    r=$(curl -s -o /dev/null -L --max-redirs 5 -w "%{num_redirects}|%{http_code}|%{url_effective}" "https://$H$u")
    n="${r%%|*}"; rest="${r#*|}"; c="${rest%%|*}"; f="${rest#*|}"; f="${f%%\?*}"
    if [ "$n" = 1 ] && [ "$c" = 200 ] && [ "$f" = "https://$H/$l/insights/$s/" ]; then ok=$((ok+1)); else bad=$((bad+1)); echo "FAIL $u -> $r"; fi
  done
done < slugs.txt
echo "RESULTADO: $ok OK / $bad FAIL (esperado 116 / 0)"
```

Criterio de aceptación de staging: scripts con 29/0, bucle de artículos con 116/0, y revisión manual de dos o tres encabezados `Location`.

---

## 10. Checklist de implementación futura

Staging:

- [ ] Autorización expresa para iniciar staging
- [ ] Dominio de staging confirmado y acceso al registrador verificado
- [ ] Marcador `staging.tudominio` sustituido en reglas, lista, regla Bulk y scripts
- [ ] Zona creada; DNS comparado con el respaldo; correo verificado
- [ ] Nameservers cambiados y zona activa
- [ ] Build publicado en Pages; 72 canónicas con 200; inexistente con 404
- [ ] Dominio personalizado activo con proxy y certificado
- [ ] 4 Single Redirects guardadas sin error, en orden 1 a 4
- [ ] Lista Bulk con 7 entradas y regla Bulk habilitada
- [ ] `validate_redirects.ps1` o `validate_redirects.sh`: 29 PASS / 0 FAIL
- [ ] Bucle de 29 artículos: 116 OK / 0 FAIL
- [ ] Resultados reales registrados en este documento (apartado 7.3)

Producción (fase posterior, fuera del alcance de este documento):

- [ ] Auditoría de infraestructura de `dynxlabs.com`: DNS, correo, SSL, proxy y plan de reversión
- [ ] Revisión de indexación de las `.html` en Search Console y Bing
- [ ] Autorización expresa para producción
- [ ] Réplica de las reglas con el hostname de producción y repetición de todas las pruebas

---

## 11. Estado de autorización y riesgos

### 11.1 Autorización

| Acción | Estado |
|---|---|
| Diseño de las reglas y preparación de documentos y scripts | Autorizado y completado |
| Cambios en `dynxlabs.com`, DNS o nameservers | No autorizado. No realizado |
| Creación de zonas, dominios o reglas en Cloudflare | No autorizado. No realizado |
| Despliegues (Pages u otros) | No autorizado. No realizado |
| Commits, push, merge, cambios en `main` o en el proyecto original | No autorizado. No realizado |

### 11.2 Riesgos

| Riesgo | Impacto | Mitigación |
|---|---|---|
| El comportamiento real de Cloudflare difiere de la documentación (por ejemplo, `lang` ausente o Bulk con query string) | Algún caso no redirige como se diseñó | Staging aislado; los scripts lo detectan antes de producción |
| Cambio de nameservers con registros DNS incompletos | Caída de correo u otros servicios del dominio | Paso 3: respaldo, comparación registro por registro y plan de reversión |
| Sustitución incompleta del marcador `staging.tudominio` | Las reglas no coinciden o apuntan a un host inexistente | Búsqueda del marcador en todos los artefactos antes de activar; checklist |
| Regla creada sin condición de hostname | Afectaría a otros hostnames de la zona | Todas las expresiones de este documento la incluyen; revisión en el paso 6 |
| Lista Bulk creada sin regla asociada | Las 7 `.html` no redirigen | Apartado 4.2 y checklist |
| Proxy desactivado en el hostname de staging | Las reglas no se ejecutan | Paso 5 |
| Dominio de staging no disponible | No se puede validar de forma aislada | Queda bloqueado hasta disponer de uno; no se valida sobre `dynxlabs.com` sin una decisión expresa |
