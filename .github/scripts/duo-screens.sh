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

# Every display id simctl answers for, with its size, so a pose shot picks the display that is lit.
# Outer display 1398x2034, inner 2007x2853 (portrait; swapped in landscape). The ids change between
# Xcode builds, so they are probed, not fixed.
probe_dir="$RUNNER_TEMP/duo-probe"
rm -rf "$probe_dir" && mkdir -p "$probe_dir"

# shot <file name> <outer|inner>: the largest non-blank screenshot of a display of that kind.
shot() {
  local name="$1" want="$2" best="" best_size=0 id f s d w h kind
  rm -f "$probe_dir"/*.png
  for id in 0 1 2 3 4 5; do
    f="$probe_dir/d$id.png"
    xcrun simctl io "$UDID" screenshot --display="$id" "$f" >/dev/null 2>&1 || continue
    s=$(size_of "$f")
    d=$(dims_of "$f")
    w=${d%x*}
    h=${d#*x}
    kind=other
    if [ "$w" -gt 0 ]; then
      case "$(( w > h ? w : h ))" in
        2034) kind=outer ;;
        2853) kind=inner ;;
      esac
    fi
    echo "  display $id: $d, $s bytes, $kind"
    if [ "$kind" = "$want" ] && [ "$s" -gt "$best_size" ]; then
      best="$f"
      best_size=$s
    fi
  done
  if [ -z "$best" ]; then
    # Fallback: simctl's default display.
    f="$probe_dir/default.png"
    if xcrun simctl io "$UDID" screenshot "$f" >/dev/null 2>&1; then
      s=$(size_of "$f")
      echo "  default display: $(dims_of "$f"), $s bytes"
      best="$f"
      best_size=$s
    fi
  fi
  if [ -z "$best" ]; then
    echo "  no screenshot of the $want display"
    return 1
  fi
  if [ "$best_size" -lt "$MIN_BYTES" ]; then
    echo "  the $want display is blank or black ($best_size bytes)"
    return 2
  fi
  cp "$best" "$OUT/$name"
  echo "  saved $name ($(dims_of "$OUT/$name"), $best_size bytes)"
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

# run_pose <label> <command...>: runs a hinge command, waits, prints the posture.
run_pose() {
  local label="$1"
  shift
  echo "hinge $* ($label)"
  if ! "$HINGE" "$@" 2>&1; then
    echo "  hinge $* failed"
    return 1
  fi
  sleep 3
  echo "  posture: $(posture | tr '\n' ' ')"
  return 0
}

# Closed, landscape.
if run_pose "closed, landscape" orient landscape-left; then
  shot 1-kapali-yatay.png outer
  case $? in
    0) ;;
    2) skip 1-kapali-yatay "after 'hinge orient landscape-left' the outer display was blank" ;;
    *) skip 1-kapali-yatay "no screenshot of the outer display after 'hinge orient landscape-left'" ;;
  esac
  run_pose "back to portrait" orient portrait || true
else
  skip 1-kapali-yatay "'hinge orient landscape-left' failed"
fi

# Half open: Device Hub's own half-open preset is 130 degrees. A jump from 0 reaches the inner
# display more reliably through 90.
run_pose "towards half open" hinge 90 || true
if run_pose "half open" hinge 130; then
  shot 2-yari-acik.png inner
  case $? in
    0) ;;
    2) skip 2-yari-acik "at 130 degrees the inner display was blank or black" ;;
    *) skip 2-yari-acik "no screenshot of the inner display at 130 degrees" ;;
  esac
else
  skip 2-yari-acik "'hinge hinge 130' failed"
fi

# Fully open, portrait and landscape.
if run_pose "open" open; then
  shot 3-acik-dikey.png inner
  case $? in
    0) ;;
    2) skip 3-acik-dikey "fully open (180 degrees) the inner display was blank or black" ;;
    *) skip 3-acik-dikey "no screenshot of the inner display fully open" ;;
  esac
  if run_pose "open, landscape" orient landscape-left; then
    shot 4-acik-yatay.png inner
    case $? in
      0) ;;
      2) skip 4-acik-yatay "open and in landscape the inner display was blank or black" ;;
      *) skip 4-acik-yatay "no screenshot of the inner display open in landscape" ;;
    esac
    run_pose "back to portrait" orient portrait || true
  else
    skip 4-acik-yatay "'hinge orient landscape-left' failed while open"
  fi
else
  skip 3-acik-dikey "'hinge open' failed"
  skip 4-acik-yatay "'hinge open' failed"
fi

exit 0
