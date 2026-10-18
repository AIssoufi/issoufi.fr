import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { LANGUAGE_STORAGE_KEY } from '../i18n/constants';
import App from './App';

/** Runs the i18n setup again, as on a new page load. */
const reloadI18n = async () => {
  vi.resetModules();
  await import('../i18n');
};

const description = () =>
  document.querySelector('meta[name="description"]').getAttribute('content');

describe('App', () => {
  afterEach(() => {
    window.history.pushState({}, '', '/');
  });

  it.each(['/page-inconnue', '/skills', '/projects/inconnu', '/experiences/inconnu/2'])(
    'shows the not found page at %s without redirecting',
    async path => {
      window.history.pushState({}, '', path);
      render(<App />);

      expect(await screen.findByText('404')).toBeInTheDocument();
      expect(screen.getByText(`La page ${path} n’existe pas.`)).toBeInTheDocument();
      expect(window.location.pathname).toBe(path);
    },
  );

  it('does not render the not found page for known routes', async () => {
    window.history.pushState({}, '', '/experiences');
    render(<App />);

    expect(await screen.findByRole('heading', { name: 'Expériences' })).toBeInTheDocument();
    expect(screen.queryByText('404')).not.toBeInTheDocument();
  });

  it.each([
    ['/projects', 'Projets personnels'],
    ['/experiences', 'Expériences'],
  ])('loads the page at %s on a direct visit', async (path, heading) => {
    window.history.pushState({}, '', path);
    render(<App />);

    expect(await screen.findByRole('heading', { name: heading })).toBeInTheDocument();
  });

  it('renders the home page at once, without waiting for a chunk', () => {
    render(<App />);

    expect(screen.getByRole('link', { name: 'Voir mes projets' })).toBeInTheDocument();
  });

  it('loads the other pages on navigation', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('link', { name: 'Voir mes projets' }));

    expect(await screen.findByRole('heading', { name: 'Projets personnels' })).toBeInTheDocument();
    expect(window.location.pathname).toBe('/projects');
  });

  it('lets the page column shrink to the screen width', () => {
    // A plain 1fr column grows to its widest content and makes narrow screens scroll sideways
    render(<App />);

    expect(getComputedStyle(screen.getByTestId('app')).gridTemplateColumns).toBe('minmax(0, 1fr)');
  });

  describe('language', () => {
    beforeEach(() => {
      document.head.innerHTML = '<meta name="description" content="" />';
      window.history.pushState({}, '', '/projects');
    });

    afterEach(async () => {
      vi.restoreAllMocks();
      localStorage.clear();
      await reloadI18n();
    });

    it('opens in French on a first visit', async () => {
      await reloadI18n();
      render(<App />);

      expect(screen.getByRole('heading', { name: 'Projets personnels' })).toBeInTheDocument();
      expect(document.documentElement.lang).toBe('fr');
      expect(document.title).toBe('Projets - ADAM Issoufi');
    });

    it('opens in the language chosen before the reload, metadata included', async () => {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, 'en');

      await reloadI18n();
      render(<App />);

      expect(screen.getByRole('heading', { name: 'Personal projects' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'English' })).toHaveAttribute(
        'aria-pressed',
        'true',
      );
      expect(document.documentElement.lang).toBe('en');
      expect(document.title).toBe('Projects - ADAM Issoufi');
      expect(description()).toBe(
        'Personal and freelance projects by ADAM Issoufi, full-stack JavaScript developer.',
      );
    });

    it('opens in French when the browser blocks the storage', async () => {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, 'en');
      vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => {
        throw new DOMException('The operation is insecure.', 'SecurityError');
      });

      await reloadI18n();
      render(<App />);

      expect(screen.getByRole('heading', { name: 'Projets personnels' })).toBeInTheDocument();
      expect(document.documentElement.lang).toBe('fr');
      expect(document.title).toBe('Projets - ADAM Issoufi');
    });
  });
});
