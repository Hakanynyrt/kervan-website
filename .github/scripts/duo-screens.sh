#!/usr/bin/env bash
# Screenshots of the iPhone app on the iPhone Duo simulator (.github/workflows/app-duo-screens.yml).
# Usage: duo-screens.sh <udid> <bundle id> <out dir>
# The app is already installed on the booted simulator <udid>. simctl has no fold or rotate command
# (Xcode 27.1), so poses and rotation go through `hinge` (github.com/artemnovichkov/hinge, MIT; the
# vendor HID event Device Hub's buttons send) when it installs and answers; a pose it cannot reach
# is listed as skipped with the reason, never faked. Prints file names, sizes and dimensions only.
set -uo pipefail

UDID="$1"
BID="$2"
OUT="$3"
mkdir -p "$OUT"
SKIPPED="$OUT/../duo-skipped.txt"
: > "$SKIPPED"

skip() { echo "SKIPPED $1: $2" | tee -a "$SKIPPED"; }

# A solid black (inactive display) or blank white screenshot compresses to a few KB; a rendered
# page of the app is far larger.
MIN_BYTES=40000

size_of() { stat -f %z "$1" 2>/dev/null || echo 0; }
dims_of() {
  local w h
  w=$(sips -g pixelWidth "$1" 2>/dev/null | awk '/pixelWidth/ {print $2}')
  h=$(sips -g pixelHeight "$1" 2>/dev/null | awk '/pixelHeight/ {print $2}')
  echo "${w:-0}x${h:-0}"
}

echo "::group::Displays (simctl io enumerate)"
xcrun simctl io "$UDID" enumerate 2>&1 || true
echo "::endgroup::"

# The integrated displays' screen ids and sizes, from enumerate (outer 1398x2034, inner 2007x2853 on
# Xcode 27.1; the ids change between Xcode builds, so they are read, not fixed). Probing other ids
# (TV-out, CarPlay, resizable) makes simctl wait about a minute each, so only these are shot.
SCREENS=$(xcrun simctl io "$UDID" enumerate 2>/dev/null | awk '
  /Screen ID:/ {id=$3}
  /Pixel Size:/ {gsub(/[{},]/, "", $0); w=$3; h=$4; m=(w>h?w:h); if (m==2034) print id, "outer"; if (m==2853) print id, "inner"}')
echo "integrated displays (id kind):"
echo "$SCREENS" | sed 's/^/  /'
probe_dir="$RUNNER_TEMP/duo-probe"
rm -rf "$probe_dir" && mkdir -p "$probe_dir"

# active_kind: outer or inner, the display that hosts the UI (hinge posture), empty without hinge.
active_kind() {
  [ -n "${HINGE:-}" ] || return 0
  "$HINGE" posture --json 2>/dev/null | python3 -c '
import json, sys
d = json.load(sys.stdin)
for x in d.get("displays", []):
    if x.get("active"):
        print("inner" if max(x.get("size", [0, 0])) == 2853 else "outer")
        break
' 2>/dev/null || true
}

# shot <file name> <outer|inner>: a screenshot of that display, kept only when it is the active
# one (when hinge can tell) and not blank or black.
shot() {
  local name="$1" want="$2" id f s act
  act=$(active_kind)
  if [ -n "$act" ] && [ "$act" != "$want" ]; then
    echo "  the active display is $act, not $want"
    return 3
  fi
  id=$(echo "$SCREENS" | awk -v k="$want" '$2 == k {print $1; exit}')
  f="$probe_dir/$name"
  if [ -n "$id" ]; then
    xcrun simctl io "$UDID" screenshot --display="$id" "$f" >/dev/null 2>&1 || rm -f "$f"
  else
    xcrun simctl io "$UDID" screenshot "$f" >/dev/null 2>&1 || rm -f "$f"
  fi
  if [ ! -s "$f" ]; then
    echo "  no screenshot of the $want display (id ${id:-default})"
    return 1
  fi
  s=$(size_of "$f")
  echo "  $want display (id ${id:-default}): $(dims_of "$f"), $s bytes"
  if [ "$s" -lt "$MIN_BYTES" ]; then
    echo "  the $want display is blank or black"
    return 2
  fi
  cp "$f" "$OUT/$name"
  echo "  saved $name"
  return 0
}

# Wait for the home screen: a fixed wait, then up to three more tries.
echo "Waiting for the app's home screen"
sleep 20
first_ok=1
for try in 1 2 3 4; do
  echo "Closed, portrait (try $try)"
  if shot 1-kapali-dikey.png outer; then
    first_ok=0
    break
  fi
  sleep 15
done
if [ "$first_ok" -ne 0 ]; then
  skip 1-kapali-dikey "the outer display stayed blank after about 65 s"
fi

# ---- Fold and rotation through hinge -------------------------------------------------------------
HINGE=""
echo "::group::Install hinge (Homebrew)"
export HOMEBREW_NO_AUTO_UPDATE=1 HOMEBREW_NO_INSTALL_CLEANUP=1 HOMEBREW_NO_ENV_HINTS=1
if brew install artemnovichkov/tap/hinge; then
  HINGE=$(command -v hinge || true)
fi
echo "::endgroup::"

if [ -z "$HINGE" ]; then
  reason="hinge could not be installed (brew install artemnovichkov/tap/hinge failed); simctl has no fold or rotate command"
  skip 1-kapali-yatay "$reason"
  skip 2-yari-acik "$reason"
  skip 3-acik-dikey "$reason"
  skip 4-acik-yatay "$reason"
  exit 0
fi

export HINGE_DEVICE="$UDID"
echo "hinge: $HINGE ($(brew list --versions hinge 2>/dev/null || echo 'version unknown'))"
hinge --help 2>&1 | head -40 || true

posture() { hinge posture --json 2>&1 || true; }

# run_pose <label> <command...>: runs a hinge command (10 s to confirm a new angle; the default 2 s
# is too short on the CI runner), waits, prints the posture.
run_pose() {
  local label="$1"
  shift
  echo "hinge $* ($label)"
  if ! "$HINGE" -t 10 "$@" 2>&1; then
    echo "  hinge $* failed"
    return 1
  fi
  sleep 3
  echo "  posture: $(posture | tr '\n' ' ')"
  return 0
}

# angle_now: the hinge angle hinge reports (posture JSON), empty when it does not answer.
angle_now() {
  "$HINGE" posture --json 2>/dev/null | python3 -c 'import json, sys; print(json.load(sys.stdin).get("angle", ""))' 2>/dev/null || true
}

# set_angle <degrees> <label>: hinge's own confirmation (-t) times out at random on the runner even
# when the angle is reached, so it is skipped (-t 0) and the angle is read back here: up to three
# tries, each polled for 15 s, within 2 degrees.
set_angle() {
  local deg="$1" label="$2" try i a=""
  for try in 1 2 3; do
    echo "hinge set $deg ($label, try $try)"
    "$HINGE" -t 0 set "$deg" 2>&1 || echo "  hinge set $deg returned an error"
    for i in $(seq 15); do
      a=$(angle_now)
      if [ -n "$a" ] && python3 -c "import sys; sys.exit(0 if abs(float(sys.argv[1]) - $deg) <= 2 else 1)" "$a" 2>/dev/null; then
        sleep 2
        echo "  posture: $(posture | tr '\n' ' ')"
        return 0
      fi
      sleep 1
    done
    echo "  the angle is ${a:-unknown}, not $deg"
  done
  return 1
}

# Closed, landscape.
if run_pose "closed, landscape" orient landscape-left; then
  shot 1-kapali-yatay.png outer
  case $? in
    0) ;;
    2) skip 1-kapali-yatay "after 'hinge orient landscape-left' the outer display was blank" ;;
    3) skip 1-kapali-yatay "closed in landscape, hinge reports the inner display as active" ;;
    *) skip 1-kapali-yatay "no screenshot of the outer display after 'hinge orient landscape-left'" ;;
  esac
  run_pose "back to portrait" orient portrait || true
