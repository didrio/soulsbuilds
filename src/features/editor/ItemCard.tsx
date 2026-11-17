import styled from 'styled-components';
import { labelText } from '@/components/ui/typography';
import {
  COLOR_DANGER,
  COLOR_LINE,
  COLOR_TEXT,
  COLOR_TEXT_MUTED,
  SPACE_XS,
  TEXT_MD,
  TEXT_SM,
  TEXT_XS,
} from '@/theme';
import type { ItemWarning } from './itemDetails';
import type { ItemFacts } from './itemFacts';

/** The card's width inside its Tooltip bubble. */
export const ITEM_CARD_WIDTH = 264;

/**
 * An item at a glance (T45), inside a `Tooltip`: its name, what it is (with a weapon's affinity and
 * skill), the facts as labelled rows (requirements this build doesn't meet in the danger color), the
 * game's short description and the build's warning. Visual only, like the Tooltip: the tile carries
 * the same facts for screen readers.
 */
function ItemCard({
  name,
  facts,
  warning = null,
}: {
  name: string;
  facts: ItemFacts;
  warning?: ItemWarning | null;
}) {
  return (
    <Card>
      <Name>{name}</Name>
      <Kind>{[facts.kind, facts.subline].filter(Boolean).join(' · ')}</Kind>
      {facts.rows.length ? (
        <Rows>
          {facts.rows.map((row) => (
            <Row key={row.label}>
              <RowLabel>{row.label}</RowLabel>
              <Values>
                {row.parts.map((part) => (
                  <Value key={part.text} $unmet={Boolean(part.unmet)}>
                    {part.text}
                  </Value>
                ))}
              </Values>
            </Row>
          ))}
        </Rows>
      ) : null}
      {facts.effect ? <Effect>{facts.effect}</Effect> : null}
      {warning ? <Warning $severity={warning.severity}>{warning.text}</Warning> : null}
    </Card>
  );
}

const Card = styled.span`
  display: grid;
  font-weight: 400;
  gap: ${SPACE_XS};
  padding: 2px 0;
`;

const Name = styled.span`
  color: ${COLOR_TEXT};
  font-size: ${TEXT_MD};
  font-weight: 600;
  line-height: 1.3;
`;

const Kind = styled.span`
  color: ${COLOR_TEXT_MUTED};
  font-size: ${TEXT_SM};
  margin-top: -3px;
`;

const Rows = styled.span`
  border-top: 1px solid ${COLOR_LINE};
  display: grid;
  gap: 3px;
  grid-template-columns: auto 1fr;
  padding-top: ${SPACE_XS};
`;

// display: contents lets each row's label and values sit in the shared two-column grid.
const Row = styled.span`
  display: contents;
`;

const RowLabel = styled.span`
  ${labelText}
  padding-right: 12px;
  padding-top: 1px;
`;

const Values = styled.span`
  display: flex;
  flex-wrap: wrap;
  gap: 2px 10px;
`;

const Value = styled.span<{ $unmet: boolean }>`
  color: ${({ $unmet }) => ($unmet ? COLOR_DANGER : COLOR_TEXT)};
  font-size: ${TEXT_SM};
  font-variant-numeric: tabular-nums;
  font-weight: ${({ $unmet }) => ($unmet ? 600 : 500)};
`;

const Effect = styled.span`
  border-top: 1px solid ${COLOR_LINE};
  color: ${COLOR_TEXT_MUTED};
  font-size: ${TEXT_SM};
  line-height: 1.4;
  padding-top: ${SPACE_XS};
`;

const Warning = styled.span<{ $severity: ItemWarning['severity'] }>`
  color: ${({ $severity }) => ($severity === 'warning' ? COLOR_DANGER : COLOR_TEXT_MUTED)};
  font-size: ${TEXT_XS};
  font-style: ${({ $severity }) => ($severity === 'note' ? 'italic' : 'normal')};
  font-weight: ${({ $severity }) => ($severity === 'warning' ? 600 : 400)};
`;

export default ItemCard;
