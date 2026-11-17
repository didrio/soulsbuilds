import { useState } from 'react';
import styled from 'styled-components';
import { useMediaQuery } from '@/app/useMediaQuery';
import Button from '@/components/ui/Button';
import Dialog from '@/components/ui/Dialog';
import { CloseIcon, FilterIcon } from '@/components/ui/icons';
import Popover from '@/components/ui/Popover';
import { TextButton } from '@/components/ui/TextButton';
import VisuallyHidden from '@/components/ui/VisuallyHidden';
import { labelText } from '@/components/ui/typography';
import { weaponBySlug, tagLabel } from '@/lib/hubs';
import type { GameStats } from '@/lib/models';
import {
  BELOW_MOBILE,
  COLOR_ACCENT,
  COLOR_LINE,
  COLOR_LINE_STRONG,
  COLOR_ON_ACCENT,
  COLOR_SURFACE_RAISED,
  COLOR_TEXT,
  COLOR_TEXT_MUTED,
  SPACE_LG,
  SPACE_SM,
  TEXT_SM,
  TEXT_XS,
} from '@/theme';
import { LevelOptions, SortOptions, sortLabel, TagOptions, WeaponOptions } from './FilterControls';
import { activeFilters, DEFAULT_FILTERS, levelText, topTags, type BuildFilters } from './filters';

interface FilterBarProps {
  filters: BuildFilters;
  onChange: (next: Partial<BuildFilters>) => void;
  stats: GameStats | null | undefined;
  /** "12 builds", or empty while loading. */
  countText: string;
}

/**
 * The builds page's filters in one line (T74): Sort, Level, Tags and Weapon as buttons with popovers,
 * then the active filters as removable chips with Clear, and the result count. Phones: one Filters
 * button (with how many are on) that opens a sheet with the same choices; the chips stay under it.
 */
function FilterBar({ filters, onChange, stats, countText }: FilterBarProps) {
  const phone = useMediaQuery(BELOW_MOBILE);
  const [sheet, setSheet] = useState(false);
  const top = stats ? topTags(stats.tagCounts, 12) : [];
  const active = activeFilters(filters);
  const clear = () =>
    onChange({
      tags: [],
      weapon: '',
      minLevel: DEFAULT_FILTERS.minLevel,
      maxLevel: DEFAULT_FILTERS.maxLevel,
    });
  const weapon = filters.weapon ? weaponBySlug(filters.weapon) : undefined;

  const chips = active.length ? (
    <Active>
      {active.map((filter) => (
        <Chip key={filter.key} type="button" onClick={() => onChange(filter.without)}>
          {filter.label}
          <CloseIcon size={14} />
          <VisuallyHidden> (remove)</VisuallyHidden>
        </Chip>
      ))}
      <TextButton onClick={clear}>Clear</TextButton>
    </Active>
  ) : null;

  if (phone) {
    return (
      <>
        <Line>
          <Button variant="secondary" aria-haspopup="dialog" onClick={() => setSheet(true)}>
            <FilterIcon />
            Filters
            {active.length ? (
              <Badge>
                {active.length}
                <VisuallyHidden> on</VisuallyHidden>
              </Badge>
            ) : null}
          </Button>
          {chips}
        </Line>
        <Count aria-live="polite">
          {countText ? `${countText} · ${sortLabel(filters.sort).toLowerCase()} first` : ''}
        </Count>
        {sheet ? (
          <Dialog title="Filters" onClose={() => setSheet(false)} tall>
            <Sheet>
              <Section aria-label="Sort">
                <SectionLabel>Sort</SectionLabel>
                <SortOptions value={filters.sort} onChange={onChange} />
              </Section>
              <Section aria-label="Level">
                <SectionLabel>Level</SectionLabel>
                <LevelOptions filters={filters} onChange={onChange} />
              </Section>
              <Section aria-label="Tags">
                <SectionLabel>Tags</SectionLabel>
                <TagOptions filters={filters} top={top} onChange={onChange} />
              </Section>
              <Section aria-label="Weapon">
                <SectionLabel>Weapon</SectionLabel>
                <WeaponOptions
                  filters={filters}
                  weaponCounts={stats?.weaponCounts}
                  onChange={onChange}
                />
              </Section>
            </Sheet>
            <SheetFooter>
              {active.length ? <TextButton onClick={clear}>Clear all</TextButton> : null}
              <Button onClick={() => setSheet(false)}>
                {countText ? `Show ${countText}` : 'Show builds'}
              </Button>
            </SheetFooter>
          </Dialog>
        ) : null}
      </>
    );
  }

  return (
    <Line>
      <Popover label="Sort" value={sortLabel(filters.sort)}>
        {(close) => (
          <SortOptions
            value={filters.sort}
            onChange={(next) => {
              onChange(next);
              close();
            }}
          />
        )}
      </Popover>
      <Popover
        label="Level"
        value={levelText(filters)}
        active={filters.minLevel !== 1 || filters.maxLevel !== DEFAULT_FILTERS.maxLevel}>
        {() => <LevelOptions filters={filters} onChange={onChange} />}
      </Popover>
      <Popover
        label="Tags"
        value={tagsText(filters.tags)}
        active={filters.tags.length > 0}
        width={360}>
        {() => <TagOptions filters={filters} top={top} onChange={onChange} />}
      </Popover>
      <Popover label="Weapon" value={weapon?.name ?? 'Any'} active={Boolean(weapon)} width={320}>
        {(close) => (
          <WeaponOptions
            filters={filters}
            weaponCounts={stats?.weaponCounts}
            onChange={(next) => {
              onChange(next);
              close();
            }}
          />
        )}
      </Popover>
      {chips ? <Divider aria-hidden="true" /> : null}
      {chips}
      <Count aria-live="polite">{countText}</Count>
    </Line>
  );
}

