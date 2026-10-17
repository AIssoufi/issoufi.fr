import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import StatusMessage from './StatusMessage';

describe('StatusMessage', () => {
  it('renders the code, title, message and home link', () => {
    render(
      <MemoryRouter>
        <StatusMessage
          code={404}
          title="Page introuvable"
          message="La page /skills n'existe pas."
          homeLinkLabel="Retour à l'accueil"
        />
      </MemoryRouter>,
    );

    expect(screen.getByText('404')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Page introuvable' })).toBeInTheDocument();
    expect(screen.getByText("La page /skills n'existe pas.")).toBeInTheDocument();
    expect(screen.getByRole('link', { name: "Retour à l'accueil" })).toHaveAttribute('href', '/');
  });

  it('renders without any props', () => {
    expect(() => render(<StatusMessage />)).not.toThrow();
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
});
