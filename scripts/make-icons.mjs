// Generates the site icons from public/favicon.svg (T11): `node scripts/make-icons.mjs`.
// A simple placeholder mark (gold sword in a ring on dark green); replace favicon.svg and re-run to restyle.
import { mkdir, readFile } from 'node:fs/promises';
import sharp from 'sharp';

const svg = await readFile(new URL('../public/favicon.svg', import.meta.url));
const out = new URL('../public/icons/', import.meta.url);
await mkdir(out, { recursive: true });
const png = (name, size) =>
  sharp(svg, { density: 384 }).resize(size, size).png().toFile(new URL(name, out).pathname);
await Promise.all([
  png('icon-192.png', 192),
  png('icon-512.png', 512),
  png('apple-touch-icon.png', 180),
  png('favicon-48.png', 48),
]);
// Share preview 1200x630: the mark centered on the page background.
await sharp({ create: { width: 1200, height: 630, channels: 4, background: '#131514' } })
  .composite([
    {
      input: await sharp(svg, { density: 384 }).resize(460, 460).png().toBuffer(),
      gravity: 'center',
    },
  ])
  .png()
  .toFile(new URL('og-image.png', out).pathname);
