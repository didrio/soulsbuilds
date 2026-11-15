// Render helper for component tests: the app's Redux store and a memory router, with a fresh store
// per test. Usage:
//   const { user, store } = renderWithProviders(<BuildsList builds={[...]} />, { route: '/' });
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router';
import { makeStore } from '@/app/store';

export { makeStore };

export function renderWithProviders(ui: ReactElement, { route = '/' }: { route?: string } = {}) {
  const store = makeStore();
  const user = userEvent.setup();
  const result = render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[route]}>
        <Routes>
          <Route path="*" element={ui} />
          <Route path="/build/:buildId" element={<p>build page</p>} />
        </Routes>
      </MemoryRouter>
    </Provider>,
  );
  return { ...result, store, user };
}
