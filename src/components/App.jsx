import { useState } from 'react';
import styled, { createGlobalStyle } from 'styled-components';
import { useDispatch, useSelector } from 'react-redux';
import { Routes, Route } from 'react-router-dom';
import OutsideClickHandler from 'react-outside-click-handler';
import FlexGroup from './common/FlexGroup';
import Header from './Header';
import BuildEditor from './BuildEditor';
import Profile from './Profile';
import ItemSelector from './ItemSelector';
import SignUp from './SignUp';
import Login from './Login';
import Landing from './Landing';
import GameSelector from './GameSelector';
import {
  COLOR_DARK_GREEN,
  COLOR_DARKER_GREEN,
  COLOR_GOLD,
  COLOR_GREEN,
  COLOR_LIGHTEST_GREEN,
} from '../constants';
import { selectSlotType } from '../store/selectors';
import {
  updateEditSlot,
  updateSlotType,
  updateEditSubSlot,
} from '../store/app';

const GlobalStyle = createGlobalStyle`
  body {
    background-color: ${COLOR_DARKER_GREEN};
    color: ${COLOR_GOLD};
  }
`;

const CONTENT_TYPE_LOGIN = 'CONTENT_TYPE_LOGIN';
const CONTENT_TYPE_REGISTER = 'CONTENT_TYPE_REGISTER';

function App() {
  const dispatch = useDispatch();
  const slotType = useSelector(selectSlotType);

  const [showHiddenContainer, setShowHiddenContainer] = useState(false);
  const [hiddenContainerContent, setHiddenContainerContent] = useState(null);

  const top = (document.documentElement.scrollTop || document.body.scrollTop || 0) + 120;

  const handleHideModal = () => {
    dispatch(updateEditSlot(null));
    dispatch(updateEditSubSlot(null));
    dispatch(updateSlotType(null));
  };

  const handleCloseHiddenContainer = () => {
    setShowHiddenContainer(false);
    setHiddenContainerContent(null);
  };

  const handleShowLogin = () => {
    if (showHiddenContainer === true && hiddenContainerContent === CONTENT_TYPE_LOGIN) {
      handleCloseHiddenContainer();
    } else {
      setShowHiddenContainer(true);
      setHiddenContainerContent(CONTENT_TYPE_LOGIN);
    }
  };

  const handleShowRegister = () => {
    if (showHiddenContainer === true && hiddenContainerContent === CONTENT_TYPE_REGISTER) {
      handleCloseHiddenContainer();
    } else {
      setShowHiddenContainer(true);
      setHiddenContainerContent(CONTENT_TYPE_REGISTER);
    }
  };

  return (
    <Background>
      <GlobalStyle />
      {slotType === null ? null : (
        <ModalContainer>
          <OutsideClickHandler
            onOutsideClick={handleHideModal}
          >
            <Modal
              top={top}
            >
              <ItemSelector />
            </Modal>
          </OutsideClickHandler>
        </ModalContainer>
      )}
      <Container>
        <GameSelector />
        <HeaderContainer>
          <Header
            onShowLogin={handleShowLogin}
            onShowRegister={handleShowRegister}
          />
        </HeaderContainer>
        <HiddenContainer
          visible={showHiddenContainer}
        >
          {hiddenContainerContent === CONTENT_TYPE_LOGIN ? (
            <Login
              onSubmit={handleCloseHiddenContainer}
            />
          ) : null}
          {hiddenContainerContent === CONTENT_TYPE_REGISTER ? (
            <div>
              <SignUp
                onSubmit={handleCloseHiddenContainer}
              />
            </div>
          ) : null}
        </HiddenContainer>
        <Content>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/build/:buildId" element={<BuildEditor />} />
            <Route path="/user/:userId" element={<Profile />} />
          </Routes>
        </Content>
      </Container>
    </Background>
  );
}

const HeaderContainer = styled(FlexGroup)`
  margin-bottom: 40px;
  margin-top: 20px;
  width: 95%;
`;

const HiddenContainer = styled(FlexGroup)`
  height: ${({ visible }) => (visible ? '100px' : '0px')};
  margin-bottom: ${({ visible }) => (visible ? '40px' : '0px')};
  transition: all .4s ease-in-out;
  background-color: ${COLOR_GREEN};
  overflow: hidden;
  align-items: center;
  padding-left: 20px;
  width: 100%;
  justify-content: center;
  box-shadow: inset 0 0 5px ${COLOR_DARK_GREEN};

  @media only screen and (max-width: 800px) {
    height: ${({ visible }) => (visible ? '300px' : '0px')};
  }
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
  padding-top: 10px;
  padding-bottom: 30px;
  box-shadow: 0px 0px 1px ${COLOR_LIGHTEST_GREEN};
  align-items: center;

  @media only screen and (max-width: 1200px) {
    width: 80%;
  }

  @media only screen and (max-width: 800px) {
    width: 90%;
  }

  @media only screen and (max-width: 500px) {
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
  background-color: rgba(0,0,0,0.6);
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
  z-index: 100;
`;

const Modal = styled.div`
  background-color: ${COLOR_DARK_GREEN};
  width: 70vw;
  height: 70vh;
  border-radius: 10px;
  padding: 20px;
  margin-top: ${({ top }) => top}px;
  box-shadow: 0px 0px 3px ${COLOR_GREEN};
`;

export default App;
