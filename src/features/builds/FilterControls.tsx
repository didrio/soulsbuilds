// The builds page's filter choices (T74), shared by the desktop popovers and the phone sheet: Sort, Level
// (presets + custom), Tags (the most used + all), Weapon (those in builds, findable by name).
import { useState, type FormEvent } from 'react';
import styled from 'styled-components';
import { LEVEL_BAND_COLORS } from '@/components/ui/LevelNumber';
import Chips from '@/components/ui/Chips';
import TextInput from '@/components/ui/TextInput';
import VisuallyHidden from '@/components/ui/VisuallyHidden';
import { labelText } from '@/components/ui/typography';
import { getCardWeapon, iconUrl } from '@/data/core';
import ItemTile from '@/components/ui/ItemTile';
import type { BuildSort } from '@/lib/firebase';
import { tagLabel, weaponSlug } from '@/lib/hubs';
import {
  COLOR_ACCENT,
  COLOR_BG,
  COLOR_LINE,
  COLOR_SURFACE,
  COLOR_TEXT,
  COLOR_TEXT_MUTED,
  RADIUS_FRAME,
  TEXT_MD,
  TEXT_SM,
  TEXT_XS,
} from '@/theme';
import { clampLevel, LEVEL_PRESETS, levelPreset, toggleTag, type BuildFilters } from './filters';
import { matchesWords, words } from './search';

type Change = (next: Partial<BuildFilters>) => void;

export const SORTS = [
  { value: 'top', label: 'Most liked' },
  { value: 'new', label: 'Newest' },
  { value: 'played', label: 'Most played' },
] as const satisfies readonly { value: BuildSort; label: string }[];

export const sortLabel = (sort: BuildSort) => SORTS.find((s) => s.value === sort)?.label ?? '';

/** The sort as a short list of choices. */
export function SortOptions({ value, onChange }: { value: BuildSort; onChange: Change }) {
  return (
    <Options role="group" aria-label="Sort">
      {SORTS.map((sort) => (
        <Option
          key={sort.value}
          type="button"
          aria-pressed={value === sort.value}
          onClick={() => onChange({ sort: sort.value })}>
          <Dot aria-hidden="true" />
          {sort.label}
        </Option>
      ))}
    </Options>
  );
}

/** The level presets, then a custom range (applied on Enter or leaving a field). */
export function LevelOptions({ filters, onChange }: { filters: BuildFilters; onChange: Change }) {
  const preset = levelPreset(filters);
  const [minText, setMinText] = useState(String(filters.minLevel));
  const [maxText, setMaxText] = useState(String(filters.maxLevel));

  const applyCustom = (event?: FormEvent) => {
    event?.preventDefault();
    let min = clampLevel(minText, 1);
    let max = clampLevel(maxText, filters.maxLevel);
    if (min > max) [min, max] = [max, min];
    setMinText(String(min));
    setMaxText(String(max));
    onChange({ minLevel: min, maxLevel: max });
  };

  return (
    <>
      <Options role="group" aria-label="Level">
        {LEVEL_PRESETS.map((option) => (
          <Option
            key={option.label}
            type="button"
            aria-pressed={preset === option}
            onClick={() => {
              setMinText(String(option.minLevel));
              setMaxText(String(option.maxLevel));
              onChange({ minLevel: option.minLevel, maxLevel: option.maxLevel });
            }}>
            <Dot
              aria-hidden="true"
              style={option.band ? { background: LEVEL_BAND_COLORS[option.band] } : undefined}
            />
            {option.label}
            {option.note ? <Note>{option.note}</Note> : null}
          </Option>
        ))}
      </Options>
      <Custom onSubmit={applyCustom} aria-label="Custom level range">
        <CustomLabel>Custom</CustomLabel>
        <LevelInput>
          <TextInput
            aria-label="Minimum level"
            centered
            inputMode="numeric"
            onBlur={() => applyCustom()}
            onChange={setMinText}
            value={minText}
          />
        </LevelInput>
        <Dash aria-hidden="true">–</Dash>
        <LevelInput>
          <TextInput
            aria-label="Maximum level"
            centered
            inputMode="numeric"
            onBlur={() => applyCustom()}
            onChange={setMaxText}
            value={maxText}
          />
        </LevelInput>
        {/* Enter submits; the button keeps the form valid for assistive tech. */}
        <VisuallyHidden as="button" type="submit">
          Apply level range
        </VisuallyHidden>
      </Custom>
    </>
  );
}

/** The most used tags as toggles with their build counts, then the full tag picker. */
export function TagOptions({
  filters,
  top,
  onChange,
}: {
  filters: BuildFilters;
  top: { tag: string; count: number }[];
  onChange: Change;
}) {
  const topNames = new Set(top.map(({ tag }) => tag));
  return (
    <>
      {top.length ? (
        <Toggles role="group" aria-label="Most used tags">
          {top.map(({ tag, count }) => (
            <Toggle
              key={tag}
              type="button"
              aria-pressed={filters.tags.includes(tag)}
              onClick={() => onChange({ tags: toggleTag(filters.tags, tag) })}>
              {tagLabel(tag)}
              <Count>
                {count}
                <VisuallyHidden>{count === 1 ? ' build' : ' builds'}</VisuallyHidden>
              </Count>
            </Toggle>
          ))}
        </Toggles>
      ) : null}
      <MoreTags>
        <Chips
          addLabel={top.length ? 'More tags' : 'Add tag'}
          onAdd={(tag) => onChange({ tags: [...new Set([...filters.tags, tag])] })}
          onRemove={(tag) => onChange({ tags: filters.tags.filter((t) => t !== tag) })}
          values={filters.tags.filter((tag) => !topNames.has(tag))}
        />
      </MoreTags>
    </>
  );
}

