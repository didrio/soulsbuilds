// Converts the exported icon PNGs the data uses into public/assets/icons/<iconId>.webp.
import { existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { availableParallelism } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';

/** 2× the largest slot (80 px in src/features/editor/Slot.tsx). */
export const ICON_SIZE = 160;
const WEBP = { quality: 82, effort: 4 } as const;

export interface IconResult {
  written: number;
  kept: number;
  removed: number;
  missing: number[];
}

/**
 * Writes one WebP per icon ID in `used`. Existing files are kept unless `force` (re-run with --force
 * after a game patch changes art); files for icons no longer used are deleted.
 */
export async function writeIcons(
  used: Set<number>,
  sources: Map<number, string>,
  outDir: string,
  {
    force = false,
    onProgress,
  }: { force?: boolean; onProgress?: (done: number, total: number) => void } = {},
): Promise<IconResult> {
  mkdirSync(outDir, { recursive: true });
  const result: IconResult = { written: 0, kept: 0, removed: 0, missing: [] };
  for (const file of readdirSync(outDir)) {
    const iconId = Number(file.replace(/\.webp$/, ''));
    if (!used.has(iconId)) {
      rmSync(join(outDir, file));
      result.removed += 1;
    }
  }
  const todo: [number, string, string][] = [];
  for (const iconId of [...used].sort((a, b) => a - b)) {
    const source = sources.get(iconId);
    const target = join(outDir, `${iconId}.webp`);
    if (!source) result.missing.push(iconId);
    else if (!force && existsSync(target)) result.kept += 1;
    else todo.push([iconId, source, target]);
  }
  // The 1024 px PNG decode dominates and is single-threaded per image: convert several at once.
  const workers = Math.max(1, availableParallelism() - 1);
  let next = 0;
  await Promise.all(
    Array.from({ length: workers }, async () => {
      while (next < todo.length) {
        const [, source, target] = todo[next++]!;
        await sharp(source)
          .resize(ICON_SIZE, ICON_SIZE, {
            fit: 'contain',
            background: { r: 0, g: 0, b: 0, alpha: 0 },
          })
          .webp(WEBP)
          .toFile(target);
        result.written += 1;
        if (onProgress && result.written % 100 === 0) onProgress(result.written, todo.length);
      }
    }),
  );
  return result;
}
