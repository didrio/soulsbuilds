import { lazy, Suspense, useState } from 'react';
import styled from 'styled-components';
import AuthDialog, { type AuthDialogState } from '@/features/auth/AuthDialog';
import useAuth from '@/features/auth/useAuth';
import { useUserProfile } from '@/features/profile/queries';
import { selectSlotType } from '@/features/editor/store/selectors';
import {
  BELOW_MOBILE,
  COLOR_ACCENT,
  COLOR_BG,
  CONTENT_WIDTH,
  GameSkinStyle,
  GlobalStyle,
  SPACE_GUTTER,
} from '@/theme';
import Footer from './Footer';
import { useCurrentGame } from './game';
import Header from './Header';
import { useAppSelector } from './hooks';
import AppCheckNotice from './AppCheckNotice';
import NewHereStrip from './NewHereStrip';
import { AuthDialogContext, type OpenAuthDialog } from './authDialog';
import AppRoutes from './routes';
import { usePageViews } from './usePageViews';
import { useScrollToTop } from './useScrollToTop';

// The picker (its own Dialog) holds the full game data (~1 MB), so it loads when a slot is first opened.
const ItemSelector = lazy(() => import('@/features/editor/ItemSelector'));

/**
 * The page shell: global styles and the current game's skin, header, the log in / sign up dialog
 * (pages open it with `useOpenAuthDialog`), the routes, the footer, and the item picker modal (open
 * while Redux `app.slotType` is set).
 */
function App() {
  const slotType = useAppSelector(selectSlotType);
  const { uid } = useAuth();
  const game = useCurrentGame();
  const [authDialog, setAuthDialog] = useState<AuthDialogState | null>(null);
  const openAuthDialog: OpenAuthDialog = (kind, onSignedIn) =>
    setAuthDialog({ view: kind, onSignedIn });
  // T30: a signed-in account without a profile (a closed tab mid-sign-up, a profile write that
  // failed) gets the "Choose a display name" step.
  const profile = useUserProfile(uid);
  const needsName = Boolean(uid) && profile.isSuccess && profile.data === null;
  const dialog: AuthDialogState | null = authDialog ?? (needsName ? { view: 'name' } : null);
  const openDialog =
    dialog?.view === 'signup' ? 'signup' : dialog && dialog.view !== 'name' ? 'login' : null;
  useScrollToTop();
  usePageViews();

  return (
    <AuthDialogContext value={openAuthDialog}>
      <Shell>
        <GlobalStyle />
        <GameSkinStyle $game={game.id} />
        <SkipLink href="#main">Skip to content</SkipLink>
        <Header
          openDialog={openDialog}
          onLogIn={() => openAuthDialog('login')}
          onSignUp={() => openAuthDialog('signup')}
        />
        <Main id="main" tabIndex={-1}>
          <NewHereStrip place="row" />
          <AppCheckNotice />
          <AppRoutes />
        </Main>
        <Footer />
        {dialog ? <AuthDialog state={dialog} uid={uid} onChange={setAuthDialog} /> : null}
        {slotType === null ? null : (
          <Suspense fallback={null}>
            <ItemSelector />
          </Suspense>
        )}
      </Shell>
    </AuthDialogContext>
  );
}

const Shell = styled.div`
  min-height: 100vh;
  position: relative;
`;

const SkipLink = styled.a`
  background: ${COLOR_BG};
  border: 1px solid ${COLOR_ACCENT};
  left: ${SPACE_GUTTER};
  padding: 10px 16px;
  position: absolute;
  top: -100px;
  z-index: 200;

  &:focus {
    top: ${SPACE_GUTTER};
  }
`;

const Main = styled.main`
  margin: 0 auto;
  max-width: ${CONTENT_WIDTH};
  outline: none;

  /* A full screen while the page loads (a loading state is busy), so the footer starts below the fold
     instead of showing mid-screen and then jumping away when the content arrives (most of the layout
     shift, T21). Only then: once loaded, the footer follows the content, with no gap on a page shorter
     than the window (the build's Equipment tab; owner, T79). */
  &:has([aria-busy='true']) {
    min-height: 100vh;
  }
  padding: 0 24px;

  @media ${BELOW_MOBILE} {
    padding: 0 ${SPACE_GUTTER};
  }
`;

export default App;
