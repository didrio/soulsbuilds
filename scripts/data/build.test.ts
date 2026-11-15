// @vitest-environment node
import { existsSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';
import { afterEach, describe, expect, it } from 'vitest';
import { formatJson, usedIcons, validate } from './build.ts';
import { extract } from './extract.ts';
import { ICON_SIZE, writeIcons } from './icons.ts';
import { fixtureExport } from './test-fixtures.ts';

describe('build helpers', () => {
  it('formats arrays one entry per line, objects indented', () => {
    expect(formatJson([{ id: 1 }, { id: 2 }])).toBe('[\n  {"id":1},\n  {"id":2}\n]\n');
    expect(formatJson({ a: ['x'] })).toBe('{\n  "a": [\n    "x"\n  ]\n}\n');
  });

  it('validate() reports duplicate IDs, unresolved skills and schema errors', () => {
    const { data } = extract(fixtureExport());
    data.weapons.push({ ...data.weapons[0]!, skill: 999 });
    data.talismans[0]!.name = '';
    const errors = validate(data);
    expect(errors).toContain('weapons.json: duplicate IDs 1000000');
    expect(errors).toContain('weapon 1000000: skill 999 not in skills.json');
    expect(errors.some((e) => e.startsWith('talismans.json 0.name'))).toBe(true);
  });

  it('collects every icon the data uses', () => {
    const icons = usedIcons(extract(fixtureExport()).data);
    expect([...icons].sort((a, b) => a - b)).toEqual([
      1, 2, 3, 4, 5, 10, 13, 20, 21, 30, 40, 41, 42, 43, 44, 45, 48,
    ]);
  });
});

describe('writeIcons', () => {
  let dir: string;
  afterEach(() => rmSync(dir, { recursive: true, force: true }));

  it('writes square WebPs for used icons, keeps existing ones, removes unused, lists missing', async () => {
    dir = mkdtempSync(join(tmpdir(), 'icons-'));
    const source = join(dir, 'MENU_Knowledge_00001.png');
    await sharp({
      create: {
        width: 256,
        height: 200,
        channels: 4,
        background: { r: 200, g: 150, b: 0, alpha: 1 },
      },
    })
      .png()
      .toFile(source);
    const out = join(dir, 'out');
    const first = await writeIcons(new Set([1, 2]), new Map([[1, source]]), out);
    expect(first).toEqual({ written: 1, kept: 0, removed: 0, missing: [2] });
    const meta = await sharp(join(out, '1.webp')).metadata();
    expect([meta.format, meta.width, meta.height]).toEqual(['webp', ICON_SIZE, ICON_SIZE]);

    writeFileSync(join(out, '7.webp'), '');
    const second = await writeIcons(new Set([1]), new Map([[1, source]]), out);
    expect(second).toEqual({ written: 0, kept: 1, removed: 1, missing: [] });
    expect(readdirSync(out)).toEqual(['1.webp']);
    expect(existsSync(join(out, '7.webp'))).toBe(false);
  });
});
