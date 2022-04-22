import styled, { createGlobalStyle } from 'styled-components';
import { useSelector } from 'react-redux';
import { Routes, Route } from 'react-router-dom';
import FlexGroup from './common/FlexGroup';
import Header from './Header';
import BuildEditor from './BuildEditor';
import ItemSelector from './ItemSelector';
import SignUp from './SignUp';
import Login from './Login';
import Landing from './Landing';
import {
  COLOR_DARK_GREEN,
  COLOR_DARKER_GREEN,
  COLOR_GOLD,
  COLOR_GREEN,
  COLOR_LIGHTEST_GREEN,
} from '../constants';
import { selectSlotType } from '../store/selectors';

const GlobalStyle = createGlobalStyle`
  body {
    background-color: ${COLOR_DARKER_GREEN};
    color: ${COLOR_GOLD};
  }
`;

function App() {
  const slotType = useSelector(selectSlotType);

  const top = (document.documentElement.scrollTop || document.body.scrollTop || 0) + 120;

  return (
    <Background>
      <GlobalStyle />
      {slotType === null ? null : (
        <ModalContainer>
          <Modal
            top={top}
          >
            <ItemSelector />
          </Modal>
        </ModalContainer>
      )}
      <Header />
      <Container>
        <Content>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/builds/:buildId" element={<BuildEditor />} />
          </Routes>
        </Content>
      </Container>
    </Background>
  );
}

const Background = styled(FlexGroup)`
  padding: 50px 0;
  flex-direction: column;
  align-items: center;
  position: relative;
`;

const Container = styled(FlexGroup)`
  background-color: ${COLOR_DARK_GREEN};
  border-radius: 10px;
  flex-direction: column;
  width: 72%;
  box-shadow: 0px 0px 1px ${COLOR_LIGHTEST_GREEN};

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
  padding: 30px;
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
