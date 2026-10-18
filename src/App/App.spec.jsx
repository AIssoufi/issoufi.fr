import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import lottie from 'lottie-web/build/player/lottie_light';

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

/**
 * Waits for the burger icon animation of the header, drawn once lottie-web is loaded, so that
 * this update never lands outside `act` after the test.
 */
const waitForBurgerIcon = () => waitFor(() => expect(lottie.loadAnimation).toHaveBeenCalled());

/** Renders the app, or the given version of it, then waits for the burger icon animation. */
const renderApp = async (app = <App />) => {
  render(app);
  await waitForBurgerIcon();
};

describe('App', () => {
  beforeEach(() => {
    vi.spyOn(lottie, 'loadAnimation');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    window.history.pushState({}, '', '/');
  });

  it.each(['/page-inconnue', '/skills', '/projects/inconnu', '/experiences/inconnu/2'])(
    'shows the not found page at %s without redirecting',
    async path => {
      window.history.pushState({}, '', path);
      await renderApp();

      expect(await screen.findByText('404')).toBeInTheDocument();
      expect(screen.getByText(`La page ${path} n’existe pas.`)).toBeInTheDocument();
      expect(window.location.pathname).toBe(path);
    },
  );

  it('does not render the not found page for known routes', async () => {
    window.history.pushState({}, '', '/experiences');
    await renderApp();

    expect(await screen.findByRole('heading', { name: 'Expériences' })).toBeInTheDocument();
    expect(screen.queryByText('404')).not.toBeInTheDocument();
  });

  it.each([
    ['/projects', 'Projets personnels'],
    ['/experiences', 'Expériences'],
  ])('loads the page at %s on a direct visit', async (path, heading) => {
    window.history.pushState({}, '', path);
    await renderApp();

    expect(await screen.findByRole('heading', { name: heading })).toBeInTheDocument();
  });

  it.each(['/', '/projects', '/experiences', '/page-inconnue'])(
    'gives the page at %s a single main landmark and a single level 1 heading, with the header',
    async path => {
      window.history.pushState({}, '', path);
      await renderApp();

      expect(await screen.findAllByRole('main')).toHaveLength(1);
      expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    },
  );

  it('renders the home page at once, without waiting for a chunk', async () => {
    render(<App />);

    expect(screen.getByRole('link', { name: 'Voir mes projets' })).toBeInTheDocument();
    await waitForBurgerIcon();
  });

  it('loads the other pages on navigation', async () => {
    const user = userEvent.setup();
    await renderApp();

    await user.click(screen.getByRole('link', { name: 'Voir mes projets' }));

    expect(await screen.findByRole('heading', { name: 'Projets personnels' })).toBeInTheDocument();
    expect(window.location.pathname).toBe('/projects');
  });

  it('lets the page column shrink to the screen width', async () => {
    // A plain 1fr column grows to its widest content and makes narrow screens scroll sideways
    await renderApp();

    expect(getComputedStyle(screen.getByTestId('app')).gridTemplateColumns).toBe('minmax(0, 1fr)');
  });

  describe('focus after a navigation', () => {
    it('leaves the focus alone on the first load', async () => {
      window.history.pushState({}, '', '/projects');
      await renderApp();

      expect(await screen.findByRole('heading', PROJECTS_PAGE_TITLE)).not.toHaveFocus();
      expect(document.body).toHaveFocus();
    });

    it('moves the focus to the new page after a link of the mobile menu is chosen with the keyboard', async () => {
      const user = userEvent.setup();
      await renderApp();
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
      await renderApp();
      screen.getByRole('link', { name: 'Expériences professionnelles' }).focus();

      await user.keyboard('{Enter}');

      expect(await screen.findByRole('heading', { name: 'Expériences' })).toHaveFocus();
    });

    it('draws no focus ring around the heading, which is not a control', async () => {
      const user = userEvent.setup();
      await renderApp();
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
      await renderApp(<AppWithFailingPage />);

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
      await renderApp(<AppWithFailingPage />);

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
      await renderApp();

      expect(screen.getByRole('heading', { name: 'Projets personnels' })).toBeInTheDocument();
      expect(document.documentElement.lang).toBe('fr');
      expect(document.title).toBe('Projets - ADAM Issoufi');
    });

    it('opens in the language chosen before the reload, metadata included', async () => {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, 'en');

      await reloadI18n();
      await renderApp();

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
      await renderApp();

      expect(screen.getByRole('heading', { name: 'Projets personnels' })).toBeInTheDocument();
      expect(document.documentElement.lang).toBe('fr');
      expect(document.title).toBe('Projets - ADAM Issoufi');
    });
  });
});
