import React from 'react';
import ReactDOM from 'react-dom/client';
import { initializeApp } from 'firebase/app';
import { Provider } from 'react-redux';
import './index.css';
import App from './components/App';
import reportWebVitals from './reportWebVitals';
import store from './store';

const firebaseConfig = {
  apiKey: 'AIzaSyB2A_BSdKqYsLDe2jPSKbnMyu8JxhJFtow',
  authDomain: 'soulsbuilds.firebaseapp.com',
  projectId: 'soulsbuilds',
  storageBucket: 'soulsbuilds.appspot.com',
  messagingSenderId: '981152509260',
  appId: '1:981152509260:web:a637087018de332b29b3e9',
  measurementId: 'G-EXTD6Y44QT',
};

initializeApp(firebaseConfig);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>,
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
