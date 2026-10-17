import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import { Experiences, Home, NotFound, Projects } from '../pages';
import DocumentMeta from './DocumentMeta';
import Header from './Header';
import LangToggle from './LangToggle/LangToggle';

import { WebApp } from './App.styled';

function App() {
  return (
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
  );
}

export default App;
