import type { ReactNode } from 'react';
import { Link } from 'react-router';
import styled from 'styled-components';
import Label from '@/components/ui/Label';
import {
  COLOR_ACCENT,
  COLOR_ACCENT_STRONG,
  COLOR_LINE,
  COLOR_LINE_STRONG,
  COLOR_SURFACE,
  COLOR_TEXT,
  COLOR_TEXT_MUTED,
  DURATION_FAST,
  RADIUS_PANEL,
  SPACE_LG,
  SPACE_MD,
  TEXT_MD,
} from '@/theme';

interface TabLinkCardProps {
  to: string;
  label: string;
  /** The call to action, e.g. "Read the description". */
  action: string;
  children: ReactNode;
  /** Called on hover or focus, e.g. to start loading the tab's code. */
  onPrefetch?: () => void;
}

/**
 * A card on the Loadout tab that leads to another tab (T28): a small label, a line or three of
 * preview (clamped), and the call to action in the accent. The whole card is the link.
 */
function TabLinkCard({ to, label, action, children, onPrefetch }: TabLinkCardProps) {
  return (
    <Card to={to} onFocus={onPrefetch} onPointerEnter={onPrefetch}>
      <Label>{label}</Label>
      <Preview>{children}</Preview>
      <Action>{action} →</Action>
    </Card>
  );
}

const Card = styled(Link)`
  background: ${COLOR_SURFACE};
  border: 1px solid ${COLOR_LINE};
  border-radius: ${RADIUS_PANEL};
  color: ${COLOR_TEXT};
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: ${SPACE_MD} ${SPACE_LG};
  transition: border-color ${DURATION_FAST} ease;

  &:hover {
    border-color: ${COLOR_LINE_STRONG};
    color: ${COLOR_TEXT};
  }

  &:hover > :last-child {
    color: ${COLOR_ACCENT_STRONG};
  }
`;

const Preview = styled.span`
  -webkit-box-orient: vertical;
  color: ${COLOR_TEXT_MUTED};
  display: -webkit-box;
  font-size: ${TEXT_MD};
  -webkit-line-clamp: 3;
  overflow: hidden;
`;

const Action = styled.span`
  color: ${COLOR_ACCENT};
  font-weight: 600;
  margin-top: auto;
`;

export default TabLinkCard;
