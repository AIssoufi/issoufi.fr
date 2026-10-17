import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { NotFound } from './NotFound';

const renderAt = (path, props) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <NotFound {...props} />
    </MemoryRouter>,
  );

describe('NotFound', () => {
  it('says that the current page does not exist', () => {
    renderAt('/skills');

    expect(screen.getByText('404')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Page introuvable' })).toBeInTheDocument();
    expect(screen.getByText("La page /skills n'existe pas.")).toBeInTheDocument();
    expect(screen.getByRole('link', { name: "Retour à l'accueil" })).toHaveAttribute('href', '/');
  });

  it('accepts a custom title and message', () => {
    renderAt('/projects/inconnu', {
      title: 'Projet introuvable',
      message: "Ce projet n'existe pas.",
    });

    expect(screen.getByRole('heading', { name: 'Projet introuvable' })).toBeInTheDocument();
    expect(screen.getByText("Ce projet n'existe pas.")).toBeInTheDocument();
  });
});
