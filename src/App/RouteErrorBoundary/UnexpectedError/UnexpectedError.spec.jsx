import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import i18n from '../../../i18n';
import UnexpectedError from './UnexpectedError';

describe('UnexpectedError', () => {
  let reload;

  beforeEach(() => {
    reload = vi.fn();
    // jsdom does not let tests replace location.reload itself
    vi.stubGlobal('location', { ...window.location, reload });
  });

  afterEach(async () => {
    vi.unstubAllGlobals();
    await act(() => i18n.changeLanguage('fr'));
  });

  it('renders without any props or router', () => {
    expect(() => render(<UnexpectedError />)).not.toThrow();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('says in French that the page could not be displayed, without a status code', () => {
    const { container } = render(<UnexpectedError />);

    expect(screen.getByRole('heading', { name: 'Une erreur est survenue' })).toBeInTheDocument();
    expect(
      screen.getByText('Cette page n’a pas pu s’afficher. Rechargez-la pour réessayer.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Recharger la page' })).toBeInTheDocument();
    expect(container).not.toHaveTextContent(/\d/);
  });

  it('has a single main landmark and a single level 1 heading', () => {
    render(<UnexpectedError />);

    expect(screen.getAllByRole('main')).toHaveLength(1);
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  });

  it('says it in English once the language is switched', async () => {
    render(<UnexpectedError />);

    await act(() => i18n.changeLanguage('en'));

    expect(screen.getByRole('heading', { name: 'Something went wrong' })).toBeInTheDocument();
    expect(
      screen.getByText('This page could not be displayed. Reload it to try again.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reload the page' })).toBeInTheDocument();
  });

  it('reloads the page once per click on the button', async () => {
    const user = userEvent.setup();
    render(<UnexpectedError />);

    await user.click(screen.getByRole('button', { name: 'Recharger la page' }));

    expect(reload).toHaveBeenCalledTimes(1);
  });
});
