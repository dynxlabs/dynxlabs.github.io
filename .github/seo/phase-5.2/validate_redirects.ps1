$H    = "staging.tudominio"
$S    = "como-escribir-un-buen-prompt"
$site = "https://$H"

function Probe($u) {
    $first = curl.exe -s -o NUL -w "%{http_code}|%{redirect_url}" $u
    $final = curl.exe -s -L -o NUL -w "%{num_redirects}|%{http_code}|%{url_effective}" $u
    $a = $first.Split('|')
    $b = $final.Split('|')
    [pscustomobject]@{
        Code  = $a[0]
        Loc   = $a[1]
        NR    = [int]$b[0]
        FCode = $b[1]
        FUrl  = $b[2]
        Base  = ($b[2] -split '\?', 2)[0]
    }
}

$tests = @(
    @{ n = "/products (sin param)";                u = "$site/products";                       nr = 1; fc = "200"; path = "$site/en/products" }
    @{ n = "/products?lang=es";                    u = "$site/products?lang=es";               nr = 1; fc = "200"; path = "$site/es/products"; lc = @("lang=es") }
    @{ n = "/products?lang=en";                    u = "$site/products?lang=en";               nr = 1; fc = "200"; path = "$site/en/products" }
    @{ n = "/products?lang=ES (valor mayus)";      u = "$site/products?lang=ES";               nr = 1; fc = "200"; path = "$site/en/products" }
    @{ n = "/products?Lang=es (clave mayus)";      u = "$site/products?Lang=es";               nr = 1; fc = "200"; path = "$site/en/products" }
    @{ n = "/products?xlang=es";                   u = "$site/products?xlang=es";              nr = 1; fc = "200"; path = "$site/en/products" }
    @{ n = "/products?utm_campaign=lang=es";       u = "$site/products?utm_campaign=lang=es";  nr = 1; fc = "200"; path = "$site/en/products" }
    @{ n = "/products?lang=%65s (sin decodificar)";u = "$site/products?lang=%65s";             nr = 1; fc = "200"; path = "$site/en/products" }
    @{ n = "/products?lang=es&utm_source=li";      u = "$site/products?lang=es&utm_source=li"; nr = 1; fc = "200"; path = "$site/es/products"; lc = @("utm_source=li", "lang=es") }
    @{ n = "/products?utm_source=li&lang=es (inv)";u = "$site/products?utm_source=li&lang=es"; nr = 1; fc = "200"; path = "$site/es/products"; lc = @("utm_source=li") }
    @{ n = "/products?lang=en&lang=es (repetido)"; u = "$site/products?lang=en&lang=es";       nr = 1; fc = "200"; path = "$site/es/products" }
    @{ n = "/insights/<slug>/ (con barra)";        u = "$site/insights/$S/";                   nr = 1; fc = "200"; path = "$site/en/insights/$S/" }
    @{ n = "/insights/<slug> (sin barra)";         u = "$site/insights/$S";                    nr = 1; fc = "200"; path = "$site/en/insights/$S/" }
    @{ n = "/insights/<slug>/?lang=es";            u = "$site/insights/$S/?lang=es";           nr = 1; fc = "200"; path = "$site/es/insights/$S/" }
    @{ n = "/insights/<slug>?lang=es";             u = "$site/insights/${S}?lang=es";            nr = 1; fc = "200"; path = "$site/es/insights/$S/" }
    @{ n = "/products/ (NO redirige a /en /es)";   u = "$site/products/";                      ln = "/(en|es)/" }
    @{ n = "/ (raiz)";                             u = "$site/";                               nr = 1; fc = "200"; path = "$site/en/" }
    @{ n = "/?lang=es (raiz ES)";                  u = "$site/?lang=es";                       nr = 1; fc = "200"; path = "$site/es/" }
    @{ n = "index.html (Bulk)";                    u = "$site/index.html";                     nr = 1; fc = "200"; path = "$site/en/" }
    @{ n = "products.html (Bulk)";                 u = "$site/products.html";                  nr = 1; fc = "200"; path = "$site/en/products" }
    @{ n = "research.html (Bulk)";                 u = "$site/research.html";                  nr = 1; fc = "200"; path = "$site/en/research" }
    @{ n = "faq.html (Bulk)";                      u = "$site/faq.html";                       nr = 1; fc = "200"; path = "$site/en/faq" }
    @{ n = "contact.html (Bulk)";                  u = "$site/contact.html";                   nr = 1; fc = "200"; path = "$site/en/contact" }
    @{ n = "leadership.html (Bulk)";               u = "$site/leadership.html";                nr = 1; fc = "200"; path = "$site/en/leadership" }
    @{ n = "insights.html (Bulk)";                 u = "$site/insights.html";                  nr = 1; fc = "200"; path = "$site/en/insights" }
    @{ n = "/en/products (migrada, sin bucle)";    u = "$site/en/products";                    nr = 0; fc = "200"; path = "$site/en/products" }
    @{ n = "/es/insights/<slug>/ (migrada)";       u = "$site/es/insights/$S/";                nr = 0; fc = "200"; path = "$site/es/insights/$S/" }
    @{ n = "/insights/no-existe";                  u = "$site/insights/no-existe";             nr = 0; fc = "404"; ln = "/(en|es)/" }
    @{ n = "/ruta-inexistente";                    u = "$site/ruta-inexistente";               nr = 0; fc = "404"; ln = "/(en|es)/" }
)

$pass = 0
$fail = 0
foreach ($t in $tests) {
    $r   = Probe $t.u
    $ok  = $true
    $msg = @()
    if ($t.ContainsKey('nr')   -and $r.NR    -ne $t.nr)   { $ok = $false; $msg += "saltos=$($r.NR)(esp $($t.nr))" }
    if ($t.ContainsKey('fc')   -and $r.FCode -ne $t.fc)   { $ok = $false; $msg += "code=$($r.FCode)(esp $($t.fc))" }
    if ($t.ContainsKey('path') -and $r.Base  -ne $t.path) { $ok = $false; $msg += "path=$($r.Base)(esp $($t.path))" }
    if ($t.ContainsKey('lc')) {
        foreach ($s in $t.lc) {
            if ($r.Loc -notlike "*$s*") { $ok = $false; $msg += "Location sin '$s'" }
        }
    }
    if ($t.ContainsKey('ln') -and $r.Loc -match $t.ln) { $ok = $false; $msg += "Location prohibida=$($r.Loc)" }
    if ($ok) { $pass++; "PASS  $($t.n)" }
    else     { $fail++; "FAIL  $($t.n)  [$($msg -join '; ')]" }
}
""
"RESULTADO: $pass PASS / $fail FAIL"
