import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = path.join(root, 'public', 'brand', 'metivta-logo.png');
const outDir = path.join(root, 'public', 'icons');

/** Logo is on white — keep the home-screen tile looking like the logo itself. */
const BG = { r: 255, g: 255, b: 255, alpha: 1 };

async function makeIcon(size, fileName, logoRatio) {
  const logoSize = Math.round(size * logoRatio);
  const logo = await sharp(src)
    .resize(logoSize, logoSize, { fit: 'contain', background: BG })
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: BG,
    },
  })
    .composite([{ input: logo, gravity: 'centre' }])
    .png()
    .toFile(path.join(outDir, fileName));
}

await mkdir(outDir, { recursive: true });
await makeIcon(192, 'icon-192.png', 0.88);
await makeIcon(512, 'icon-512.png', 0.88);
/** Maskable: keep logo inside ~80% safe zone so Android adaptive icons don't crop it. */
await makeIcon(512, 'icon-512-maskable.png', 0.72);
await makeIcon(180, 'apple-touch-icon.png', 0.9);
console.log('PWA icons written to public/icons');
