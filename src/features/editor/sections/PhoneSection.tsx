import { useId, type ReactNode } from 'react';
import styled from 'styled-components';
import { ChevronDownIcon } from '@/components/ui/icons';
import { displayText } from '@/components/ui/typography';
import {
  COLOR_LINE,
  COLOR_SURFACE,
  COLOR_TEXT,
  COLOR_TEXT_MUTED,
  DURATION_FAST,
  SPACE_GUTTER,
  SPACE_MD,
  TEXT_LG,
  TEXT_SM,
} from '@/theme';

/** A closed header's height (the title over the glance). */
const CLOSED_HEIGHT = 64;
/** An open header's height (the title alone): what a stuck one covers, for scroll margins. */
export const PHONE_OPEN_HEADER_HEIGHT = 48;

interface PhoneSectionProps {
  title: string;
  /** What the closed header says under the title: text, or the gear's icons. */
  glance: ReactNode;
  open: boolean;
  onToggle: () => void;
  /** Nothing to open (a gear section with no items): a plain heading that says so in the glance. */
  empty?: boolean;
  /** Pointing at or focusing the header (the Guide fetches its code ahead of the tap). */
  onPrefetch?: () => void;
  /** The header's id, which the page scrolls to when the URL opens this section. */
  anchorId?: string;
  /** The body, rendered only while open (so Comments and the Guide load on open). */
  children: ReactNode;
}

/**
 * One of the build page's collapsible sections on phones (T49): a region named by its title, with a
 * header button (`aria-expanded`, `aria-controls`) that says something while closed (the glance). An
 * open section's header sticks to the top of the window while you scroll through it, so it closes
 * from anywhere.
 */
function PhoneSection({
  title,
  glance,
  open,
  onToggle,
  empty = false,
  onPrefetch,
  anchorId,
  children,
}: PhoneSectionProps) {
  const id = useId();
  const titleId = `${id}-title`;
  const bodyId = `${id}-body`;
  const head = (
    <>
      <Title id={titleId}>{title}</Title>{' '}
      {/* Open, the body says it all: the header is the title alone (a smaller sticky bar). */}
      {open && !empty ? null : <Glance>{glance}</Glance>}
    </>
  );

  return (
    <Section aria-labelledby={titleId}>
      <Header id={anchorId} $open={open && !empty}>
        <Heading>
          {empty ? (
            <Row>{head}</Row>
          ) : (
            <HeaderButton
              type="button"
              $open={open}
              aria-expanded={open}
              aria-controls={bodyId}
              onClick={onToggle}
              onFocus={onPrefetch}
              onPointerDown={onPrefetch}>
              {head}
              <Chevron $open={open} aria-hidden="true">
                <ChevronDownIcon size={18} />
              </Chevron>
            </HeaderButton>
          )}
        </Heading>
      </Header>
      {empty ? null : (
        <Body id={bodyId} hidden={!open}>
          {open ? children : null}
        </Body>
      )}
    </Section>
  );
}

// Hairlines between sections; the list draws the outer edge.
const Section = styled.section`
  & + & {
    border-top: 1px solid ${COLOR_LINE};
  }
`;

// Open: sticks to the window's top within its own section, on the surface so the body passes under.
const Header = styled.div<{ $open: boolean }>`
  background: ${COLOR_SURFACE};
  position: ${({ $open }) => ($open ? 'sticky' : 'static')};
  top: 0;
  z-index: 4;
  border-bottom: 1px solid ${({ $open }) => ($open ? COLOR_LINE : 'transparent')};
`;

const Heading = styled.h2`
  margin: 0;
`;

// Closed: the title over the glance, the chevron beside both. Open: the title alone.
const rowLayout = (open: boolean) => `
  align-items: center;
  column-gap: 12px;
  display: grid;
  grid-template-areas: ${open ? "'title chevron'" : "'title chevron' 'glance chevron'"};
  grid-template-columns: minmax(0, 1fr) auto;
  min-height: ${open ? PHONE_OPEN_HEADER_HEIGHT : CLOSED_HEIGHT}px;
  padding: ${open ? '8px' : '10px'} ${SPACE_GUTTER};
  row-gap: 2px;
  text-align: left;
  width: 100%;
`;

const Row = styled.div`
  ${rowLayout(false)}
`;

const HeaderButton = styled.button<{ $open: boolean }>`
  ${({ $open }) => rowLayout($open)}
  background: none;
  border: 0;
  color: inherit;
  cursor: pointer;
  font: inherit;
`;

const Title = styled.span`
  ${displayText}
  color: ${COLOR_TEXT};
  font-size: ${TEXT_LG};
  grid-area: title;
  line-height: 1.25;
`;

// One line: text cut off with "…", icons in a row.
const Glance = styled.span`
  align-items: center;
  color: ${COLOR_TEXT_MUTED};
  display: flex;
  font-size: ${TEXT_SM};
  font-weight: 400;
  gap: 4px;
  grid-area: glance;
  line-height: 1.4;
  min-height: 28px;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;

  & > span:only-child {
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;

const Chevron = styled.span<{ $open: boolean }>`
  color: ${COLOR_TEXT_MUTED};
  display: flex;
  grid-area: chevron;
  transform: rotate(${({ $open }) => ($open ? '180deg' : '0deg')});
  transition: transform ${DURATION_FAST} ease;
`;

const Body = styled.div`
  padding: ${SPACE_MD} ${SPACE_GUTTER} ${SPACE_GUTTER};
`;

export default PhoneSection;
