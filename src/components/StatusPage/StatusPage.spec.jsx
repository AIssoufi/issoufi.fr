import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';

import StatusPage from './StatusPage';

const getMain = () => screen.getByRole('main');

describe('StatusPage', () => {
  it('renders the status message in the main landmark of the page', () => {
    render(
      <MemoryRouter>
        <StatusPage
          code={404}
          title="Page introuvable"
          message="La page /skills n’existe pas."
          homeLinkLabel="Retour à l’accueil"
        />
      </MemoryRouter>,
    );

    const main = getMain();
    expect(main).toContainElement(screen.getByText('404'));
    expect(main).toContainElement(screen.getByRole('heading', { name: 'Page introuvable' }));
    expect(main).toContainElement(screen.getByText('La page /skills n’existe pas.'));
    expect(screen.getByRole('link', { name: 'Retour à l’accueil' })).toHaveAttribute('href', '/');
  });

  it('passes the action on to its message', async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    render(
      <StatusPage
        actionLabel="Recharger la page"
        onAction={onAction}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Recharger la page' }));

    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('renders a single main landmark without any props or router', () => {
    expect(() => render(<StatusPage />)).not.toThrow();
    expect(screen.getAllByRole('main')).toHaveLength(1);
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
});
