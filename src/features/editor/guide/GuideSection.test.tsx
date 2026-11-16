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
  it('is left out for a build with no items', () => {
    const { container } = renderWithProviders(<GuideSection equipment={emptyEquipment()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('starts collapsed; Show loads the route, Hide folds it away', async () => {
    const { user } = renderWithProviders(<GuideSection equipment={withMoonveil()} />);
    const section = screen.getByRole('region', { name: 'How to get this build' });
    expect(section).toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 3 })).not.toBeInTheDocument();

    const toggle = screen.getByRole('button', { name: 'Show the route' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect((await screen.findAllByRole('heading', { level: 3 })).length).toBeGreaterThan(0);

    await user.click(screen.getByRole('button', { name: 'Hide the route' }));
    expect(screen.queryByRole('heading', { level: 3 })).not.toBeInTheDocument();
  });
});
