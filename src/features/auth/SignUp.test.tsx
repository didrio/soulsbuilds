import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '@/test/render';
import SignUp from './SignUp';

const signUp = vi.hoisted(() => vi.fn());
vi.mock('@/lib/firebase', () => ({
  signUp,
  errorMessage: () => 'An account with that email already exists. Try logging in.',
}));

describe('SignUp', () => {
  it('needs an email, a password and a display name', async () => {
    const { user } = renderWithProviders(<SignUp onDone={() => {}} onSwitch={() => {}} />);
    const create = screen.getByRole('button', { name: 'Create account' });
    await user.type(screen.getByLabelText('Email'), 'new@example.test');
    await user.type(screen.getByLabelText('Password'), 'secret-123');
    expect(create).toBeDisabled();
    await user.type(screen.getByLabelText('Display name'), '   ');
    expect(create).toBeDisabled();
    await user.type(screen.getByLabelText('Display name'), 'Melina');
    expect(create).toBeEnabled();
  });

  it('shows why registering failed, and submits on Enter', async () => {
    signUp.mockRejectedValue(new Error('auth/email-already-in-use'));
    const onDone = vi.fn();
    const { user } = renderWithProviders(<SignUp onDone={onDone} onSwitch={() => {}} />);
    await user.type(screen.getByLabelText('Email'), 'taken@example.test');
    await user.type(screen.getByLabelText('Password'), 'secret-123');
    await user.type(screen.getByLabelText('Display name'), 'Melina{Enter}');
    expect(await screen.findByRole('alert')).toHaveTextContent('already exists');
    expect(signUp).toHaveBeenCalledWith('taken@example.test', 'secret-123', 'Melina');
    expect(onDone).not.toHaveBeenCalled();
  });
});
