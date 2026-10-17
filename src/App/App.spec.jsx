import { render, screen } from '@testing-library/react';

import App from './App';

describe('App', () => {
  afterEach(() => {
    window.history.pushState({}, '', '/');
  });

  it('renders the not found page for unknown routes', () => {
    window.history.pushState({}, '', '/page-inconnue');
    render(<App />);
    expect(screen.getByText('404')).toBeInTheDocument();
  });

  it('does not render the not found page for known routes', () => {
    window.history.pushState({}, '', '/experiences');
    render(<App />);
    expect(screen.queryByText('404')).not.toBeInTheDocument();
  });
});
