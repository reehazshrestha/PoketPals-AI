#!/usr/bin/env bash
# Render every launcher icon from scripts/app-icon/poketpals.png.
#
# Requires ImageMagick (magick or convert). The source is a 1024x1024 PNG with
# a transparent background; the script writes legacy and adaptive Android
# icons plus the iOS AppIcon.
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
src="$root/scripts/app-icon/poketpals.png"
res="$root/android/app/src/main/res"
ios="$root/ios/PocketPal/Images.xcassets/AppIcon.appiconset"

if command -v magick >/dev/null 2>&1; then
  im=magick
elif command -v convert >/dev/null 2>&1; then
  im=convert
else
  echo "render-app-icons: ImageMagick is required" >&2
  exit 1
fi

if [[ ! -f "$src" ]]; then
  echo "render-app-icons: missing $src" >&2
  exit 1
fi

for pair in mdpi:1 hdpi:1.5 xhdpi:2 xxhdpi:3 xxxhdpi:4; do
  density=${pair%%:*}
  scale=${pair##*:}
  legacy=$(python3 -c "print(round(48*$scale))")
  canvas=$(python3 -c "print(round(108*$scale))")
  foreground=$(python3 -c "print(round($canvas*0.72))")

  "$im" "$src" -resize "${legacy}x${legacy}" -background none \
    -gravity center -extent "${legacy}x${legacy}" \
    "$res/mipmap-$density/ic_launcher.png"

  "$im" "$src" -resize "${legacy}x${legacy}" -background none \
    -gravity center -extent "${legacy}x${legacy}" \
    \( -size "${legacy}x${legacy}" xc:none -fill white \
       -draw "circle $((legacy / 2)),$((legacy / 2)) $((legacy / 2)),1" \) \
    -alpha set -compose DstIn -composite \
    "$res/mipmap-$density/ic_launcher_round.png"

  "$im" "$src" -resize "${foreground}x${foreground}" -background none \
    -gravity center -extent "${canvas}x${canvas}" \
    "$res/mipmap-$density/ic_launcher_foreground.png"

  "$im" "$res/mipmap-$density/ic_launcher_foreground.png" \
    -fill white -colorize 100 \
    "$res/mipmap-$density/ic_launcher_monochrome.png"
done

mkdir -p "$ios"
"$im" "$src" -background white -alpha remove -alpha off -resize 1024x1024 \
  "$ios/AppIcon.png"
"$im" "$src" -background '#101114' -alpha remove -alpha off \
  -resize 1024x1024 "$ios/AppIcon-dark.png"
"$im" "$src" -background white -alpha remove -alpha off \
  -resize 1024x1024 -colorspace Gray "$ios/AppIcon-tinted.png"

echo "Rendered Android launcher icons and iOS AppIcon."