/** "Any", "Bleed", "Bleed +2". */
function tagsText(tags: string[]): string {
  if (!tags.length) return 'Any';
  return tags.length === 1 ? tagLabel(tags[0]!) : `${tagLabel(tags[0]!)} +${tags.length - 1}`;
}

const Line = styled.div`
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: ${SPACE_SM};
  margin-top: ${SPACE_SM};
`;

const Active = styled.div`
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const Chip = styled.button`
  align-items: center;
  background: ${COLOR_SURFACE_RAISED};
  border: 1px solid ${COLOR_LINE_STRONG};
  border-radius: 22px;
  color: ${COLOR_TEXT};
  cursor: pointer;
  display: inline-flex;
  font: inherit;
  font-size: ${TEXT_SM};
  font-weight: 500;
  gap: 6px;
  min-height: 44px;
  padding: 0 10px 0 14px;
  white-space: nowrap;

  & > svg {
    color: ${COLOR_TEXT_MUTED};
  }

  &:hover > svg {
    color: ${COLOR_TEXT};
  }
`;

const Divider = styled.span`
  align-self: stretch;
  background: ${COLOR_LINE};
  margin: 8px 4px;
  width: 1px;
`;

const Count = styled.p`
  color: ${COLOR_TEXT_MUTED};
  font-size: ${TEXT_SM};
  font-variant-numeric: tabular-nums;
  margin: 0 0 0 auto;

  @media ${BELOW_MOBILE} {
    margin: ${SPACE_SM} 0 0;
  }
`;

const Badge = styled.span`
  align-items: center;
  background: ${COLOR_ACCENT};
  border-radius: 10px;
  color: ${COLOR_ON_ACCENT};
  display: inline-flex;
  font-size: ${TEXT_XS};
  font-weight: 700;
  height: 20px;
  justify-content: center;
  min-width: 20px;
`;

const Sheet = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: ${SPACE_LG};
  min-height: 0;
  overflow-y: auto;
`;

const Section = styled.section`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const SectionLabel = styled.h3`
  ${labelText}
  margin: 0;
`;

const SheetFooter = styled.div`
  align-items: center;
  border-top: 1px solid ${COLOR_LINE};
  display: flex;
  gap: ${SPACE_SM};
  justify-content: flex-end;
  padding-top: ${SPACE_SM};
`;

export default FilterBar;
