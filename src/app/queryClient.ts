import { QueryClient } from '@tanstack/react-query';

/** A QueryClient with the app's defaults (tests make their own with retries off). */
export const makeQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false },
    },
  });
