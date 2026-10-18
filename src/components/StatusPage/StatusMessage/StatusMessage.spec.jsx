import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';

import { declaredStyle } from '../../../styleTestUtils';
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
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('wraps a word longer than the line of its message, such as a path, at any character', () => {
    render(<StatusMessage message={`La page /${'a'.repeat(64)} n’existe pas.`} />);

    const message = screen.getByText(/^La page \/a+ n’existe pas\.$/);
    expect(declaredStyle({ element: message, property: 'overflow-wrap' })).toBe('anywhere');
  });

  it('renders without any props', () => {
    expect(() => render(<StatusMessage />)).not.toThrow();
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  describe('action button', () => {
    it('calls the action once per click, without a router', async () => {
      const user = userEvent.setup();
      const onAction = vi.fn();
      render(
        <StatusMessage
          title="Une erreur est survenue"
          actionLabel="Recharger la page"
          onAction={onAction}
        />,
      );

      await user.click(screen.getByRole('button', { name: 'Recharger la page' }));

      expect(onAction).toHaveBeenCalledTimes(1);
      expect(onAction).toHaveBeenCalledWith();
    });

    it('is a plain button, which submits no surrounding form', () => {
      render(<StatusMessage actionLabel="Recharger la page" />);

      expect(screen.getByRole('button', { name: 'Recharger la page' })).toHaveAttribute(
        'type',
        'button',
      );
    });

    it('does nothing when clicked without an action', async () => {
      const user = userEvent.setup();
      const onError = vi.fn();
      window.addEventListener('error', onError);
      render(<StatusMessage actionLabel="Recharger la page" />);

      await user.click(screen.getByRole('button', { name: 'Recharger la page' }));
      window.removeEventListener('error', onError);

      expect(onError).not.toHaveBeenCalled();
    });

    it('is omitted without a label, even with an action', () => {
      render(
        <StatusMessage
          actionLabel=""
          onAction={vi.fn()}
        />,
      );

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('sits next to the home link when both are set', () => {
      render(
        <MemoryRouter>
          <StatusMessage
            actionLabel="Recharger la page"
            homeLinkLabel="Retour à l’accueil"
          />
        </MemoryRouter>,
      );

      expect(screen.getByRole('button', { name: 'Recharger la page' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Retour à l’accueil' })).toBeInTheDocument();
    });
  });

  it('links to the home page in the language of the URL', () => {
    render(
      <MemoryRouter initialEntries={['/en/page-inconnue']}>
        <StatusMessage homeLinkLabel="Back to home" />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: 'Back to home' })).toHaveAttribute('href', '/en/');
  });
});
