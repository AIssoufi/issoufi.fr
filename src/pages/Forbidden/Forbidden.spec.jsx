import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';

import { Forbidden } from './Forbidden.tsx';

const renderForbidden = props =>
  render(
    <MemoryRouter>
      <Forbidden {...props} />
    </MemoryRouter>,
  );

describe('Forbidden', () => {
  it('says that access is denied', () => {
    renderForbidden();

    expect(screen.getByText('403')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Accès refusé' })).toBeInTheDocument();
    expect(
      screen.getByText('Vous n’avez pas l’autorisation d’accéder à cette page.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Retour à l’accueil' })).toHaveAttribute('href', '/');
  });

  it('has a single main landmark and a single level 1 heading', () => {
    renderForbidden();

    expect(screen.getAllByRole('main')).toHaveLength(1);
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  });

  it('accepts a custom title and message', () => {
    renderForbidden({ title: 'Réservé', message: 'Connectez-vous pour continuer.' });

    expect(screen.getByRole('heading', { name: 'Réservé' })).toBeInTheDocument();
    expect(screen.getByText('Connectez-vous pour continuer.')).toBeInTheDocument();
  });
});
