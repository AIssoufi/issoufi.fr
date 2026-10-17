import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import { ThemeProvider } from '@xstyled/styled-components';

import { Experiences, Home, NotFound, Projects } from '../pages';
import { GlobalStyle, theme } from '../theme';
import DocumentMeta from './DocumentMeta';
import Header from './Header';
import LangToggle from './LangToggle/LangToggle';

import { WebApp } from './App.styled';

/**
 * Root of the application: the design-token theme and global styles, the router, the header,
 * the language toggle, the document metadata and the routes. Unknown paths render
 * {@link NotFound} at the requested URL, without redirecting.
 */
function App() {
  return (
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      <Router>
        <DocumentMeta />
        <WebApp data-testid="app">
          <Header />
          <LangToggle />
          <Routes>
            <Route
              path="/projects"
              element={<Projects />}
            />
            <Route
              path="/experiences"
              element={<Experiences />}
            />
            <Route
              path="/"
              element={<Home />}
            />
            <Route
              path="*"
              element={<NotFound />}
            />
          </Routes>
        </WebApp>
      </Router>
    </ThemeProvider>
  );
}

export default App;
