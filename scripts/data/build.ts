#!/usr/bin/env node
// Game data pipeline (T7): the owner's Smithbox export → src/data/er/*.json + public/assets/icons/.
//
//   npm run data                         reads ~/Documents/soulsbuilds-gamedata (docs/game-data-extraction.md)
//   npm run data -- --export <dir>       another export folder
//   npm run data -- --force-icons        re-encode every icon (after a patch changes art)
//   npm run data -- --out <dir>          trial run: write <dir>/er/ and <dir>/icons/ instead
//
// Deterministic: running it twice on the same export changes nothing. Fails (exit 1) on schema errors,
// unresolved references, missing icons or anything extract.ts reports as a problem.
import { mkdirSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { DATA_FILES, tagsSchema } from '../../src/data/schema.ts';
import { readIcons, readParam, readText } from './export.ts';
import { extract, PARAM_NAMES, type GameData, type ParamName } from './extract.ts';
import { writeIcons } from './icons.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

/** One entry per line: compact, and a patch shows up as a readable diff. */
export function formatJson(value: unknown): string {
  if (Array.isArray(value))
    return `[\n${value.map((item) => `  ${JSON.stringify(item)}`).join(',\n')}\n]\n`;
  return `${JSON.stringify(value, null, 2)}\n`;
}

/** File name in src/data/er/ → its data. */
export function dataFiles(data: GameData): Record<keyof typeof DATA_FILES, unknown[]> {
  return {
    'affinities.json': data.affinities,
    'weaponTypes.json': data.weaponTypes,
    'skills.json': data.skills,
    'ashesOfWar.json': data.ashesOfWar,
    'weapons.json': data.weapons,
    'arrows.json': data.arrows,
    'armor.json': data.armor,
    'talismans.json': data.talismans,
    'spells.json': data.spells,
    'tears.json': data.tears,
    'consumables.json': data.consumables,
    'greatRunes.json': data.greatRunes,
    'spiritAshes.json': data.spiritAshes,
  };
}

/** Schema errors, duplicate IDs and unresolved references (the same rules as src/data/data.test.ts). */
export function validate(data: GameData): string[] {
  const errors: string[] = [];
  for (const [file, items] of Object.entries(dataFiles(data))) {
    const schema = DATA_FILES[file as keyof typeof DATA_FILES];
    const result = z.array(schema).safeParse(items);
    if (!result.success)
      errors.push(
        ...result.error.issues.slice(0, 10).map((i) => `${file} ${i.path.join('.')}: ${i.message}`),
      );
    const ids = (items as { id?: number; key?: string }[]).map((item) => item.id ?? item.key);
    const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
    if (duplicates.length)
      errors.push(`${file}: duplicate IDs ${[...new Set(duplicates)].join(', ')}`);
  }
  const tags = tagsSchema.safeParse(data.tags);
  if (!tags.success) errors.push(`tags.json: ${tags.error.issues[0]?.message}`);

  const skills = new Set(data.skills.map((skill) => skill.id));
  const types = new Set(data.weaponTypes.map((type) => type.id));
  for (const weapon of data.weapons) {
    if (weapon.skill !== null && !skills.has(weapon.skill))
      errors.push(`weapon ${weapon.id}: skill ${weapon.skill} not in skills.json`);
    if (!types.has(weapon.type)) errors.push(`weapon ${weapon.id}: type ${weapon.type} unknown`);
  }
  for (const arrow of data.arrows)
    if (!types.has(arrow.type)) errors.push(`arrow ${arrow.id}: type ${arrow.type} unknown`);
  for (const ash of data.ashesOfWar) {
    if (!skills.has(ash.skill)) errors.push(`ash of war ${ash.id}: skill ${ash.skill} unknown`);
    for (const type of ash.weaponTypes)
      if (!types.has(type)) errors.push(`ash of war ${ash.id}: type ${type} unknown`);
  }
  return errors;
}

/** Every icon ID an item in the data uses. */
export function usedIcons(data: GameData): Set<number> {
  const icons = new Set<number>();
  for (const items of Object.values(dataFiles(data)))
    for (const item of items as { icon?: number }[]) if (item.icon) icons.add(item.icon);
  return icons;
}

function parseArgs(argv: string[]) {
  const opts = {
    exportDir: join(homedir(), 'Documents', 'soulsbuilds-gamedata'),
    dataDir: join(ROOT, 'src', 'data', 'er'),
    iconDir: join(ROOT, 'public', 'assets', 'icons'),
    forceIcons: false,
  };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--export') opts.exportDir = resolve(argv[(i += 1)] ?? '');
    else if (argv[i] === '--out') {
      // Write somewhere else (a trial run): <dir>/er/ and <dir>/icons/.
      const out = resolve(argv[(i += 1)] ?? '');
      opts.dataDir = join(out, 'er');
      opts.iconDir = join(out, 'icons');
    } else if (argv[i] === '--force-icons') opts.forceIcons = true;
    else
      throw new Error(`Unknown option ${argv[i]} (use --export <dir>, --out <dir>, --force-icons)`);
  }
  return opts;
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  console.log(`Reading the export in ${opts.exportDir}`);
  const params = Object.fromEntries(
    PARAM_NAMES.map((name) => [name, readParam(join(opts.exportDir, 'params'), name)]),
  ) as Record<ParamName, ReturnType<typeof readParam>>;
  const text = readText(join(opts.exportDir, 'text'));
  const iconFiles = readIcons(join(opts.exportDir, 'icons'));

  const { data, problems, notes } = extract({ params, text });
  const errors = [...problems, ...validate(data)];

  for (const note of notes) console.log(`  · ${note}`);
  const counts = Object.entries(dataFiles(data)).map(([file, items]) => {
    const dlc = (items as { dlc?: boolean }[]).filter((item) => item.dlc).length;
    return `${file.replace('.json', '')} ${items.length}${dlc ? ` (${dlc} DLC)` : ''}`;
  });
  console.log(`\n${counts.join(' · ')}\n`);

  const missingIcons = [...usedIcons(data)].filter((icon) => !iconFiles.has(icon));
  if (missingIcons.length) errors.push(`icons missing from the export: ${missingIcons.join(', ')}`);
  if (errors.length) {
    console.error(`✗ ${errors.length} problem(s); nothing written:`);
    for (const error of errors) console.error(`  ✗ ${error}`);
    process.exit(1);
  }

  const outDir = opts.dataDir;
  mkdirSync(outDir, { recursive: true });
  for (const [file, items] of Object.entries(dataFiles(data)))
    writeFileSync(join(outDir, file), formatJson(items));
  writeFileSync(join(outDir, 'tags.json'), formatJson(data.tags));
  console.log(`✓ Wrote ${Object.keys(DATA_FILES).length + 1} files to ${outDir}`);

  const icons = await writeIcons(usedIcons(data), iconFiles, opts.iconDir, {
    force: opts.forceIcons,
    onProgress: (done, total) => process.stdout.write(`  icons ${done}/${total}\r`),
  });
  console.log(
    `✓ Icons: ${icons.written} written, ${icons.kept} unchanged, ${icons.removed} removed (${opts.iconDir})`,
  );
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error: unknown) => {
    console.error('✗', error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
