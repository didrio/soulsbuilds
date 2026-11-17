import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import styled from 'styled-components';
import ItemTile from '@/components/ui/ItemTile';
import Label from '@/components/ui/Label';
import VisuallyHidden from '@/components/ui/VisuallyHidden';
import { panel } from '@/components/ui/inWorld';
import { useAppSelector } from '@/app/hooks';
import { iconUrl, type SlotDisplayItem } from '@/data/core';
import { firstParagraph } from '@/lib/markdown';
import type { Build } from '@/lib/models';
import { trackedItems } from '@/lib/tracking';
import {
  COLOR_ACCENT,
  COLOR_DANGER,
  COLOR_TEXT,
  COLOR_TEXT_MUTED,
  SPACE_GROUP,
  TEXT_XS,
} from '@/theme';
import type { BuildTracking } from '@/features/tracking/useBuildTracking';
import { loadRoute } from '../guide/GuideSection';
import ItemRow from '../ItemRow';
import { useLatestComment } from '../queries';
import { selectGearState } from '../store/derived';
import { selectStats } from '../store/selectors';
import { tabPath, type BuildTab } from '../tabs';
import {
  commentsGlance,
  guideGlance,
  phoneGearSections,
  statsGlance,
  type PhoneGearKey,
  type PhoneGearSection,
} from './glances';
import PhoneSection from './PhoneSection';
import StatsCard from './StatsCard';

type SectionKey = 'stats' | PhoneGearKey | Exclude<BuildTab, 'equipment'> | 'description';

/** The section a tab opens: Equipment is the gear sections, the weapons first. */
const sectionFor = (tab: BuildTab): SectionKey => (tab === 'equipment' ? 'weapons' : tab);

/** The id of a section's header, to scroll to (one build page at a time). */
const sectionAnchor = (key: SectionKey) => `section-${key}`;

/** Icons a closed gear header shows before "+N". */
const MAX_ICONS = 7;

interface BuildSectionsProps {
  /** `/build/:id` segment (`new` while creating). */
  routeId: string;
  /** The section the URL names. */
  tab: BuildTab;
  /** Which tabs exist (editing: Equipment only, which is the gear sections here). */
  tabs: BuildTab[];
  editable: boolean;
  level: number;
  description: string;
  /** Editing: the write-up's editor, its own section after the gear. */
  descriptionEditor: ReactNode;
  build: Build | null;
  tracking: BuildTracking;
  /** The content sections' bodies, as the desktop tabs show them (bare). */
  bodies: Record<BuildTab, ReactNode>;
}

/** A gear section's closed header: its icons, "+N" past what fits; "None" (or, editing, "Nothing chosen"). */
function GearGlance({ icons, editable }: { icons: SlotDisplayItem[]; editable: boolean }) {
  if (!icons.length) return <span>{editable ? 'Nothing chosen' : 'None'}</span>;
  const shown = icons.slice(0, MAX_ICONS);
  return (
    <>
      {shown.map((item, index) => (
        <ItemTile key={`${item.id}-${index}`} src={iconUrl(item.icon)} size={28} />
      ))}
      {icons.length > shown.length ? <More>+{icons.length - shown.length}</More> : null}
      <VisuallyHidden>{icons.map((item) => item.name).join(', ')}</VisuallyHidden>
    </>
  );
}

/** An open gear section: each list (labelled when there are several) as item rows with names. */
function GearBody({ section, editable }: { section: PhoneGearSection; editable: boolean }) {
  const { memory } = section;
  return (
    <GearLists>
      {memory ? (
        <SlotCount $over={memory.used > memory.available}>
          <strong>{memory.used}</strong>
          {` of ${memory.available} memory slots`}
        </SlotCount>
      ) : null}
      {section.groups.map((group) => (
        <div key={group.key}>
          {group.title ? <Label as="h3">{group.title}</Label> : null}
          <Rows aria-label={group.title || section.title}>
            {group.entries.map((entry) => (
              <li key={entry.id}>
                <ItemRow
                  entry={entry}
                  editable={editable}
                  size={section.key === 'weapons' ? 64 : 44}
                />
              </li>
            ))}
          </Rows>
        </div>
      ))}
    </GearLists>
  );
}

/**
 * The build page on phones and tablets (T49, T63, the owner's design): instead of the tab bar and the
 * sidebar, one list of collapsible sections under the title section: Stats, the equipment (Weapons,
 * Armor, Talismans, Spells, Tears rune and ash, Items), then Guide and Discussion. Closed, each header
 * says something (the glance: the level and top attributes, the gear's icons, how many items the Guide
 * finds, the newest comment). The section the URL names starts open (Equipment, the default: Weapons);
 * several can be open. Opening Guide or Discussion replaces the URL with its own (no history entry per
 * tap); a URL change from elsewhere (Track → `/guide`, Back) opens that section and scrolls to it.
 * Editing: Stats, every gear section with its slots as rows that open the picker, the stats as
 * inputs, then Description (the write-up's editor).
 */
