import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App/App';

import './i18n/index';

const root = ReactDOM.createRoot(document.getElementById('welcome') as HTMLElement);

root.render(
  <StrictMode>
    <App />
  </StrictMode>,
);
