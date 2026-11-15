// @vitest-environment node
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { num, parseParamCsv, parseTextDump, readIcons, readText } from './export.ts';

describe('parseParamCsv', () => {
  it('reads rows by ID, columns from the header (BOM and CRLF tolerated)', () => {
    const param = parseParamCsv('﻿ID,Name,weight,iconId\r\n1000000,Dagger,1.5,1\r\n10,,0,0\r\n');
    expect([...param.keys()]).toEqual([1000000, 10]);
    expect(param.get(1000000)).toEqual({
      ID: '1000000',
      Name: 'Dagger',
      weight: '1.5',
      iconId: '1',
    });
    expect(num(param.get(1000000)!, 'weight')).toBe(1.5);
  });

  it('joins a row name that contains the delimiter back together', () => {
    const param = parseParamCsv('ID,Name,weight\n5,Flame, Grant Me Strength,0.5');
    expect(param.get(5)).toMatchObject({ Name: 'Flame, Grant Me Strength', weight: '0.5' });
  });

  it('detects another delimiter from the header', () => {
    expect(parseParamCsv('ID;Name;weight\n5;A, B;2').get(5)).toMatchObject({ Name: 'A, B' });
  });

  it('rejects files that are not Smithbox param CSVs or rows that are short', () => {
    expect(() => parseParamCsv('foo,bar\n1,2')).toThrow('Not a Smithbox param CSV');
    expect(() => parseParamCsv('ID,Name,a,b\n1,x,2')).toThrow('Row has 3 cells, header has 4');
  });

  it('num() throws on a missing column or a non-number', () => {
    const row = { ID: '1', a: 'x' };
    expect(() => num(row, 'b')).toThrow('Column b missing (row 1)');
    expect(() => num(row, 'a')).toThrow('Column a is not a number: x');
  });
});

describe('parseTextDump', () => {
  it('reads id;text lines and joins continuation lines into the previous entry', () => {
    const entries = parseTextDump('10;Dagger\n11;A dagger.\nIt cuts.\n12;\n13;Semi;colon');
    expect([...entries]).toEqual([
      [10, 'Dagger'],
      [11, 'A dagger.\nIt cuts.'],
      [12, ''],
      [13, 'Semi;colon'],
    ]);
  });
});

describe('readText and readIcons', () => {
  let dir: string;
  afterEach(() => rmSync(dir, { recursive: true, force: true }));

  it('indexes English FMGs by name, applies DLC files last and skips placeholders', () => {
    dir = mkdtempSync(join(tmpdir(), 'text-'));
    const item = join(dir, 'msg', 'engus', 'item');
    mkdirSync(item, { recursive: true });
    mkdirSync(join(dir, 'msg', 'jpnjp', 'item'), { recursive: true });
    writeFileSync(join(item, '11 - WeaponName.txt'), '1;Dagger\n2;%null%\n3;Old name\n4;');
    writeFileSync(join(item, '310 - WeaponName_dlc01.fmg.txt'), '3;New name');
    writeFileSync(join(item, '410 - WeaponName_dlc02.txt'), '5;Milady');
    writeFileSync(join(dir, 'msg', 'jpnjp', 'item', '11 - WeaponName.txt'), '1;ダガー');
    const names = readText(dir).get('WeaponName')!;
    expect([...names]).toEqual([
      [1, { text: 'Dagger', dlc: 0 }],
      [3, { text: 'New name', dlc: 1 }],
      [5, { text: 'Milady', dlc: 2 }],
    ]);
  });

  it('indexes icons by the number in MENU_Knowledge_<n>, ignoring other textures', () => {
    dir = mkdtempSync(join(tmpdir(), 'icons-'));
    writeFileSync(join(dir, 'MENU_Knowledge_00042.png'), '');
    writeFileSync(join(dir, 'MENU_Other_00043.png'), '');
    expect([...readIcons(dir).keys()]).toEqual([42]);
  });
});
