import { act, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { setAppCheckStatus } from '@/lib/firebase/appCheckStatus';
import { renderWithProviders } from '@/test/render';
import AppCheckNotice from './AppCheckNotice';

describe('AppCheckNotice', () => {
  afterEach(() => setAppCheckStatus('ok'));

  it('renders nothing while App Check is fine', () => {
    renderWithProviders(<AppCheckNotice />);
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('explains a blocked reCAPTCHA and offers a reload', () => {
    renderWithProviders(<AppCheckNotice />);
    act(() => setAppCheckStatus('blocked'));
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Couldn’t verify your browser');
    expect(alert).toHaveTextContent('blocker may be blocking Google reCAPTCHA');
    expect(screen.getByRole('button', { name: 'Reload' })).toBeInTheDocument();
  });
});
