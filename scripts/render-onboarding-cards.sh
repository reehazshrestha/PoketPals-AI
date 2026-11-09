#!/usr/bin/env bash
# Rebuild the screen-3 "your pal" card so the phone shows the current app icon.
#
# The base illustration is a Figma export; only the old PocketPal face inside
# the phone is replaced. Requires ImageMagick.
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
src="$root/src/assets/poketpals-icon.png"
out="$root/src/assets/onboarding/screen-3-cards.png"

if command -v magick >/dev/null 2>&1; then
  im=magick
elif command -v convert >/dev/null 2>&1; then
  im=convert
else
  echo "render-onboarding-cards: ImageMagick is required" >&2
  exit 1
fi

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

"$im" "$src" -resize 88x88 -background white -gravity center -extent 104x104 \
  \( -size 104x104 xc:none -fill white \
     -draw "roundrectangle 0,0 103,103 24,24" \) \
  -alpha set -compose DstIn -composite -background none -rotate 9 "$tmp/tile.png"

"$im" "$out" "$tmp/tile.png" -geometry +352+298 -composite "$tmp/out.png"
mv "$tmp/out.png" "$out"

echo "Updated $out"
