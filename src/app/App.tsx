import { lazy, Suspense, useState } from 'react';
import styled from 'styled-components';
import Dialog from '@/components/ui/Dialog';
import Login from '@/features/auth/Login';
import SignUp from '@/features/auth/SignUp';
import useAuth from '@/features/auth/useAuth';
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
import AppRoutes from './routes';
import { useScrollToTop } from './useScrollToTop';

// The picker (its own Dialog) holds the full game data (~1 MB), so it loads when a slot is first opened.
const ItemSelector = lazy(() => import('@/features/editor/ItemSelector'));

type AuthDialog = 'login' | 'signup';

/**
 * The page shell: global styles and the current game's skin, header, the log in / sign up dialog,
 * the routes, the footer, and the item picker modal (open while Redux `app.slotType` is set).
 */
function App() {
  const slotType = useAppSelector(selectSlotType);
  const { uid } = useAuth();
  const game = useCurrentGame();
  const [authDialog, setAuthDialog] = useState<AuthDialog | null>(null);

  const closeAuth = () => setAuthDialog(null);
  useScrollToTop();

  return (
    <Shell>
      <GlobalStyle />
      <GameSkinStyle $game={game.id} />
      <SkipLink href="#main">Skip to content</SkipLink>
      <Header
        openDialog={uid ? null : authDialog}
        onLogIn={() => setAuthDialog('login')}
        onSignUp={() => setAuthDialog('signup')}
      />
      <Main id="main" tabIndex={-1}>
        <AppCheckNotice />
        <AppRoutes />
      </Main>
      <Footer />
      {authDialog && !uid ? (
        <Dialog
          title={authDialog === 'login' ? 'Log in' : 'Create your account'}
          onClose={closeAuth}>
          {authDialog === 'login' ? (
            <Login onDone={closeAuth} onSwitch={() => setAuthDialog('signup')} />
          ) : (
            <SignUp onDone={closeAuth} onSwitch={() => setAuthDialog('login')} />
          )}
        </Dialog>
      ) : null}
      {slotType === null ? null : (
        <Suspense fallback={null}>
          <ItemSelector />
        </Suspense>
      )}
    </Shell>
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
  /* A full screen even while the page loads, so the footer starts below the fold instead of showing
     mid-screen and then jumping away when the content arrives (most of the layout shift, T21). */
  min-height: 100vh;
  outline: none;
  padding: 0 24px;

  @media ${BELOW_MOBILE} {
    padding: 0 ${SPACE_GUTTER};
  }
`;

export default App;
