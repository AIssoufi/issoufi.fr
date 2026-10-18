import { act, cleanup, render, screen } from '@testing-library/react';
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

/** Query of the French page title of /projects, which only screen readers announce. */
const PROJECTS_PAGE_TITLE = { level: 1, name: 'Projets' };

describe('App', () => {
  // Vite transforms a lazily loaded page on its first import, which can outlast the timeout of a
  // `findBy` query: import them once before the tests, which still load them through React.lazy
  beforeAll(() =>
    Promise.all([
      import('../pages/Projects'),
      import('../pages/Experiences'),
      import('../pages/NotFound'),
    ]),
  );

  afterEach(() => {
    vi.restoreAllMocks();
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

  it.each(['/', '/projects', '/experiences', '/page-inconnue', '/en/', '/en/experiences'])(
    'gives the page at %s a single main landmark and a single level 1 heading, with the header',
    async path => {
      window.history.pushState({}, '', path);
      render(<App />);

      expect(await screen.findAllByRole('main')).toHaveLength(1);
      expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    },
  );

  it('renders the home page at once, without waiting for a chunk', () => {
    render(<App />);

    expect(screen.getByRole('link', { name: 'Voir mes projets' })).toBeInTheDocument();
  });

  it.each([
    ['/en/', 'link', 'View my projects'],
    ['/en', 'link', 'View my projects'],
    ['/en/projects', 'heading', 'Personal projects'],
    ['/en/experiences', 'heading', 'Experience'],
  ])('shows the English page at %s on a direct visit', async (path, role, name) => {
    window.history.pushState({}, '', path);
    render(<App />);

    expect(await screen.findByRole(role, { name })).toBeInTheDocument();
    expect(document.documentElement.lang).toBe('en');
  });

  it.each(['/en/page-inconnue', '/en/projects/inconnu'])(
    'shows the not found page in English at %s',
    async path => {
      window.history.pushState({}, '', path);
      render(<App />);

      expect(await screen.findByText(`The page ${path} does not exist.`)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Back to home' })).toHaveAttribute('href', '/en/');
    },
  );

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

  describe('focus after a navigation', () => {
    it('leaves the focus alone on the first load', async () => {
      window.history.pushState({}, '', '/projects');
      render(<App />);

      expect(await screen.findByRole('heading', PROJECTS_PAGE_TITLE)).not.toHaveFocus();
      expect(document.body).toHaveFocus();
    });

    it('moves the focus to the new page after a link of the mobile menu is chosen with the keyboard', async () => {
      const user = userEvent.setup();
      render(<App />);
      screen.getByRole('button', { name: 'Ouvrir le menu' }).focus();

      await user.keyboard('{Enter}');
      await user.tab();
      await user.tab();
      expect(screen.getByRole('link', { name: 'Projets' })).toHaveFocus();
      await user.keyboard('{Enter}');

      expect(await screen.findByRole('heading', PROJECTS_PAGE_TITLE)).toHaveFocus();
      expect(screen.getByRole('button', { name: 'Ouvrir le menu' })).toHaveAttribute(
        'aria-expanded',
        'false',
      );
    });

    it('moves the focus to the new page after a link of the page is chosen with the keyboard', async () => {
      const user = userEvent.setup();
      render(<App />);
      screen.getByRole('link', { name: 'Expériences professionnelles' }).focus();

      await user.keyboard('{Enter}');

      expect(await screen.findByRole('heading', { name: 'Expériences' })).toHaveFocus();
    });

    it('draws no focus ring around the heading, which is not a control', async () => {
      const user = userEvent.setup();
      render(<App />);
      screen.getByRole('link', { name: 'Voir mes projets' }).focus();

      await user.keyboard('{Enter}');

      const heading = await screen.findByRole('heading', PROJECTS_PAGE_TITLE);
      expect(heading).toHaveFocus();
      expect(getComputedStyle(heading).outline).toBe('none');
    });
  });

  describe('when a page fails', () => {
    /** Error of a chunk that cannot be fetched, as the browser reports it. */
    const CHUNK_ERROR = new TypeError(
      'Failed to fetch dynamically imported module: https://issoufi.fr/assets/Projects-abc123.js',
    );

    /**
     * Imports the app again with one of its pages replaced, so that its lazy pages load anew.
     * `page` is the path of the page module, as `App` imports it.
     */
    const importAppWith = async ({ page, factory }) => {
      vi.resetModules();
      vi.doMock(page, factory);
      const { default: AppWithFailingPage } = await import('./App');
      return AppWithFailingPage;
    };

    beforeEach(() => {
      // React logs every caught error
      vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(async () => {
      // Unmounts first, so that the language reset below updates no mounted page
      cleanup();
      vi.doUnmock('../pages/Experiences');
      vi.doUnmock('../pages/Projects');
      vi.restoreAllMocks();
      localStorage.clear();
      await reloadI18n();
    });

    it('shows the error below a header that still works when a page throws', async () => {
      const user = userEvent.setup();
      const AppWithFailingPage = await importAppWith({
        page: '../pages/Experiences',
        factory: () => ({
          default: () => {
            throw new Error('Broken page');
          },
        }),
      });
      window.history.pushState({}, '', '/experiences');
      render(<AppWithFailingPage />);

      expect(
        await screen.findByRole('heading', { name: 'Une erreur est survenue' }),
      ).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Recharger la page' })).toBeInTheDocument();

      // The navigation is hidden on the narrow jsdom screen, hence a query by text
      await user.click(screen.getByText('Projets'));

      expect(
        await screen.findByRole('heading', { name: 'Projets personnels' }),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole('heading', { name: 'Une erreur est survenue' }),
      ).not.toBeInTheDocument();
    });

    it('shows the error when a page fails to load, in English after the toggle', async () => {
      const user = userEvent.setup();
      const AppWithFailingPage = await importAppWith({
        page: '../pages/Projects',
        factory: () => {
          throw CHUNK_ERROR;
        },
      });
      window.history.pushState({}, '', '/projects');
      render(<AppWithFailingPage />);

      expect(
        await screen.findByRole('heading', { name: 'Une erreur est survenue' }),
      ).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: 'English' }));

      expect(screen.getByRole('heading', { name: 'Something went wrong' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Reload the page' })).toBeInTheDocument();

      await user.click(screen.getByText('Experience'));

      expect(await screen.findByRole('heading', { name: 'Experience' })).toBeInTheDocument();
    });
  });

  describe('language', () => {
    beforeEach(() => {
      document.head.innerHTML = '<meta name="description" content="" />';
      window.history.pushState({}, '', '/projects');
    });

    afterEach(async () => {
      // Unmounts first, so that the language reset below updates no mounted page
      cleanup();
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

    it('opens an English URL in English, metadata included', async () => {
      window.history.pushState({}, '', '/en/projects');

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

    it('opens the root at the English home page when English was chosen before', async () => {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, 'en');
      window.history.pushState({}, '', '/');

      await reloadI18n();
      render(<App />);

      expect(window.location.pathname).toBe('/en/');
      expect(screen.getByRole('link', { name: 'View my projects' })).toHaveAttribute(
        'href',
        '/en/projects',
      );
      expect(document.documentElement.lang).toBe('en');
    });

    it('opens a French URL in French, whatever the language chosen before', async () => {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, 'en');

      await reloadI18n();
      render(<App />);

      expect(window.location.pathname).toBe('/projects');
      expect(screen.getByRole('heading', { name: 'Projets personnels' })).toBeInTheDocument();
      expect(document.documentElement.lang).toBe('fr');
    });

    it('opens the root in French when the browser blocks the storage', async () => {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, 'en');
      vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => {
        throw new DOMException('The operation is insecure.', 'SecurityError');
      });
      window.history.pushState({}, '', '/');

      await reloadI18n();
      render(<App />);

      expect(window.location.pathname).toBe('/');
      expect(screen.getByRole('link', { name: 'Voir mes projets' })).toBeInTheDocument();
      expect(document.documentElement.lang).toBe('fr');
    });

    it('switches the URL and the language with the toggle, and back with the back button', async () => {
      const user = userEvent.setup();
      render(<App />);

      await user.click(screen.getByRole('button', { name: 'English' }));

      expect(window.location.pathname).toBe('/en/projects');
      expect(screen.getByRole('heading', { name: 'Personal projects' })).toBeInTheDocument();
      expect(document.title).toBe('Projects - ADAM Issoufi');
      // Only the language changed: the focus stays on the toggle
      expect(screen.getByRole('button', { name: 'English' })).toHaveFocus();

      await act(async () => window.history.back());

      expect(
        await screen.findByRole('heading', { name: 'Projets personnels' }),
      ).toBeInTheDocument();
      expect(window.location.pathname).toBe('/projects');
      expect(document.documentElement.lang).toBe('fr');
    });

    it('keeps the English pages when following their links', async () => {
      const user = userEvent.setup();
      window.history.pushState({}, '', '/en/');
      render(<App />);

      await user.click(screen.getByRole('link', { name: 'Professional experience' }));

      expect(await screen.findByRole('heading', { name: 'Experience' })).toBeInTheDocument();
      expect(window.location.pathname).toBe('/en/experiences');
    });
  });
});
