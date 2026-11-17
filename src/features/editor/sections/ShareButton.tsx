import { useState } from 'react';
import styled from 'styled-components';
import Button from '@/components/ui/Button';
import FocusScope from '@/components/ui/FocusScope';
import OutsideClickHandler from '@/components/ui/OutsideClickHandler';
import { ChevronDownIcon } from '@/components/ui/icons';
import type { Build } from '@/lib/models';
import { buildUrl } from '@/lib/share';
import { cardImageUrl, redditText } from '@/lib/shareText';
import { slugify } from '@/lib/slug';
import { countEvent } from '@/lib/usage';
import {
  BELOW_TABLET,
  COLOR_LINE,
  COLOR_SURFACE_RAISED,
  COLOR_TEXT,
  COLOR_TEXT_MUTED,
  DURATION_FAST,
  SHADOW_OVERLAY,
  SPACE_MD,
  SPACE_XS,
  TEXT_MD,
} from '@/theme';

type Copied = 'link' | 'reddit' | null;

/**
 * "Share" in the build's title section (T54): a small menu to copy the link, copy the build as
 * Reddit markdown (ending with the link), download the link-preview card (T37), and, where the
 * browser has a share sheet (phones), "Share…". Each use is counted (T38).
 */
function ShareButton({ build, author }: { build: Build; author?: string }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState<Copied>(null);
  const url = buildUrl(build.id, build.name);
  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  const copy = async (what: 'link' | 'reddit') => {
    countEvent(what === 'link' ? 'share-link' : 'share-reddit');
    const text = what === 'link' ? url : redditText(build, author);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(what);
    } catch {
      // Blocked or unsupported clipboard: stay as we are, the other actions still work.
    }
  };

  const close = () => {
    setOpen(false);
    setCopied(null);
  };

  return (
    <OutsideClickHandler onOutsideClick={() => (open ? close() : undefined)}>
      <Anchor>
        <Button
          variant="secondary"
          aria-expanded={open}
          aria-haspopup="true"
          onClick={() => (open ? close() : setOpen(true))}>
          Share
          <ChevronDownIcon />
        </Button>
        {open ? (
          <Panel onEscape={close} aria-label="Share this build">
            <Item onClick={() => void copy('link')}>
              {copied === 'link' ? 'Copied' : 'Copy link'}
            </Item>
            <Item onClick={() => void copy('reddit')}>
              {copied === 'reddit' ? 'Copied' : 'Copy for Reddit'}
            </Item>
            <ItemLink
              href={cardImageUrl(build.id)}
              download={`${slugify(build.name) || 'build'}.png`}
              onClick={() => countEvent('share-image')}>
              Download image
            </ItemLink>
            {canShare ? (
              <Item
                onClick={() => {
                  countEvent('share-native');
                  void navigator.share({ title: build.name, url }).then(close, () => undefined);
                }}>
                Share…
              </Item>
            ) : null}
            <Status role="status">{copied ? 'Copied to the clipboard' : ''}</Status>
          </Panel>
        ) : null}
      </Anchor>
    </OutsideClickHandler>
  );
}

const Anchor = styled.div`
  position: relative;
`;

// Under the button, its right edge on desktop (the actions sit on the right) and its left on phones.
const Panel = styled(FocusScope)`
  background-color: ${COLOR_SURFACE_RAISED};
  border: 1px solid ${COLOR_LINE};
  box-shadow: ${SHADOW_OVERLAY};
  display: flex;
  flex-direction: column;
  min-width: 200px;
  padding: ${SPACE_XS} 0;
  position: absolute;
  right: 0;
  top: calc(100% + ${SPACE_XS});
  z-index: 10;

  @media ${BELOW_TABLET} {
    left: 0;
    right: auto;
  }
`;

const item = `
  align-items: center;
  background: none;
  border: 0;
  color: ${COLOR_TEXT};
  cursor: pointer;
  display: flex;
  font: inherit;
  font-size: ${TEXT_MD};
  min-height: 44px;
  padding: 0 ${SPACE_MD};
  text-align: left;
  text-decoration: none;
  transition: background-color ${DURATION_FAST};
  width: 100%;

  &:hover {
    background-color: ${COLOR_LINE};
  }
`;

const Item = styled.button.attrs({ type: 'button' })`
  ${item}
`;

const ItemLink = styled.a`
  ${item}
`;

const Status = styled.span`
  color: ${COLOR_TEXT_MUTED};
  font-size: 0;
`;

export default ShareButton;
