import styled from 'styled-components';
import { COLOR_LIGHT_GRAY } from '@/theme';

/** A spinning ring, `size` px square. */
function LoadingAnimation({ size = 20 }: { size?: number }) {
  return (
    <Container $size={`${size}px`}>
      <div />
      <div />
      <div />
      <div />
    </Container>
  );
}

const Container = styled.div<{ $size: string }>`
  display: inline-block;
  position: relative;
  width: ${({ $size }) => $size};
  height: ${({ $size }) => $size};

  & div {
    box-sizing: border-box;
    display: block;
    position: absolute;
    width: ${({ $size }) => $size};
    height: ${({ $size }) => $size};
    border: 2px solid ${COLOR_LIGHT_GRAY};
    border-radius: 50%;
    animation: lds-ring 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
    border-color: ${COLOR_LIGHT_GRAY} transparent transparent transparent;
  }

  & div:nth-child(1) {
    animation-delay: -0.45s;
  }

  & div:nth-child(2) {
    animation-delay: -0.3s;
  }

  & div:nth-child(3) {
    animation-delay: -0.15s;
  }

  @keyframes lds-ring {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`;

export default LoadingAnimation;
