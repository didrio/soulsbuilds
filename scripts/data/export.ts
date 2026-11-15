// Reads the owner's Smithbox export (docs/game-data-extraction.md): params as CSV, the text dump, and
// icon images. Pure file reading; what the rows mean is extract.ts's job.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { basename, join } from 'node:path';

/** One param row: column name → raw cell text. */
export type Row = Record<string, string>;
/** A param: row ID → row, in file order. */
export type Param = Map<number, Row>;

/**
 * Parses one CSV that Smithbox wrote (`ID,Name,<fields>`). Smithbox doesn't quote cells, so a comma in
 * the community row name splits it: the surplus cells are joined back into Name (every other column is
 * a number). The delimiter is whatever follows `ID` on the header line.
 */
export function parseParamCsv(text: string): Param {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/);
  const header = lines[0] ?? '';
  const delimiter = header.match(/^ID(.)/)?.[1];
  if (!delimiter) throw new Error(`Not a Smithbox param CSV (header: ${header.slice(0, 40)})`);
  const columns = header.split(delimiter);
  const nameIndex = columns.indexOf('Name');
  const param: Param = new Map();
  for (const line of lines.slice(1)) {
    if (!line.trim()) continue;
    let cells = line.split(delimiter);
    const surplus = cells.length - columns.length;
    if (surplus > 0 && nameIndex >= 0) {
      cells = [
        ...cells.slice(0, nameIndex),
        cells.slice(nameIndex, nameIndex + surplus + 1).join(delimiter),
        ...cells.slice(nameIndex + surplus + 1),
      ];
    }
    if (cells.length !== columns.length)
      throw new Error(`Row has ${cells.length} cells, header has ${columns.length}: ${line}`);
    const row: Row = {};
    columns.forEach((column, i) => (row[column] = cells[i] ?? ''));
    param.set(Number(row.ID), row);
  }
  return param;
}

/** Reads `<dir>/<name>.csv`. */
export function readParam(dir: string, name: string): Param {
  const file = join(dir, `${name}.csv`);
  if (!existsSync(file)) throw new Error(`Missing ${file}: re-export all params (guide step 2)`);
  return parseParamCsv(readFileSync(file, 'utf8'));
}

/** A number cell; throws on a missing column so a renamed field can't silently become 0. */
export function num(row: Row, column: string): number {
  const value = row[column];
  if (value === undefined) throw new Error(`Column ${column} missing (row ${row.ID})`);
  const number = Number(value);
  if (!Number.isFinite(number)) throw new Error(`Column ${column} is not a number: ${value}`);
  return number;
}

/** Text of one FMG entry and which part of the game it came from (0 = base, 1/2 = DLC files). */
export interface TextEntry {
  text: string;
  dlc: number;
}
/** FMG name without the `_dlc0N` suffix (e.g. `WeaponName`) → entry ID → text. */
export type TextIndex = Map<string, Map<number, TextEntry>>;

/** Text the game uses for unused entries (the DLC files also hold "DLC dummy" for some base IDs). */
const isPlaceholder = (text: string) =>
  !text.trim() || /^%null%$|^\[ERROR\]|^(DLC )?dummy$/i.test(text.trim());

/**
 * Parses one file of Smithbox's text dump: `id;text` lines, where a line that doesn't start with
 * `<digits>;` continues the previous entry's text (descriptions span lines).
 */
export function parseTextDump(content: string): Map<number, string> {
  const entries = new Map<number, string>();
  let current: number | null = null;
  for (const line of content.replace(/^\uFEFF/, '').split(/\r?\n/)) {
    const match = line.match(/^(\d+);(.*)$/);
    if (match) {
      current = Number(match[1]);
      entries.set(current, match[2] ?? '');
    } else if (current !== null) {
      entries.set(current, `${entries.get(current)}\n${line}`);
    }
  }
  return entries;
}

function filesUnder(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    return statSync(path).isDirectory() ? filesUnder(path) : [path];
  });
}

/**
 * Indexes the English text of the dump (the `engus` folder anywhere under `dir`). Files are named
 * `<fmg id> - <FmgName>[_dlc01|_dlc02].fmg.txt` (Smithbox 2.2.6; `.fmg` optional). DLC files are
 * applied after the base ones, so a DLC entry wins over a base entry with the same ID. Placeholder and
 * empty entries are skipped.
 */
export function readText(dir: string, language = 'engus'): TextIndex {
  const files = filesUnder(dir).filter((file) =>
    file.split(/[\\/]/).some((part) => part.toLowerCase() === language),
  );
  if (!files.length) throw new Error(`No ${language} text under ${dir} (guide step 3)`);
  const parsed = files.flatMap((file) => {
    const match = basename(file).match(/^\d+ - (.+?)(?:_dlc0?(\d))?(?:\.fmg)?\.txt$/i);
    if (!match?.[1]) return [];
    return [{ file, fmg: match[1], dlc: Number(match[2] ?? 0) }];
  });
  parsed.sort((a, b) => a.dlc - b.dlc || a.file.localeCompare(b.file));
  const index: TextIndex = new Map();
  for (const { file, fmg, dlc } of parsed) {
    if (!index.has(fmg)) index.set(fmg, new Map());
    const entries = index.get(fmg)!;
    for (const [id, text] of parseTextDump(readFileSync(file, 'utf8'))) {
      if (!isPlaceholder(text)) entries.set(id, { text: text.trim(), dlc });
    }
  }
  return index;
}

/** Icon ID → image file. The ID is the number at the end of the texture name (`MENU_Knowledge_00001`). */
export function readIcons(dir: string): Map<number, string> {
  const icons = new Map<number, string>();
  for (const file of filesUnder(dir).sort()) {
    const match = basename(file).match(/^MENU_Knowledge_(\d+)\.(png|webp)$/i);
    if (match) icons.set(Number(match[1]), file);
  }
  if (!icons.size) {
    const samples = filesUnder(dir)
      .slice(0, 5)
      .map((file) => basename(file));
    throw new Error(
      `No MENU_Knowledge_<id>.png icons under ${dir} (guide step 4). Found e.g.: ${samples.join(', ') || 'nothing'}`,
    );
  }
  return icons;
}
