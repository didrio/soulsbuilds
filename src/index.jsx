import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router';
import isPropValid from '@emotion/is-prop-valid';
import { StyleSheetManager } from 'styled-components';
import './index.css';
import App from './components/App';
import store from './store';

// styled-components v6 forwards every prop to the DOM; v5 filtered unknown ones. This restores the
// v5 behaviour for the 2022 components (which style with props like `vertical`, `top`, `visible`).
// T2 moves those to transient `$props` and deletes this shim.
const shouldForwardProp = (prop, target) => (typeof target === 'string' ? isPropValid(prop) : true);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <StyleSheetManager shouldForwardProp={shouldForwardProp}>
      <Provider store={store}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </Provider>
    </StyleSheetManager>
  </StrictMode>,
);