function BuildSections({
  routeId,
  tab,
  tabs,
  editable,
  level,
  description,
  descriptionEditor,
  build,
  tracking,
  bodies,
}: BuildSectionsProps) {
  const navigate = useNavigate();
  const stats = useAppSelector(selectStats);
  const gear = phoneGearSections(useAppSelector(selectGearState), editable);
  const commentCount = build?.commentCount ?? 0;
  const latest = useLatestComment(build?.id ?? '', Boolean(build) && !editable && commentCount > 0);

  const [open, setOpen] = useState<ReadonlySet<SectionKey>>(() => new Set([sectionFor(tab)]));
  // The URL names another section (a tap here, Track, Back): it opens. Adjusted while rendering.
  const [urlTab, setUrlTab] = useState(tab);
  if (urlTab !== tab) {
    setUrlTab(tab);
    if (!open.has(sectionFor(tab))) setOpen(new Set(open).add(sectionFor(tab)));
  }

  // And scrolls into view, unless the change came from tapping its header here.
  const tapped = useRef<BuildTab | null>(null);
  const shownTab = useRef(tab);
  useEffect(() => {
    if (shownTab.current === tab) return;
    shownTab.current = tab;
    if (tapped.current === tab) {
      tapped.current = null;
      return;
    }
    document.getElementById(sectionAnchor(sectionFor(tab)))?.scrollIntoView?.({ block: 'start' });
  }, [tab]);

  // The content sections: the tabs past Equipment (which is the gear sections).
  const contents = tabs.filter((each) => each !== 'equipment');

  const toggle = (key: SectionKey) => {
    const next = new Set(open);
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
      const content = contents.find((each) => each === key);
      if (content && content !== tab) {
        tapped.current = content;
        void navigate(tabPath(routeId, content, build?.name), { replace: true });
      }
    }
    setOpen(next);
  };

  const top = statsGlance(stats, level).top;
  const glances: Record<Exclude<BuildTab, 'equipment'>, ReactNode> = {
    guide: (
      <span>
        {build ? guideGlance(trackedItems(build.equipment).length, tracking.progress) : ''}
      </span>
    ),
    discussion: <span>{commentsGlance(commentCount, latest.data?.text ?? null)}</span>,
  };

  return (
    <List>
      <PhoneSection
        title="Stats"
        glance={
          <span>
            <Level>RL {level}</Level>
            {top.map(({ short, value }) => ` · ${short} ${value}`).join('')}
          </span>
        }
        open={open.has('stats')}
        onToggle={() => toggle('stats')}
        anchorId={sectionAnchor('stats')}>
        <StatsCard editable={editable} level={level} bare />
      </PhoneSection>
      {gear.map((each) => (
        <PhoneSection
          key={each.key}
          title={each.title}
          glance={<GearGlance icons={each.icons} editable={editable} />}
          empty={!editable && each.icons.length === 0}
          open={open.has(each.key)}
          onToggle={() => toggle(each.key)}
          anchorId={sectionAnchor(each.key)}>
          <GearBody section={each} editable={editable} />
        </PhoneSection>
      ))}
      {editable ? (
        <PhoneSection
          title="Description"
          glance={<span>{firstParagraph(description) || 'Not written yet'}</span>}
          open={open.has('description')}
          onToggle={() => toggle('description')}
          anchorId={sectionAnchor('description')}>
          {descriptionEditor}
        </PhoneSection>
      ) : null}
      {contents.map((each) => (
        <PhoneSection
          key={each}
          title={TITLES[each]}
          glance={glances[each]}
          onPrefetch={each === 'guide' ? () => void loadRoute() : undefined}
          open={open.has(each)}
          onToggle={() => toggle(each)}
          anchorId={sectionAnchor(each)}>
          {bodies[each]}
        </PhoneSection>
      ))}
    </List>
  );
}

const TITLES: Record<Exclude<BuildTab, 'equipment'>, string> = {
  guide: 'Guide',
  discussion: 'Discussion',
};

// One surface, the sections divided by hairlines (owner, T49).
const List = styled.div`
  ${panel}
`;

const Level = styled.strong`
  color: ${COLOR_ACCENT};
  font-weight: 600;
`;

const More = styled.span`
  color: ${COLOR_TEXT_MUTED};
  font-size: ${TEXT_XS};
  font-variant-numeric: tabular-nums;
  font-weight: 600;
  margin-left: 2px;
`;

const GearLists = styled.div`
  display: grid;
  gap: ${SPACE_GROUP};

  h3 {
    margin: 0 0 4px;
  }
`;

const Rows = styled.ul`
  display: grid;
  gap: 4px;
  list-style: none;
  margin: 0;
  padding: 0;
`;

const SlotCount = styled.p<{ $over: boolean }>`
  color: ${({ $over }) => ($over ? COLOR_DANGER : COLOR_TEXT_MUTED)};
  font-size: ${TEXT_XS};
  font-variant-numeric: tabular-nums;
  margin: 0;

  strong {
    color: ${({ $over }) => ($over ? COLOR_DANGER : COLOR_TEXT)};
    font-weight: 600;
  }
`;

export default BuildSections;
