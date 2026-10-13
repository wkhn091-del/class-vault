import sharp from 'sharp';
import pngToIco from 'png-to-ico';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = path.join(root, 'public', 'brand', 'metivta-logo.png');
const outDir = path.join(root, 'public', 'icons');

/** Logo is on white — keep the home-screen tile looking like the logo itself. */
const BG = { r: 255, g: 255, b: 255, alpha: 1 };

async function makeBuffer(size, logoRatio) {
  const logoSize = Math.round(size * logoRatio);
  const logo = await sharp(src)
    .resize(logoSize, logoSize, { fit: 'contain', background: BG })
    .png()
    .toBuffer();

  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: BG,
    },
  })
    .composite([{ input: logo, gravity: 'centre' }])
    .png()
    .toBuffer();
}

async function makeIcon(size, fileName, logoRatio) {
  await writeFile(path.join(outDir, fileName), await makeBuffer(size, logoRatio));
}

await mkdir(outDir, { recursive: true });
await makeIcon(192, 'icon-192.png', 0.88);
await makeIcon(256, 'icon-256.png', 0.88);
await makeIcon(512, 'icon-512.png', 0.88);
/** Maskable: keep logo inside ~80% safe zone so Android adaptive icons don't crop it. */
await makeIcon(512, 'icon-512-maskable.png', 0.72);
await makeIcon(180, 'apple-touch-icon.png', 0.9);

const icoBuffers = await Promise.all([16, 32, 48, 64, 128, 256].map((s) => makeBuffer(s, 0.88)));
await writeFile(path.join(root, 'public', 'favicon.ico'), await pngToIco(icoBuffers));
console.log('PWA icons + favicon.ico written');
