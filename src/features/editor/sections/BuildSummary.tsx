import { useId, useState } from 'react';
import styled from 'styled-components';
import Frame from '@/components/ui/Frame';
import ItemTile from '@/components/ui/ItemTile';
import Label from '@/components/ui/Label';
import SectionHeading from '@/components/ui/SectionHeading';
import Tooltip from '@/components/ui/Tooltip';
import { displayText } from '@/components/ui/typography';
import { useAppSelector } from '@/app/hooks';
import { iconUrl, type SlotDisplayItem } from '@/data/core';
import { MAX_STAT } from '@/lib/buildMath';
import {
  COLOR_ACCENT,
  COLOR_ACCENT_DEEP,
  COLOR_LINE,
  COLOR_TEXT,
  COLOR_TEXT_MUTED,
  SPACE_GROUP,
  SPACE_MD,
  SPACE_SM,
  SPACE_XS,
  TEXT_XS,
  TEXT_XXL,
} from '@/theme';
import { ARMOR_SLOTS, SPELL_SLOTS, TALISMAN_SLOTS, TEAR_SLOTS, WEAPON_SLOTS } from '../slots';
import { selectVitals } from '../store/derived';
import {
  selectEquipment,
  selectSpellSlots,
  selectStats,
  selectTearSlots,
} from '../store/selectors';
import { formatNumber, STATS } from './StatsCard';

/** One filled item of the summary: a tile that names itself on hover, focus or tap. */
function GearTile({ item }: { item: SlotDisplayItem }) {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [tapped, setTapped] = useState(false);
  return (
    <TileButton
      type="button"
      aria-label={item.name}
      onBlur={() => {
        setFocused(false);
        setTapped(false);
      }}
      onClick={() => setTapped(!tapped)}
      onFocus={(event) => setFocused(event.currentTarget.matches(':focus-visible'))}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          setHovered(false);
          setFocused(false);
          setTapped(false);
        }
      }}
      onPointerEnter={(event) => setHovered(event.pointerType === 'mouse')}
      onPointerLeave={() => setHovered(false)}>
      <ItemTile src={iconUrl(item.icon)} size={44} />
      <Tooltip open={hovered || focused || tapped}>{item.name}</Tooltip>
    </TileButton>
  );
}

/** A labelled row of tiles; left out when the build has none of them. */
function GearGroup({ title, items }: { title: string; items: (SlotDisplayItem | null)[] }) {
  const id = useId();
  const filled = items.filter((item): item is SlotDisplayItem => item !== null);
  if (filled.length === 0) return null;
  return (
    <Group>
      <Label as="h3" id={id}>
        {title}
      </Label>
      <Tiles aria-labelledby={id}>
        {filled.map((item, index) => (
          <li key={`${item.id}-${index}`}>
            <GearTile item={item} />
          </li>
        ))}
      </Tiles>
    </Group>
  );
}

/**
 * The build at a glance (T28), in the stats column of the tabs other than Loadout: the rune level,
 * the attributes, HP / FP / stamina, then the gear as icons only (filled slots, no names: each tile
 * names itself on hover, focus or tap). The Loadout tab has the full version.
 */
