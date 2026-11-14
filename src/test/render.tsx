// Render helper for component tests: the same providers as src/index.jsx (Redux store, router,
// styled-components prop filter), with a fresh store per test. Usage:
//   const { user, store } = renderWithProviders(<BuildsList builds={[...]} />, { route: '/' });
import isPropValid from '@emotion/is-prop-valid';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router';
import { StyleSheetManager } from 'styled-components';
import { configureStore } from '@reduxjs/toolkit';
import appReducer from '../store/app';
import equipmentReducer from '../store/equipment';
import spellsReducer from '../store/spells';
import statsReducer from '../store/stats';
import tearsReducer from '../store/tears';

export const makeStore = () =>
  configureStore({
    reducer: {
      app: appReducer,
      equipment: equipmentReducer,
      spells: spellsReducer,
      stats: statsReducer,
      tears: tearsReducer,
    },
  });

const shouldForwardProp = (prop: string, target: unknown) =>
  typeof target === 'string' ? isPropValid(prop) : true;

export function renderWithProviders(ui: ReactElement, { route = '/' }: { route?: string } = {}) {
  const store = makeStore();
  const user = userEvent.setup();
  const result = render(
    <StyleSheetManager shouldForwardProp={shouldForwardProp}>
      <Provider store={store}>
        <MemoryRouter initialEntries={[route]}>
          <Routes>
            <Route path="*" element={ui} />
            <Route path="/build/:buildId" element={<p>build page</p>} />
          </Routes>
        </MemoryRouter>
      </Provider>
    </StyleSheetManager>,
  );
  return { ...result, store, user };
}
