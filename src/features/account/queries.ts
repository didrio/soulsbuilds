// Server data for the Account page (T31; TanStack Query over src/lib/firebase). The display name's
// mutation is the profile's (`useUpdateDisplayName`); email and password changes live in Auth only.
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteAccount, type AccountProgress } from '@/lib/firebase';

/**
 * Deletes the signed-in user's account and everything they published (T18). `password` is null for a
 * Google-only account, which confirms in a Google window instead (T30); the result is false when they
 * close it (nothing was deleted). On success every cached query is dropped: their builds, likes and
 * comments are gone from every list.
 */
export function useDeleteAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      password,
      onProgress,
    }: {
      password: string | null;
      onProgress?: AccountProgress;
    }) => deleteAccount(password, onProgress),
    onSuccess: (deleted) => {
      if (deleted) queryClient.clear();
    },
  });
}
