import { lazy, Suspense, useState } from 'react';
import styled from 'styled-components';
import Dialog from '@/components/ui/Dialog';
import FocusScope from '@/components/ui/FocusScope';
import { framed } from '@/components/ui/inWorld';
import OutsideClickHandler from '@/components/ui/OutsideClickHandler';
import Login from '@/features/auth/Login';
import SignUp from '@/features/auth/SignUp';
import useAuth from '@/features/auth/useAuth';
import { closePicker } from '@/features/editor/store/app';
import { selectSlotType } from '@/features/editor/store/selectors';
import {
  BELOW_MOBILE,
  COLOR_ACCENT,
  COLOR_BACKDROP,
  COLOR_BG,
  CONTENT_WIDTH,
  GameSkinStyle,
  GlobalStyle,
  SHADOW_OVERLAY,
  SPACE_GUTTER,
  SPACE_LG,
} from '@/theme';
import Footer from './Footer';
import { useCurrentGame } from './game';
import Header from './Header';
import { useAppDispatch, useAppSelector } from './hooks';
import AppRoutes from './routes';

// The picker holds the full game data (~1 MB), so it loads when a slot is first opened.
const ItemSelector = lazy(() => import('@/features/editor/ItemSelector'));

type AuthDialog = 'login' | 'signup';

/**
 * The page shell: global styles and the current game's skin, header, the log in / sign up dialog,
 * the routes, the footer, and the item picker modal (open while Redux `app.slotType` is set).
 */
function App() {
  const dispatch = useAppDispatch();
  const slotType = useAppSelector(selectSlotType);
  const { uid } = useAuth();
  const game = useCurrentGame();
  const [authDialog, setAuthDialog] = useState<AuthDialog | null>(null);

  const top = (document.documentElement.scrollTop || document.body.scrollTop || 0) + 120;

  const handleHideModal = () => {
    dispatch(closePicker());
  };

  const closeAuth = () => setAuthDialog(null);

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
      {/* T17 moves the picker onto Dialog; until then only its colors changed. */}
      {slotType === null ? null : (
        <ModalContainer>
          <OutsideClickHandler onOutsideClick={handleHideModal}>
            <Modal $top={top} role="dialog" aria-modal="true" aria-label="Choose an item">
              <ModalFocusScope trap onEscape={handleHideModal}>
                <Suspense fallback={null}>
                  <ItemSelector />
                </Suspense>
              </ModalFocusScope>
            </Modal>
          </OutsideClickHandler>
        </ModalContainer>
      )}
    </Shell>
  );
}

// Positioned so the picker's backdrop covers the whole page height.
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
  min-height: 60vh;
  outline: none;
  padding: 0 24px;

  @media ${BELOW_MOBILE} {
    padding: 0 ${SPACE_GUTTER};
  }
`;

const ModalContainer = styled.div`
  background-color: ${COLOR_BACKDROP};
  display: flex;
  inset: 0;
  justify-content: center;
  position: absolute;
  z-index: 100;
`;

// The picker sizes itself to the modal (height: 100%), so the focus wrapper must pass it through.
const ModalFocusScope = styled(FocusScope)`
  height: 100%;
`;

const Modal = styled.div<{ $top: number }>`
  ${framed}
  box-shadow: ${SHADOW_OVERLAY};
  height: 70vh;
  margin-top: ${({ $top }) => $top}px;
  padding: ${SPACE_LG};
  width: 70vw;
`;

export default App;
