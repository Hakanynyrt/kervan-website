#!/usr/bin/env bash
# Production smoke probe for kervanheat.com + kervanbreaker.com + kiriciparca.com.
#
# Read-only: GET and OPTIONS only. Never POST to /api/rfq — a valid POST
# sends real email notifications.
# Exits non-zero if any check fails, so the calling workflow goes red.
set -uo pipefail

fail=0
CURL=(curl -sS --max-time 20 --retry 3 --retry-delay 5 --retry-all-errors)

# check <url> <expected status> <expected content-type prefix> [extra curl args...]
check() {
  local url=$1 want=$2 type=$3
  shift 3
  local out
  out=$("${CURL[@]}" "$@" -o /dev/null -w '%{http_code} %{content_type}' "$url") || out="000 curl-error"
  local code=${out%% *} ct=${out#* }
  if [[ $code == "$want" && $ct == "$type"* ]]; then
    echo "ok    $code $ct  $url"
  else
    echo "FAIL  $code $ct  $url  (want $want $type)"
    fail=1
  fi
}

# preflight <endpoint> <origin> yes|no — is the origin granted CORS?
preflight() {
  local url=$1 origin=$2 want=$3 headers acao
  if ! headers=$("${CURL[@]}" -X OPTIONS -D - -o /dev/null \
    -H "Origin: $origin" -H 'Access-Control-Request-Method: POST' "$url"); then
    echo "FAIL  CORS $origin  (curl error)"
    fail=1
    return
  fi
  acao=$(printf '%s' "$headers" | tr -d '\r' |
    awk -F': ' 'tolower($1) == "access-control-allow-origin" { print $2 }')
  if { [[ $want == yes && $acao == "$origin" ]] || [[ $want == no && -z $acao ]]; }; then
    echo "ok    CORS $origin -> '${acao}'"
  else
    echo "FAIL  CORS $origin -> '${acao}'  (want $want)"
    fail=1
  fi
}

# Sites up (-L so a future www -> apex redirect still passes).
for host in kervanheat.com www.kervanheat.com kervanbreaker.com www.kervanbreaker.com; do
  check "https://$host/" 200 text/html -L
done

# 3D model is a symlinked asset; the SPA fallback answers missing files with
# 200 text/html, so assert the content type, not just the status.
check https://kervanbreaker.com/kirici-uc.glb 200 model/gltf-binary

# RFQ Pages Function is deployed and routing (GET is rejected with JSON 405).
RFQ=https://kervanheat.com/api/rfq
check "$RFQ" 405 application/json

# Owner-only tech info must stay closed to anonymous visitors (JSON 401, not HTML).
check https://kervanheat.com/api/tech/content 401 application/json
# Same on the breaker site: its SPA fallback must not shadow the Pages Function
# (HTML 200 here would mean the API is not deployed).
check https://kervanbreaker.com/api/tech/content 401 application/json
# Private tip catalog (KV-backed): anonymous requests must be rejected before KV is read.
check https://kervanbreaker.com/api/tech/catalog 401 application/json
check https://kervanbreaker.com/api/tech/drawings 401 application/json

# The breaker contact form posts cross-origin to the heat-treatment function.
preflight "$RFQ" https://kervanbreaker.com yes
preflight "$RFQ" https://www.kervanbreaker.com yes
preflight "$RFQ" https://evil.example no

# Parts shop: up, and open to search engines (no noindex header; robots.txt names the sitemap).
check https://kiriciparca.com/ 200 text/html
robots=$("${CURL[@]}" -o /dev/null -D - https://kiriciparca.com/ | tr -d '\r' |
  awk -F': ' 'tolower($1) == "x-robots-tag" { print $2 }')
if [[ $robots != *noindex* ]]; then
  echo "ok    X-Robots-Tag '$robots'  https://kiriciparca.com/"
else
  echo "FAIL  X-Robots-Tag '$robots'  https://kiriciparca.com/  (want no noindex)"
  fail=1
fi
robotstxt=$("${CURL[@]}" https://kiriciparca.com/robots.txt | tr -d '\r')
if grep -qx 'Sitemap: https://kiriciparca.com/sitemap.xml' <<<"$robotstxt"; then
  echo "ok    robots.txt names the sitemap  https://kiriciparca.com/robots.txt"
else
  echo "FAIL  robots.txt has no 'Sitemap: https://kiriciparca.com/sitemap.xml' line"
  fail=1
fi
# Any XML content type (application/xml or text/xml).
check https://kiriciparca.com/sitemap.xml 200 ''
# The old shop hosts 301 to the new domain, path kept (zone Redirect Rules).
for old in https://magaza.kervanbreaker.com https://shop.kervanbreaker.com https://www.kiriciparca.com; do
  loc=$("${CURL[@]}" -o /dev/null -D - "$old/kirici-ucu" | tr -d '\r' |
    awk -F': ' 'tolower($1) == "location" { print $2 }')
  if [[ $loc == https://kiriciparca.com/kirici-ucu ]]; then
    echo "ok    301 $old/kirici-ucu -> $loc"
  else
    echo "FAIL  $old/kirici-ucu -> '$loc'  (want https://kiriciparca.com/kirici-ucu)"
    fail=1
  fi
done
# The day/night middleware answers every page of all three sites (day / night by the request's
# location, unknown without coordinates); no header means the Pages Function did not run.
for url in https://kiriciparca.com/ https://kervanbreaker.com/ https://kervanheat.com/; do
  sun=$("${CURL[@]}" -o /dev/null -D - "$url" | tr -d '\r' |
    awk -F': ' 'tolower($1) == "x-kv-sun" { print $2 }')
  if [[ $sun == day || $sun == night || $sun == unknown ]]; then
    echo "ok    X-Kv-Sun '$sun'  $url"
  else
    echo "FAIL  X-Kv-Sun '$sun'  $url  (middleware not running)"
    fail=1
  fi
done

# Tip images come from R2 (img.kiriciparca.com): one real image URL taken from a live model page
# must serve as image/webp. Skipped while no page points at R2 yet.
img=$("${CURL[@]}" https://kiriciparca.com/kirici/mtb/215 | grep -oE 'https://img\.kiriciparca\.com/tips/[A-Za-z0-9._-]+\.webp' | head -n 1 || true)
if [[ -n $img ]]; then
  check "$img" 200 image/webp
else
  echo "skip  no R2 tip image on https://kiriciparca.com/kirici/mtb/215 yet"
fi

exit $fail
