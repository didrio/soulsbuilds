import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { BELOW_TABLET } from '@/theme';
import { setViewportWidth } from '@/test/viewport';
import { useMediaQuery } from './useMediaQuery';

function Probe() {
  return <p>{useMediaQuery(BELOW_TABLET) ? 'phone' : 'desktop'}</p>;
}

describe('useMediaQuery', () => {
  it('follows the window width', () => {
    render(<Probe />);
    expect(screen.getByText('desktop')).toBeInTheDocument();
    setViewportWidth(390);
    expect(screen.getByText('phone')).toBeInTheDocument();
    setViewportWidth(900);
    expect(screen.getByText('phone')).toBeInTheDocument();
    setViewportWidth(901);
    expect(screen.getByText('desktop')).toBeInTheDocument();
  });
});
