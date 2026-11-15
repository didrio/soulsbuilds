import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '@/test/render';
import ReportButton from './ReportButton';

const firebase = vi.hoisted(() => ({ reportContent: vi.fn() }));
vi.mock('@/lib/firebase', () => ({
  ...firebase,
  errorMessage: () => 'Something went wrong. Please try again.',
}));

beforeEach(() => vi.resetAllMocks());

const target = { buildId: 'B1', commentId: 'c1' };

describe('ReportButton', () => {
  it('is hidden when signed out and on your own content', () => {
    const { unmount } = renderWithProviders(
      <ReportButton target={target} authorId="bob" kind="comment" />,
    );
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    unmount();
    renderWithProviders(<ReportButton target={target} authorId="bob" kind="comment" />, {
      uid: 'bob',
    });
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('sends a reason and note, then thanks the reporter', async () => {
    firebase.reportContent.mockResolvedValue('reported');
    const { user } = renderWithProviders(
      <ReportButton target={target} authorId="bob" kind="comment" />,
      { uid: 'carol' },
    );
    await user.click(screen.getByRole('button', { name: 'Report this comment' }));
    const send = screen.getByRole('button', { name: 'Send report' });
    expect(send).toBeDisabled();
    await user.selectOptions(screen.getByRole('combobox', { name: 'Reason' }), 'Harassment');
    await user.type(screen.getByRole('textbox', { name: 'Details (optional)' }), 'rude');
    await user.click(send);
    expect(await screen.findByRole('status')).toHaveTextContent('an admin will take a look');
    expect(firebase.reportContent).toHaveBeenCalledWith('carol', target, 'harassment', 'rude');
  });

  it('says so when already reported; Escape closes the form', async () => {
    firebase.reportContent.mockResolvedValue('already-reported');
    const { user } = renderWithProviders(
      <ReportButton target={{ buildId: 'B1' }} authorId="alice" kind="build" />,
      { uid: 'carol' },
    );
    const toggle = screen.getByRole('button', { name: 'Report this build' });
    await user.click(toggle);
    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Reason' }),
      'Spam or advertising',
    );
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('form')).not.toBeInTheDocument();
    expect(toggle).toHaveFocus();
    await user.click(toggle);
    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Reason' }),
      'Spam or advertising',
    );
    await user.click(screen.getByRole('button', { name: 'Send report' }));
    expect(await screen.findByRole('status')).toHaveTextContent('already reported this build');
  });
});
