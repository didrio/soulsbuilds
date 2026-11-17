import { useQuery } from '@tanstack/react-query';
import { applyEmailLink, checkPasswordResetCode } from '@/lib/firebase';
import { queryKeys } from '@/lib/queryKeys';

// An email link works once, so these run once per link: no retries, and no refetch when the tab
// regains focus (that would apply a verification link a second time and report it as used).
const ONCE = {
  staleTime: Infinity,
  retry: false,
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
} as const;

/** The email a password-reset link is for; an error when the link is dead (`isDeadLink`). */
export function useResetLink(code: string) {
  return useQuery({
    queryKey: queryKeys.actionLink('resetPassword', code),
    queryFn: () => checkPasswordResetCode(code),
    ...ONCE,
  });
}

/** Applies a verify-email (or confirm-new-email) link on first use. */
export function useVerifyLink(code: string) {
  return useQuery({
    queryKey: queryKeys.actionLink('verifyEmail', code),
    queryFn: async () => {
      await applyEmailLink(code);
      return true;
    },
    ...ONCE,
  });
}
