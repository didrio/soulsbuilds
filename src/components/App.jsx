import styled, { createGlobalStyle } from 'styled-components';
import { useSelector } from 'react-redux';
import FlexGroup from './common/FlexGroup';
import Header from './Header';
import BuildEditor from './BuildEditor';
import ItemSelector from './ItemSelector';
import {
  COLOR_DARK_GRAY,
  COLOR_DARKEST_GRAY,
  COLOR_LIGHT_GRAY,
} from '../constants';
import { selectSlotType } from '../store/selectors';

const GlobalStyle = createGlobalStyle`
  body {
    background-color: ${COLOR_DARKEST_GRAY};
    color: ${COLOR_LIGHT_GRAY};
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
      <Container>
        <Header />
        <Content>
          <BuildEditor />
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
  background-color: ${COLOR_DARK_GRAY};
  border-radius: 10px;
  flex-direction: column;
  width: 80%;
`;

const Content = styled(FlexGroup)`
  flex-direction: column;
  padding: 50px;
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
  background-color: ${COLOR_LIGHT_GRAY};
  width: 70vw;
  height: 70vh;
  border-radius: 10px;
  padding: 20px;
  margin-top: ${({ top }) => top}px;
`;

export default App;
