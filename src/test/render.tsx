// Render helper for component tests: a fresh Redux store, QueryClient (no retries) and memory
// router per test, plus a fixed signed-in user. Usage:
//   const { user, store } = renderWithProviders(<BuildsList builds={[...]} />, { route: '/' });
//   renderWithProviders(<Header />, { uid: 'alice' });
//   renderWithProviders(<Profile />, { route: '/user/alice', path: '/user/:userId' });
//   renderWithProviders(<AccountPage />, { uid: 'alice', providers: ['google.com'] });
// With the default path ('*') any /build/:id navigation shows "build page"; with a specific path,
// navigating anywhere else shows "other page".
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router';
import { makeStore } from '@/app/store';
import { AuthContext, SIGNED_OUT, authValue, type AuthValue } from '@/features/auth/authContext';
import type { AuthUser } from '@/lib/firebase';

export { makeStore };

export function renderWithProviders(
  ui: ReactElement,
  {
    route = '/',
    path = '*',
    uid = null,
    providers = ['password'],
    emailVerified = true,
    email = uid ? `${uid}@example.com` : null,
    refreshUser = () => Promise.resolve(),
  }: {
    route?: string;
    path?: string;
    uid?: string | null;
    /** The signed-in user's sign-in methods (`'password'`, `'google.com'`). */
    providers?: string[];
    emailVerified?: boolean;
    email?: string | null;
    refreshUser?: () => Promise<void>;
  } = {},
) {
  const store = makeStore();
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const auth: AuthValue = uid
    ? authValue(
        {
          uid,
          email,
          emailVerified,
          providerData: providers.map((providerId) => ({ providerId })),
        } as AuthUser,
        refreshUser,
      )
    : SIGNED_OUT;
  const user = userEvent.setup();
  const result = render(
    <QueryClientProvider client={queryClient}>
      <AuthContext value={auth}>
        <Provider store={store}>
          <MemoryRouter initialEntries={[route]}>
            <Routes>
              <Route path={path} element={ui} />
              {path === '*' ? (
                <Route path="/build/:buildId/*" element={<p>build page</p>} />
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
