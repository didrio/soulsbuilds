import { useState, type ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router';
import AuthProvider from '@/features/auth/AuthProvider';
import { makeQueryClient } from './queryClient';
import store from './store';

/**
 * App-wide providers: server data (TanStack Query), the signed-in user, the Redux store (the build
 * being edited) and the router.
 */
function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(makeQueryClient);
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Provider store={store}>
          <BrowserRouter>{children}</BrowserRouter>
        </Provider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default AppProviders;