/** How many weapons the list shows before the find box narrows it. */
const WEAPONS_SHOWN = 8;

/** The weapons builds use (most used first), findable by name; picking one filters by it. */
export function WeaponOptions({
  filters,
  weaponCounts,
  onChange,
}: {
  filters: BuildFilters;
  weaponCounts: Record<string, number> | undefined;
  onChange: Change;
}) {
  const [find, setFind] = useState('');
  const query = words(find);
  const weapons = Object.entries(weaponCounts ?? {})
    .flatMap(([id, count]) => {
      const weapon = getCardWeapon(Number(id));
      return weapon ? [{ weapon, count, slug: weaponSlug(weapon.name) }] : [];
    })
    .filter(({ weapon }) => matchesWords(query, words(weapon.name)))
    .sort((a, b) => b.count - a.count || a.weapon.name.localeCompare(b.weapon.name));
  const shown = query.length ? weapons : weapons.slice(0, WEAPONS_SHOWN);

  return (
    <>
      <TextInput
        aria-label="Find a weapon"
        placeholder="Find a weapon"
        onChange={setFind}
        value={find}
        type="search"
      />
      <Options role="group" aria-label="Weapon">
        <Option
          type="button"
          aria-pressed={!filters.weapon}
          onClick={() => onChange({ weapon: '' })}>
          <Dot aria-hidden="true" />
          Any weapon
        </Option>
        {shown.map(({ weapon, count, slug }) => (
          <Option
            key={weapon.id}
            type="button"
            aria-pressed={filters.weapon === slug}
            onClick={() => onChange({ weapon: slug })}>
            <ItemTile src={iconUrl(weapon.icon)} size={28} />
            {weapon.name}
            <Note>
              {count}
              <VisuallyHidden>{count === 1 ? ' build' : ' builds'}</VisuallyHidden>
            </Note>
          </Option>
        ))}
        {query.length && !weapons.length ? (
          <Empty>No build uses a weapon by that name</Empty>
        ) : null}
      </Options>
    </>
  );
}

const Options = styled.div`
  display: flex;
  flex-direction: column;
`;

const Dot = styled.span`
  border: 1px solid ${COLOR_TEXT_MUTED};
  border-radius: 50%;
  box-sizing: border-box;
  flex: none;
  height: 14px;
  width: 14px;
`;

const Option = styled.button`
  align-items: center;
  background: none;
  border: 0;
  border-radius: ${RADIUS_FRAME};
  color: ${COLOR_TEXT};
  cursor: pointer;
  display: flex;
  font: inherit;
  font-size: ${TEXT_MD};
  gap: 10px;
  min-height: 44px;
  padding: 0 10px;
  text-align: left;
  width: 100%;

  &:hover {
    background: ${COLOR_SURFACE};
  }

  /* Each band's dot is filled with its color (T79); the chosen one gets the accent ring. */
  &[aria-pressed='true'] ${Dot} {
    border: 2px solid ${COLOR_ACCENT};
    box-shadow: 0 0 0 2px ${COLOR_BG};
  }

  &[aria-pressed='true'] {
    font-weight: 600;
  }
`;

const Note = styled.span`
  color: ${COLOR_TEXT_MUTED};
  font-size: ${TEXT_SM};
  font-weight: 400;
  margin-left: auto;
`;

const Empty = styled.p`
  color: ${COLOR_TEXT_MUTED};
  font-size: ${TEXT_SM};
  margin: 0;
  padding: 10px;
`;

const Custom = styled.form`
  align-items: center;
  border-top: 1px solid ${COLOR_LINE};
  display: flex;
  gap: 8px;
  margin: 6px 0 0;
  padding: 10px 10px 4px;
`;

const CustomLabel = styled.span`
  ${labelText}
  margin-right: auto;
`;

const LevelInput = styled.div`
  width: 72px;
`;

const Dash = styled.span`
  color: ${COLOR_TEXT_MUTED};
`;

const Toggles = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 4px;
`;

const Toggle = styled.button`
  align-items: center;
  background: ${COLOR_SURFACE};
  border: 1px solid ${COLOR_LINE};
  border-radius: ${RADIUS_FRAME};
  color: ${COLOR_TEXT};
  cursor: pointer;
  display: inline-flex;
  font: inherit;
  font-size: ${TEXT_SM};
  font-weight: 500;
  gap: 6px;
  min-height: 44px;
  padding: 0 12px;

  &[aria-pressed='true'] {
    border-color: ${COLOR_ACCENT};
  }
`;

const Count = styled.span`
  color: ${COLOR_TEXT_MUTED};
  font-size: ${TEXT_XS};
  font-variant-numeric: tabular-nums;
`;

const MoreTags = styled.div`
  padding: 8px 4px 4px;
`;