else
  skip 1-kapali-yatay "'hinge orient landscape-left' failed"
fi

# Half open at Device Hub's own half-open preset, 130 degrees, through 90 (a jump from 0 reaches the
# inner display less reliably).
set_angle 90 "towards half open" || true
if set_angle 130 "half open"; then
  half=$(active_kind)
  echo "half open at 130 degrees, active display: ${half:-unknown}"
  shot 2-yari-acik.png "${half:-inner}"
  case $? in
    0) ;;
    2) skip 2-yari-acik "at 130 degrees the ${half:-inner} display was blank or black" ;;
    *) skip 2-yari-acik "no screenshot of the ${half:-inner} display at 130 degrees" ;;
  esac
else
  skip 2-yari-acik "hinge did not reach 130 degrees in three tries"
fi

# Fully open, portrait and landscape.
if set_angle 180 "open"; then
  shot 3-acik-dikey.png inner
  case $? in
    0) ;;
    2) skip 3-acik-dikey "fully open (180 degrees) the inner display was blank or black" ;;
    3) skip 3-acik-dikey "fully open, hinge reports the outer display as active" ;;
    *) skip 3-acik-dikey "no screenshot of the inner display fully open" ;;
  esac
  if run_pose "open, landscape" orient landscape-left; then
    shot 4-acik-yatay.png inner
    case $? in
      0) ;;
      2) skip 4-acik-yatay "open and in landscape the inner display was blank or black" ;;
      3) skip 4-acik-yatay "open in landscape, hinge reports the outer display as active" ;;
      *) skip 4-acik-yatay "no screenshot of the inner display open in landscape" ;;
    esac
    run_pose "back to portrait" orient portrait || true
  else
    skip 4-acik-yatay "'hinge orient landscape-left' failed while open"
  fi
else
  skip 3-acik-dikey "hinge did not reach 180 degrees in three tries"
  skip 4-acik-yatay "hinge did not reach 180 degrees in three tries"
fi

exit 0
