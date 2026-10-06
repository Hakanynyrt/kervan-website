#!/usr/bin/env bash
# Production smoke probe for kervanheat.com + kervanbreaker.com + magaza.kervanbreaker.com.
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

# Parts shop (M1 preview): up, and still closed to search engines.
check https://magaza.kervanbreaker.com/ 200 text/html
robots=$("${CURL[@]}" -o /dev/null -D - https://magaza.kervanbreaker.com/ | tr -d '\r' |
  awk -F': ' 'tolower($1) == "x-robots-tag" { print $2 }')
if [[ $robots == *noindex* ]]; then
  echo "ok    X-Robots-Tag '$robots'  https://magaza.kervanbreaker.com/"
else
  echo "FAIL  X-Robots-Tag '$robots'  https://magaza.kervanbreaker.com/  (want noindex)"
  fail=1
fi

exit $fail
