import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { emptyEquipment, MOONVEIL } from '@/test/fixtures';
import { renderWithProviders } from '@/test/render';
import GuideSection from './GuideSection';

const withMoonveil = () => ({
  ...emptyEquipment(),
  weapons: [MOONVEIL, null, null, null, null, null],
});

describe('GuideSection', () => {
  it('says there is nothing to find for a build with no items', () => {
    renderWithProviders(<GuideSection equipment={emptyEquipment()} />);
    expect(screen.getByText(/nothing to find/)).toBeInTheDocument();
  });

  it('shows the route directly (loaded with its data)', async () => {
    renderWithProviders(<GuideSection equipment={withMoonveil()} />);
    expect(screen.getByRole('region', { name: 'How to get this build' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Show the route' })).not.toBeInTheDocument();
    expect(await screen.findByText('Moonveil')).toBeInTheDocument();
    expect(screen.getByText(/in this build/)).toBeInTheDocument();
  });

  it('shows progress along the route while tracking', async () => {
    renderWithProviders(
      <GuideSection
        equipment={withMoonveil()}
        tracking={{ collected: [], marked: [], onToggle: () => {}, onMark: () => {} }}
      />,
    );
    expect(await screen.findByText(/stops done/)).toBeInTheDocument();
    expect(screen.getByText(/still to get/)).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /^Moonveil/ })).not.toBeChecked();
  });
});
