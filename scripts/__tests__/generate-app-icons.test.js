const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const SOURCE = 'scripts/app-icon/poketpals.png';
const ANDROID_RES = 'android/app/src/main/res';
const IOS_ICON = 'ios/PocketPal/Images.xcassets/AppIcon.appiconset/AppIcon.png';

const LEGACY_SIZES = {mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192};
const CANVAS_SIZES = {
  mdpi: 108,
  hdpi: 162,
  xhdpi: 216,
  xxhdpi: 324,
  xxxhdpi: 432,
};

const read = file => fs.readFileSync(path.join(REPO_ROOT, file));
const exists = file => fs.existsSync(path.join(REPO_ROOT, file));

/** Read width, height and colour type from a PNG IHDR chunk. */
const pngInfo = file => {
  const bytes = read(file);
  const signature = bytes.subarray(0, 8).toString('hex');
  if (signature !== '89504e470d0a1a0a') {
    throw new Error(`${file} is not a PNG`);
  }
  if (bytes.subarray(12, 16).toString('ascii') !== 'IHDR') {
    throw new Error(`${file} has no IHDR chunk`);
  }
  return {
    width: bytes.readUInt32BE(16),
    height: bytes.readUInt32BE(20),
    bitDepth: bytes[24],
    colorType: bytes[25],
  };
};

describe('PoketPals launcher icons', () => {
  it('ships a 1024x1024 transparent source image', () => {
    const info = pngInfo(SOURCE);
    expect(info).toMatchObject({width: 1024, height: 1024, colorType: 6});
  });

  it.each(Object.entries(LEGACY_SIZES))(
    'writes the %s legacy square and round icons',
    (density, size) => {
      for (const name of ['ic_launcher', 'ic_launcher_round']) {
        const info = pngInfo(`${ANDROID_RES}/mipmap-${density}/${name}.png`);
        expect(info).toMatchObject({width: size, height: size});
      }
    },
  );

  it.each(Object.entries(CANVAS_SIZES))(
    'writes the %s adaptive foreground and monochrome layers',
    (density, canvas) => {
      for (const name of ['ic_launcher_foreground', 'ic_launcher_monochrome']) {
        const info = pngInfo(`${ANDROID_RES}/mipmap-${density}/${name}.png`);
        expect(info).toMatchObject({width: canvas, height: canvas});
      }
    },
  );

  it('points both adaptive XML icons at the mipmap layers', () => {
    for (const file of ['ic_launcher.xml', 'ic_launcher_round.xml']) {
      const xml = read(`${ANDROID_RES}/mipmap-anydpi-v26/${file}`).toString(
        'utf8',
      );
      expect(xml).toContain(
        '<foreground android:drawable="@mipmap/ic_launcher_foreground" />',
      );
      expect(xml).toContain(
        '<monochrome android:drawable="@mipmap/ic_launcher_monochrome" />',
      );
      expect(xml).toContain('@color/ic_launcher_background');
    }
  });

  it('writes an opaque 1024x1024 iOS AppIcon', () => {
    const info = pngInfo(IOS_ICON);
    expect(info).toMatchObject({width: 1024, height: 1024, colorType: 2});
  });

  it('labels the Android app PoketPals AI', () => {
    const strings = read(`${ANDROID_RES}/values/strings.xml`).toString('utf8');
    expect(strings).toContain('<string name="app_name">PoketPals AI</string>');
  });

  it('keeps a render script next to the source', () => {
    expect(exists('scripts/render-app-icons.sh')).toBe(true);
  });
});
