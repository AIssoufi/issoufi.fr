// First, so that the background photo starts downloading before the app is evaluated
import './preloadBackgroundPhoto.ts';

import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App/App.tsx';

import './i18n/index.ts';

const root = ReactDOM.createRoot(document.getElementById('welcome') as HTMLElement);

root.render(
  <StrictMode>
    <App />
  </StrictMode>,
);
