#!/usr/bin/env bash
H="staging.tudominio"
S="como-escribir-un-buen-prompt"
site="https://$H"
pass=0
fail=0

run() {
    # args: nombre url exp_nr exp_fc exp_path loc_contiene loc_prohibida_regex   ("-" = omitir)
    local name="$1" url="$2" enr="$3" efc="$4" epath="$5" elc="$6" eln="$7"
    local first final code loc nr rest fc fu base ok=1 msg=""

    first=$(curl -s -o /dev/null -w "%{http_code}|%{redirect_url}" "$url")
    final=$(curl -s -L -o /dev/null -w "%{num_redirects}|%{http_code}|%{url_effective}" "$url")

    code="${first%%|*}"
    loc="${first#*|}"
    nr="${final%%|*}"
    rest="${final#*|}"
    fc="${rest%%|*}"
    fu="${rest#*|}"
    base="${fu%%\?*}"   # separa la query: todo antes del primer '?'

    [ "$enr" != "-" ] && [ "$nr" != "$enr" ]       && { ok=0; msg="${msg}saltos=$nr(esp $enr); "; }
    [ "$efc" != "-" ] && [ "$fc" != "$efc" ]       && { ok=0; msg="${msg}code=$fc(esp $efc); "; }
    [ "$epath" != "-" ] && [ "$base" != "$epath" ] && { ok=0; msg="${msg}path=$base(esp $epath); "; }

    if [ "$elc" != "-" ]; then
        case "$loc" in
            *"$elc"*) ;;
            *) ok=0; msg="${msg}Location sin '$elc'; " ;;
        esac
    fi

    if [ "$eln" != "-" ]; then
        if printf '%s' "$loc" | grep -qE "$eln"; then
            ok=0; msg="${msg}Location prohibida ($loc); "
        fi
    fi

    if [ "$ok" = 1 ]; then
        pass=$((pass + 1)); echo "PASS  $name"
    else
        fail=$((fail + 1)); echo "FAIL  $name  [$msg]"
    fi
}

run "/products (sin param)"               "$site/products"                       1 200 "$site/en/products"      -               -
run "/products?lang=es"                   "$site/products?lang=es"               1 200 "$site/es/products"      "lang=es"       -
run "/products?lang=en"                   "$site/products?lang=en"               1 200 "$site/en/products"      -               -
run "/products?lang=ES (valor mayus)"     "$site/products?lang=ES"               1 200 "$site/en/products"      -               -
run "/products?Lang=es (clave mayus)"     "$site/products?Lang=es"               1 200 "$site/en/products"      -               -
run "/products?xlang=es"                  "$site/products?xlang=es"              1 200 "$site/en/products"      -               -
run "/products?utm_campaign=lang=es"      "$site/products?utm_campaign=lang=es"  1 200 "$site/en/products"      -               -
run "/products?lang=%65s (sin decodif.)"  "$site/products?lang=%65s"             1 200 "$site/en/products"      -               -
run "/products?lang=es&utm_source=li"     "$site/products?lang=es&utm_source=li" 1 200 "$site/es/products"      "utm_source=li" -
run "/products?utm_source=li&lang=es"     "$site/products?utm_source=li&lang=es" 1 200 "$site/es/products"      "utm_source=li" -
run "/products?lang=en&lang=es (repet)"   "$site/products?lang=en&lang=es"       1 200 "$site/es/products"      -               -
run "/insights/<slug>/ (con barra)"       "$site/insights/$S/"                   1 200 "$site/en/insights/$S/"  -               -
run "/insights/<slug> (sin barra)"        "$site/insights/$S"                    1 200 "$site/en/insights/$S/"  -               -
run "/insights/<slug>/?lang=es"           "$site/insights/$S/?lang=es"           1 200 "$site/es/insights/$S/"  -               -
run "/insights/<slug>?lang=es"            "$site/insights/$S?lang=es"            1 200 "$site/es/insights/$S/"  -               -
run "/products/ (NO redirige a /en /es)"  "$site/products/"                      - -   -                        -               "/(en|es)/"
run "/ (raiz)"                            "$site/"                               1 200 "$site/en/"              -               -
run "/?lang=es (raiz ES)"                 "$site/?lang=es"                       1 200 "$site/es/"              -               -
run "index.html (Bulk)"                   "$site/index.html"                     1 200 "$site/en/"              -               -
run "products.html (Bulk)"                "$site/products.html"                  1 200 "$site/en/products"      -               -
run "research.html (Bulk)"                "$site/research.html"                  1 200 "$site/en/research"      -               -
run "faq.html (Bulk)"                     "$site/faq.html"                       1 200 "$site/en/faq"           -               -
run "contact.html (Bulk)"                 "$site/contact.html"                   1 200 "$site/en/contact"       -               -
run "leadership.html (Bulk)"              "$site/leadership.html"                1 200 "$site/en/leadership"    -               -
run "insights.html (Bulk)"                "$site/insights.html"                  1 200 "$site/en/insights"      -               -
run "/en/products (migrada, sin bucle)"   "$site/en/products"                    0 200 "$site/en/products"      -               -
run "/es/insights/<slug>/ (migrada)"      "$site/es/insights/$S/"                0 200 "$site/es/insights/$S/"  -               -
run "/insights/no-existe"                 "$site/insights/no-existe"             0 404 -                        -               "/(en|es)/"
run "/ruta-inexistente"                   "$site/ruta-inexistente"               0 404 -                        -               "/(en|es)/"

echo ""
echo "RESULTADO: $pass PASS / $fail FAIL"
