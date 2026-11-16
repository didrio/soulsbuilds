import styled, { keyframes } from 'styled-components';
import { COLOR_ACCENT, COLOR_FRAME_SOFT } from '@/theme';

/**
 * A spinning ring, `size` px square, labelled "Loading". With reduced motion (GlobalStyle) it stops
 * spinning but stays visible.
 */
function LoadingAnimation({ size = 20 }: { size?: number }) {
  return <Ring role="img" aria-label="Loading" $size={`${size}px`} />;
}

const spin = keyframes`
  to {
    transform: rotate(360deg);
  }
`;

const Ring = styled.span<{ $size: string }>`
  animation: ${spin} 0.9s linear infinite;
  border: 2px solid ${COLOR_FRAME_SOFT};
  border-radius: 50%;
  border-top-color: ${COLOR_ACCENT};
  display: inline-block;
  height: ${({ $size }) => $size};
  width: ${({ $size }) => $size};
`;

export default LoadingAnimation;