function BuildSummary({ level }: { level: number }) {
  const stats = useAppSelector(selectStats);
  const { hp, fp, stamina } = useAppSelector(selectVitals);
  const equipment = useAppSelector(selectEquipment);
  const spells = useAppSelector(selectSpellSlots);
  const tears = useAppSelector(selectTearSlots);
  // The right hand, then the left (the hero's main weapon first).
  const weapons = WEAPON_SLOTS.map((slot) => equipment[slot]);

  return (
    <Frame as="aside" aria-labelledby="summary-title">
      <Head>
        <SectionHeading id="summary-title">Stats</SectionHeading>
        <Level>
          <Label>Rune level</Label>
          <LevelValue>{level}</LevelValue>
        </Level>
      </Head>
      <Attributes aria-label="Attributes">
        {STATS.map(([key, name, short]) => (
          <Attribute key={key}>
            <AttributeName>
              <abbr title={name}>{short}</abbr>
            </AttributeName>
            <AttributeValue>{stats[key]}</AttributeValue>
            <Bar aria-hidden="true">
              <BarFill style={{ width: `${(stats[key] / MAX_STAT) * 100}%` }} />
            </Bar>
          </Attribute>
        ))}
      </Attributes>
      <Vitals>
        <div>
          <dt>HP</dt>
          <dd>{formatNumber(hp)}</dd>
        </div>
        <div>
          <dt>FP</dt>
          <dd>{formatNumber(fp)}</dd>
        </div>
        <div>
          <dt>Stamina</dt>
          <dd>{formatNumber(stamina)}</dd>
        </div>
      </Vitals>
      <Gear>
        <GearGroup title="Armaments" items={weapons} />
        <GearGroup title="Armor" items={ARMOR_SLOTS.map((slot) => equipment[slot])} />
        <GearGroup title="Talismans" items={TALISMAN_SLOTS.map((slot) => equipment[slot])} />
        <GearGroup title="Spells" items={SPELL_SLOTS.map((slot) => spells[slot])} />
        <GearGroup
          title="Tears, rune and ash"
          items={[
            ...TEAR_SLOTS.map((slot) => tears[slot]),
            equipment.greatRune,
            equipment.spiritAsh,
          ]}
        />
      </Gear>
    </Frame>
  );
}

const Head = styled.div`
  align-items: center;
  display: flex;
  gap: ${SPACE_MD};
  justify-content: space-between;

  h2 {
    margin: 0;
  }
`;

const Level = styled.p`
  align-items: baseline;
  display: flex;
  gap: ${SPACE_SM};
  margin: 0;
`;

const LevelValue = styled.span`
  ${displayText}
  color: ${COLOR_ACCENT};
  font-size: ${TEXT_XXL};
  font-variant-numeric: tabular-nums;
  line-height: 1;
`;

const ruled = `
  border-top: 1px solid ${COLOR_LINE};
  margin-top: ${SPACE_MD};
  padding-top: ${SPACE_MD};
`;

// 4 × 2 cells: the short name and value over a thin bar (the Stats card's phone layout).
const Attributes = styled.ul`
  ${ruled}
  display: grid;
  gap: ${SPACE_GROUP};
  grid-template-columns: repeat(4, minmax(0, 1fr));
  list-style: none;
  margin-bottom: 0;
  padding-left: 0;
`;

const Attribute = styled.li`
  align-items: baseline;
  display: grid;
  grid-template-areas: 'name value' 'bar bar';
  grid-template-columns: minmax(0, 1fr) auto;
  row-gap: ${SPACE_XS};
`;

const AttributeName = styled.span`
  color: ${COLOR_TEXT_MUTED};
  font-size: ${TEXT_XS};
  grid-area: name;

  abbr {
    text-decoration: none;
  }
`;

const AttributeValue = styled.span`
  font-size: 15px;
  font-variant-numeric: tabular-nums;
  font-weight: 600;
  grid-area: value;
`;

const Bar = styled.span`
  background: ${COLOR_LINE};
  border-radius: 2px;
  grid-area: bar;
  height: 3px;
  overflow: hidden;
`;

const BarFill = styled.span`
  background: linear-gradient(90deg, ${COLOR_ACCENT_DEEP}, ${COLOR_ACCENT});
  display: block;
  height: 100%;
  max-width: 100%;
`;

const Vitals = styled.dl`
  display: grid;
  gap: ${SPACE_GROUP};
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin: ${SPACE_MD} 0 0;

  dt {
    color: ${COLOR_TEXT_MUTED};
    font-size: ${TEXT_XS};
  }

  dd {
    color: ${COLOR_TEXT};
    font-size: 17px;
    font-variant-numeric: tabular-nums;
    font-weight: 600;
    margin: 0;
  }
`;

const Gear = styled.div`
  ${ruled}
  display: grid;
  gap: ${SPACE_GROUP};

  &:empty {
    display: none;
  }
`;

const Group = styled.section`
  display: grid;
  gap: 6px;
`;

const Tiles = styled.ul`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  list-style: none;
  margin: 0;
  padding: 0;
`;

// The tile is the whole button; the tooltip is positioned against it.
const TileButton = styled.button`
  background: none;
  border: 0;
  cursor: default;
  display: block;
  padding: 0;
  position: relative;

  & > span:first-child {
    display: flex;
  }
`;

export default BuildSummary;
