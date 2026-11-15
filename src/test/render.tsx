// Render helper for component tests: a fresh Redux store, QueryClient (no retries) and memory
// router per test, plus a fixed signed-in user. Usage:
//   const { user, store } = renderWithProviders(<BuildsList builds={[...]} />, { route: '/' });
//   renderWithProviders(<Header />, { uid: 'alice' });
//   renderWithProviders(<Profile />, { route: '/user/alice', path: '/user/:userId' });
// With the default path ('*') any /build/:id navigation shows "build page"; with a specific path,
// navigating anywhere else shows "other page".
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router';
import { makeStore } from '@/app/store';
import { AuthContext, SIGNED_OUT, type AuthValue } from '@/features/auth/authContext';
import type { AuthUser } from '@/lib/firebase';

export { makeStore };

export function renderWithProviders(
  ui: ReactElement,
  {
    route = '/',
    path = '*',
    uid = null,
  }: { route?: string; path?: string; uid?: string | null } = {},
) {
  const store = makeStore();
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const auth: AuthValue = uid ? { loading: false, uid, user: { uid } as AuthUser } : SIGNED_OUT;
  const user = userEvent.setup();
  const result = render(
    <QueryClientProvider client={queryClient}>
      <AuthContext value={auth}>
        <Provider store={store}>
          <MemoryRouter initialEntries={[route]}>
            <Routes>
              <Route path={path} element={ui} />
              {path === '*' ? (
                <Route path="/build/:buildId" element={<p>build page</p>} />
              ) : (
                <Route path="*" element={<p>other page</p>} />
              )}
            </Routes>
          </MemoryRouter>
        </Provider>
      </AuthContext>
    </QueryClientProvider>,
  );
  return { ...result, store, user, queryClient };
}
