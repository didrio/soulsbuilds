import { useSyncExternalStore } from 'react';
import styled from 'styled-components';
import Button from '@/components/ui/Button';
import Frame from '@/components/ui/Frame';
import { getAppCheckStatus, onAppCheckStatus } from '@/lib/firebase';
import { COLOR_DANGER, COLOR_TEXT, FONT_DISPLAY, SPACE_LG, SPACE_MD, TEXT_LG } from '@/theme';

/**
 * Shown at the top of every page when App Check can't get a token (T24): Google reCAPTCHA is blocked, so
 * no data can load. Without this the pages below would just keep loading.
 */
function AppCheckNotice() {
  const status = useSyncExternalStore(onAppCheckStatus, getAppCheckStatus);
  if (status !== 'blocked') return null;
  return (
    <Notice role="alert">
      <Title>Couldn’t verify your browser</Title>
      <p>
        An ad or tracker blocker may be blocking Google reCAPTCHA, which Souls Builds uses to keep
        bots out. Allow www.google.com and www.gstatic.com on this site, then reload.
      </p>
      <Button variant="secondary" onClick={() => window.location.reload()}>
        Reload
      </Button>
    </Notice>
  );
}

const Notice = styled(Frame)`
  align-items: flex-start;
  color: ${COLOR_TEXT};
  display: flex;
  flex-direction: column;
  gap: ${SPACE_MD};
  margin-top: ${SPACE_LG};

  p {
    margin: 0;
    max-width: 72ch;
  }
`;

const Title = styled.h2`
  color: ${COLOR_DANGER};
  font-family: ${FONT_DISPLAY};
  font-size: ${TEXT_LG};
  margin: 0;
`;

export default AppCheckNotice;
