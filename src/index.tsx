// First, so that the background photo starts downloading before the app is evaluated
import './preloadBackgroundPhoto.ts';

import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App/App.tsx';
import { APP_CONTAINER_ID, canHydrate } from './utils/prerender.ts';

import './i18n/index.ts';

const container = document.getElementById(APP_CONTAINER_ID) as HTMLElement;
const app = (
  <StrictMode>
    <App />
  </StrictMode>
);

// The build wrote the page of the current path in the container: React takes over its elements.
// Anywhere else, it renders the app from scratch in place of what the container holds
if (canHydrate({ container, pathname: window.location.pathname })) {
  ReactDOM.hydrateRoot(container, app);
} else {
  ReactDOM.createRoot(container).render(app);
}
