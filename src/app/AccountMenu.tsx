import { useId, useState } from 'react';
import { Link } from 'react-router';
import styled from 'styled-components';
import FocusScope from '@/components/ui/FocusScope';
import { ChevronDownIcon } from '@/components/ui/icons';
import OutsideClickHandler from '@/components/ui/OutsideClickHandler';
import useAuth from '@/features/auth/useAuth';
import { useUserProfile } from '@/features/profile/queries';
import { signOut } from '@/lib/firebase';
import {
  COLOR_ACCENT,
  COLOR_BG,
  COLOR_LINE,
  COLOR_SURFACE_RAISED,
  COLOR_TEXT,
  COLOR_TEXT_MUTED,
  SHADOW_OVERLAY,
} from '@/theme';

/** The signed-in user's display name, or a stand-in while it loads. */
export function useDisplayName(): string {
  const { uid } = useAuth();
  return useUserProfile(uid).data?.displayName ?? 'Account';
}

/**
 * The header's signed-in control on wider screens (T31): the display name opens a small panel with
 * Profile, Account and Log out. A disclosure (button + links), not an ARIA menu: Tab moves through
 * it, Escape or a click outside closes it.
 */
function AccountMenu() {
  const { uid } = useAuth();
  const name = useDisplayName();
  const panelId = useId();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <OutsideClickHandler onOutsideClick={close}>
      <Anchor>
        <NameButton
          type="button"
          aria-expanded={open}
          aria-controls={open ? panelId : undefined}
          onClick={() => setOpen(!open)}>
          <Name>{name}</Name>
          <ChevronDownIcon aria-hidden="true" />
        </NameButton>
        {open ? (
          <Panel id={panelId} onEscape={close}>
            <nav aria-label="Your account">
              <Link to={`/user/${uid}`} onClick={close}>
                Profile
              </Link>
              <Link to="/account" onClick={close}>
                Account
              </Link>
              <button
                type="button"
                onClick={() => {
                  close();
                  void signOut();
                }}>
                Log out
              </button>
            </nav>
          </Panel>
        ) : null}
      </Anchor>
    </OutsideClickHandler>
  );
}

const Anchor = styled.div`
  position: relative;
`;

const NameButton = styled.button`
  align-items: center;
  background: none;
  border: none;
  color: ${COLOR_TEXT_MUTED};
  cursor: pointer;
  display: inline-flex;
  font: inherit;
  font-weight: 500;
  gap: 6px;
  min-height: 44px;
  padding: 0 12px;

  &:hover,
  &[aria-expanded='true'] {
    color: ${COLOR_TEXT};
  }

  & > svg {
    flex: none;
    transition: transform 0.15s;
  }

  &[aria-expanded='true'] > svg {
    color: ${COLOR_ACCENT};
    transform: rotate(180deg);
  }
`;

const Name = styled.span`
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const Panel = styled(FocusScope)`
  background: ${COLOR_BG};
  border: 1px solid ${COLOR_LINE};
  border-radius: 4px;
  box-shadow: ${SHADOW_OVERLAY};
  min-width: 180px;
  outline: none;
  padding: 4px 0;
  position: absolute;
  right: 0;
  top: calc(100% + 4px);
  z-index: 50;

  & > nav {
    display: flex;
    flex-direction: column;
  }

  & > nav > a,
  & > nav > button {
    align-items: center;
    background: none;
    border: none;
    color: ${COLOR_TEXT};
    cursor: pointer;
    display: flex;
    font: inherit;
    min-height: 44px;
    padding: 0 16px;
    text-align: left;
  }

  & > nav > a:hover,
  & > nav > button:hover {
    background: ${COLOR_SURFACE_RAISED};
  }

  & > nav > button {
    border-top: 1px solid ${COLOR_LINE};
  }
`;

export default AccountMenu;
