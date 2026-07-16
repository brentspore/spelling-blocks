#!/usr/bin/env bash
# Regenerate the share/marketing assets from the committed HTML/SVG sources.
# Needs Google Chrome (override the path with CHROME=...). Run from anywhere.
set -euo pipefail

CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
DIR="$(cd "$(dirname "$0")/.." && pwd)"
TMP="$(mktemp -d)"

shot() { # <html> <w> <h> <out>
  "$CHROME" --headless=new --hide-scrollbars --disable-gpu --force-device-scale-factor=1 \
    --default-background-color=00000000 --virtual-time-budget=4000 \
    --window-size="$2,$3" --screenshot="$4" "file://$1" >/dev/null 2>&1
}

shot "$DIR/scripts/og.html" 1200 630 "$DIR/public/og.png"
shot "$DIR/scripts/render-apple.html" 180 180 "$DIR/public/apple-touch-icon.png"
shot "$DIR/scripts/render-icon.html" 256 256 "$TMP/icon-256.png"
node "$DIR/scripts/png-to-ico.mjs" "$TMP/icon-256.png" "$DIR/public/favicon.ico"

rm -rf "$TMP"
echo "Wrote public/og.png, public/apple-touch-icon.png, public/favicon.ico"
