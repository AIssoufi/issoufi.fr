import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter as Router } from 'react-router-dom';

import Header from './Header';

const renderHeader = () =>
  render(
    <Router>
      <Header testId="header" />
    </Router>,
  );

describe('Header', () => {
  it('renders the header', () => {
    renderHeader();
    expect(screen.getByTestId('header')).toBeInTheDocument();
  });

  it('renders the logo', () => {
    renderHeader();
    expect(screen.getByText('AI')).toBeInTheDocument();
  });

  it('renders all nav items', () => {
    renderHeader();
    expect(screen.getByText('Accueil')).toBeInTheDocument();
    expect(screen.getByText('Projets')).toBeInTheDocument();
    expect(screen.getByText('Expériences')).toBeInTheDocument();
  });

  it('does not render a skills nav item', () => {
    renderHeader();
    expect(screen.queryByText('Compétences')).not.toBeInTheDocument();
  });

  it('renders the CV button', () => {
    renderHeader();
    expect(screen.getByText('CV')).toBeInTheDocument();
  });

  it('renders nav links with correct hrefs', () => {
    renderHeader();
    expect(screen.getByText('Accueil').closest('a')).toHaveAttribute('href', '/');
    expect(screen.getByText('Projets').closest('a')).toHaveAttribute('href', '/projects');
    expect(screen.getByText('Expériences').closest('a')).toHaveAttribute('href', '/experiences');
  });

  it('renders CV link pointing to the PDF', () => {
    renderHeader();
    expect(screen.getByText('CV').closest('a')).toHaveAttribute('href', '/CV - Adam Issoufi.pdf');
  });
});
