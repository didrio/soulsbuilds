// Bundles the link-preview function (T37): functions/src/index.ts plus the shared code from src/ (the
// game data, the editor store for the plain page, share meta) into functions/lib/ (index.js + chunks), and copies the card's fonts next to it.
// The Firebase deploy runs this as the functions' predeploy step (firebase.json); `npm run build:functions`.
import { cpSync, mkdirSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { rolldown } from 'rolldown';

const root = resolve(import.meta.dirname, '..');
rmSync(resolve(root, 'functions/lib'), { recursive: true, force: true });

const bundle = await rolldown({
  input: resolve(root, 'functions/src/index.ts'),
  platform: 'node',
  resolve: { alias: { '@': resolve(root, 'src') } },
  // The functions' own dependencies are installed by Cloud Build from functions/package.json.
  external: [/^firebase-admin/, /^firebase-functions/, /^satori/, /^@resvg\//, /^sharp/, /^node:/],
});
// A directory, not one file: the card renderer is its own chunk, loaded on the first image request (T50).
// Chunks sit next to index.js, so card.ts's `../fonts/` still resolves.
await bundle.write({
  dir: resolve(root, 'functions/lib'),
  entryFileNames: 'index.js',
  chunkFileNames: '[name]-[hash].js',
  // Smaller to load on a cold start (the game data is most of it); logs only need the messages.
  minify: true,
  format: 'esm',
});

mkdirSync(resolve(root, 'functions/fonts'), { recursive: true });
for (const [pkg, file] of [
  ['spectral', 'spectral-latin-400-normal.woff'],
  ['spectral', 'spectral-latin-600-normal.woff'],
  ['cinzel', 'cinzel-latin-700-normal.woff'],
]) {
  cpSync(
    resolve(root, `node_modules/@fontsource/${pkg}/files/${file}`),
    resolve(root, `functions/fonts/${file}`),
  );
}
console.log('functions built: functions/lib/index.js');
