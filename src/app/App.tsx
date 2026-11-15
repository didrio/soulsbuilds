import { lazy, Suspense, useState } from 'react';
import styled, { createGlobalStyle } from 'styled-components';
import FlexGroup from '@/components/ui/FlexGroup';
import FocusScope from '@/components/ui/FocusScope';
import OutsideClickHandler from '@/components/ui/OutsideClickHandler';
import Login from '@/features/auth/Login';
import SignUp from '@/features/auth/SignUp';
import useAuth from '@/features/auth/useAuth';
import { closePicker } from '@/features/editor/store/app';
import { selectSlotType } from '@/features/editor/store/selectors';
import {
  COLOR_BACKDROP,
  COLOR_DARK_GREEN,
  COLOR_DARKER_GREEN,
  COLOR_GOLD,
  COLOR_GREEN,
  COLOR_LIGHTEST_GREEN,
  BELOW_500,
  BELOW_800,
  BELOW_1200,
  SPACE_LG,
  SPACE_SM,
  SPACE_XL,
  SPACE_XXL,
} from '@/theme';
import Footer from './Footer';
import GameSelector from './GameSelector';
import Header from './Header';
import { useAppDispatch, useAppSelector } from './hooks';
import AppRoutes from './routes';

// The picker holds the full game data (~1 MB), so it loads when a slot is first opened.
const ItemSelector = lazy(() => import('@/features/editor/ItemSelector'));

const GlobalStyle = createGlobalStyle`
  body {
    background-color: ${COLOR_DARKER_GREEN};
    color: ${COLOR_GOLD};
  }
`;

type PanelContent = 'login' | 'register';

/**
 * The page shell: game selector, header, the login/register slide-down panel, the routes, the
 * footer, and the item picker modal (open while Redux `app.slotType` is set).
 */
function App() {
  const dispatch = useAppDispatch();
  const slotType = useAppSelector(selectSlotType);
  const { uid } = useAuth();

  const [showHiddenContainer, setShowHiddenContainer] = useState(false);
  const [hiddenContainerContent, setHiddenContainerContent] = useState<PanelContent | null>(null);

  const top = (document.documentElement.scrollTop || document.body.scrollTop || 0) + 120;

  const handleHideModal = () => {
    dispatch(closePicker());
  };

  const handleCloseHiddenContainer = () => {
    setShowHiddenContainer(false);
    setHiddenContainerContent(null);
  };

  const togglePanel = (content: PanelContent) => {
    if (showHiddenContainer === true && hiddenContainerContent === content) {
      handleCloseHiddenContainer();
    } else {
      setShowHiddenContainer(true);
      setHiddenContainerContent(content);
    }
  };

  return (
    <Background>
      <GlobalStyle />
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
      <Container>
        <GameSelector />
        <HeaderContainer>
          <Header
            openPanel={showHiddenContainer ? hiddenContainerContent : null}
            onShowLogin={() => togglePanel('login')}
            onShowRegister={() => togglePanel('register')}
          />
        </HeaderContainer>
        <HiddenContainer $visible={showHiddenContainer}>
          {hiddenContainerContent && !uid ? (
            // Not modal: Tab may leave it. Escape closes it and focus returns to the header button.
            <FocusScope key={hiddenContainerContent} onEscape={handleCloseHiddenContainer}>
              {hiddenContainerContent === 'login' ? (
                <Login onDone={handleCloseHiddenContainer} />
              ) : (
                <SignUp onDone={handleCloseHiddenContainer} />
              )}
            </FocusScope>
          ) : null}
        </HiddenContainer>
        <Content>
          <AppRoutes />
        </Content>
        <Footer />
      </Container>
    </Background>
  );
}

const HeaderContainer = styled(FlexGroup)`
  margin-bottom: ${SPACE_XXL};
  margin-top: ${SPACE_LG};
  width: 95%;
`;

const HiddenContainer = styled(FlexGroup)<{ $visible: boolean }>`
  max-height: ${({ $visible }) => ($visible ? '420px' : '0px')};
  margin-bottom: ${({ $visible }) => ($visible ? '${SPACE_XXL}' : '0px')};
  transition: all 0.4s ease-in-out;
  background-color: ${COLOR_GREEN};
  overflow: hidden;
  align-items: center;
  width: 100%;
  justify-content: center;
  box-shadow: inset 0 0 5px ${COLOR_DARK_GREEN};
`;

const Background = styled(FlexGroup)`
  flex-direction: column;
  align-items: center;
  position: relative;
`;

const Container = styled(FlexGroup)`
  background-color: ${COLOR_DARK_GREEN};
  flex-direction: column;
  width: 72%;
  min-height: 100vh;
  padding-top: ${SPACE_SM};
  padding-bottom: ${SPACE_XL};
  box-shadow: 0px 0px 1px ${COLOR_LIGHTEST_GREEN};
  align-items: center;

  @media ${BELOW_1200} {
    width: 80%;
  }

  @media ${BELOW_800} {
    width: 90%;
  }

  @media ${BELOW_500} {
    width: 95%;
  }
`;

const Content = styled(FlexGroup)`
  flex-direction: column;
  width: 100%;
`;

const ModalContainer = styled(FlexGroup)`
  position: absolute;
  justify-content: center;
  background-color: ${COLOR_BACKDROP};
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
  z-index: 100;
`;

// The picker sizes itself to the modal (height: 100%), so the focus wrapper must pass it through.
const ModalFocusScope = styled(FocusScope)`
  height: 100%;
`;

const Modal = styled.div<{ $top: number }>`
  background-color: ${COLOR_DARK_GREEN};
  width: 70vw;
  height: 70vh;
  border-radius: 10px;
  padding: ${SPACE_LG};
  margin-top: ${({ $top }) => $top}px;
  box-shadow: 0px 0px 3px ${COLOR_GREEN};
`;

export default App;
