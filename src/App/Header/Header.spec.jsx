import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter as Router } from 'react-router';

import packageJson from '../../../package.json';
import i18n from '../../i18n';
import { LANGUAGE_STORAGE_KEY } from '../../i18n/constants';
import { en } from '../../i18n/en';
import { declaredStyle } from '../../styleTestUtils';
import { theme } from '../../theme';
import { DESKTOP_MEDIA_QUERY } from './constants';
import Header from './Header';

/** Renders the header above a page holding a link, which the open mobile menu covers. */
const renderHeader = (props = {}) => {
  render(
    <Router>
      <Header
        testId="header"
        {...props}
      />
      <main>
        <a href="/page">Page link</a>
      </main>
    </Router>,
  );
};

/**
 * Replaces `window.matchMedia`, which jsdom lacks, with a screen on the desktop layout or not:
 * every media query matches on desktop. `setDesktop` switches the layout and notifies the
 * listeners, as a resize or a rotation would.
 */
const stubScreen = ({ isDesktop }) => {
  const listeners = new Set();
  const mediaQueryList = {
    matches: isDesktop,
    addEventListener: (_type, listener) => listeners.add(listener),
    removeEventListener: (_type, listener) => listeners.delete(listener),
  };
  vi.stubGlobal('matchMedia', () => mediaQueryList);

  const setDesktop = nextIsDesktop => {
    mediaQueryList.matches = nextIsDesktop;
    act(() => listeners.forEach(listener => listener()));
  };

  return { setDesktop };
};

/** The burger button, whatever its state and language. */
const getBurgerButton = () => screen.getByRole('button', { name: /menu/i });

/** The navigation, found even while the closed mobile menu hides it. */
const getNavigation = () => screen.getByRole('navigation', { hidden: true });

/** The element holding the burger button and the navigation, in the row of the header. */
const getMenu = () => getBurgerButton().parentElement;

/**
 * The element holding the language toggle and the menu, which stay reachable while the menu is
 * open.
 */
const getHeaderControls = () => getMenu().parentElement;

/** The language toggle, whose buttons are named after their language. */
const getLanguageToggle = () => screen.getByRole('group', { name: 'Langue' });

/**
 * Shows the closed navigation as the tablet media query of `NavMenu` does on the desktop layout.
 * jsdom ignores the media queries of the styles, so the navigation keeps the `display: none` of the
 * mobile layout, and jsdom does not focus a link that it hides.
 */
const showDesktopNavigation = () => {
  getNavigation().style.display = 'flex';
};

/** Name of the link that downloads the CV, which its text gives. */
const CV_LINK_NAME = 'Télécharger CV';

/** The link that downloads the CV, the last link of the navigation, after the profile icons. */
const getCvLink = () => screen.getByRole('link', { name: CV_LINK_NAME, hidden: true });

/** Name of the GitHub icon, the first of the profile icons, which tells that it opens a new tab. */
const GITHUB_LINK_NAME = 'Profil GitHub d’ADAM Issoufi (nouvel onglet)';

/** Name of the LinkedIn icon, which follows the GitHub icon. */
const LINKEDIN_LINK_NAME = 'Profil LinkedIn d’ADAM Issoufi (nouvel onglet)';

/** The LinkedIn icon of the navigation. */
const getLinkedInLink = () => screen.getByRole('link', { name: LINKEDIN_LINK_NAME, hidden: true });

/** The element holding the language toggle, which floats on its own from tablet up. */
const getFloatingControls = () => screen.getByRole('group', { name: 'Langue' }).parentElement;

/** Media query of the short screens, as a phone held sideways, on which the header is compact. */
const SHORT_SCREEN_MEDIA_QUERY = `(max-height: ${theme.screenHeights.short})`;

/** Value that the header declares for a property on an element on the desktop layout. */
const desktopStyle = ({ element, property }) =>
  declaredStyle({ element, property, media: DESKTOP_MEDIA_QUERY });

/** The link of the page under the header, covered by the open mobile menu. */
const getPageLink = () => screen.getByRole('link', { name: 'Page link' });

/** Inline overflow of the root element, which locks the page while the mobile menu covers it. */
const getRootOverflow = () => document.documentElement.style.overflow;

/**
 * Runs the steps of a test while every click is kept from navigating, since jsdom can neither
 * download a file nor open a new tab, then lets clicks navigate again, even when a step fails.
 */
const withoutNavigation = async steps => {
  const preventNavigation = event => event.preventDefault();
  window.addEventListener('click', preventNavigation, { capture: true });
  try {
    await steps();
  } finally {
    window.removeEventListener('click', preventNavigation, { capture: true });
  }
};

/** Elements of the page that the open mobile menu covers: the logo and the page. */
const getCoveredElements = () => [screen.getByRole('link', { name: 'AI' }), getPageLink()];

describe('Header', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('renders the header', () => {
    renderHeader();
    expect(screen.getByTestId('header')).toBeInTheDocument();
  });

  it('renders the logo', () => {
    renderHeader();
    expect(screen.getByText('AI')).toBeInTheDocument();
  });

  it('gives its blurred band its own height, so the band covers the header and nothing else', () => {
    renderHeader();
    const header = screen.getByTestId('header');

    expect(declaredStyle({ element: header, property: 'height' })).toBe(theme.sizes.header);
    expect(declaredStyle({ element: header, property: 'height', pseudo: '::after' })).toBe(
      theme.sizes.header,
    );
    expect(declaredStyle({ element: header, property: 'position', pseudo: '::after' })).toBe(
      'fixed',
    );
  });

  it('gets compact on a short screen, with its band, and leaves most of it to the page', () => {
    renderHeader();
    const header = screen.getByTestId('header');
    const shortScreenStyle = ({ element, property, pseudo }) =>
      declaredStyle({ element, property, pseudo, media: SHORT_SCREEN_MEDIA_QUERY });

    expect(shortScreenStyle({ element: header, property: 'height' })).toBe(
      theme.sizes['header-compact'],
    );
    expect(shortScreenStyle({ element: header, property: 'height', pseudo: '::after' })).toBe(
      theme.sizes['header-compact'],
    );
    const logo = screen.getByRole('link', { name: 'AI' }).parentElement;
    expect(shortScreenStyle({ element: logo, property: 'font-size' })).toBe(theme.fontSizes[28]);
  });

  describe('version', () => {
    it('shows the version of the build after the logo', () => {
      renderHeader();

      const version = screen.getByText(`build v${packageJson.version}`);
      expect(version.previousElementSibling).toContainElement(
        screen.getByRole('link', { name: 'AI' }),
      );
    });

    it.each([
      ['2.0.0', 'build v2.0.0'],
      ['v2.0.0', 'build v2.0.0'],
    ])('shows the version %j as %j', (version, text) => {
      renderHeader({ version });
      expect(screen.getByText(text)).toBeInTheDocument();
    });

    it.each(['', '  ', 'v', null, 2])('shows no version when it is %j', version => {
      renderHeader({ version });
      expect(screen.queryByText(/build/)).not.toBeInTheDocument();
    });

    it('shows it in small letters, lighter than the logo', () => {
      renderHeader();

      const versionStyle = getComputedStyle(screen.getByText(`build v${packageJson.version}`));
      expect(versionStyle.fontSize).toBe(theme.fontSizes[12]);
      expect(versionStyle.color).toBe(theme.colors['foreground-a65']);
    });
  });

  describe('floating controls', () => {
    it('floats the language toggle alone on the right edge from tablet up, centered vertically', () => {
      renderHeader();

      const floatingControls = getFloatingControls();
      expect([...floatingControls.children]).toEqual([getLanguageToggle()]);
      expect(desktopStyle({ element: floatingControls, property: 'position' })).toBe('fixed');
      expect(desktopStyle({ element: floatingControls, property: 'right' })).toBe(theme.space[20]);
      expect(desktopStyle({ element: floatingControls, property: 'top' })).toBe('50%');
      expect(desktopStyle({ element: floatingControls, property: 'transform' })).toBe(
        'translateY(-50%)',
      );
    });

    it('floats no link: the navigation holds the profile icons and the CV link', () => {
      renderHeader();

      expect(within(getFloatingControls()).queryAllByRole('link', { hidden: true })).toHaveLength(
        0,
      );
      for (const name of [GITHUB_LINK_NAME, LINKEDIN_LINK_NAME, CV_LINK_NAME]) {
        expect(screen.getAllByRole('link', { name, hidden: true })).toHaveLength(1);
        expect(getNavigation()).toContainElement(screen.getByRole('link', { name, hidden: true }));
      }
    });

    it('shows no tooltip', () => {
      renderHeader();
      expect(screen.queryByRole('tooltip', { hidden: true })).not.toBeInTheDocument();
    });
  });

  it('renders the language toggle', () => {
    renderHeader();
    expect(screen.getByText('FR')).toBeInTheDocument();
    expect(screen.getByText('EN')).toBeInTheDocument();
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

  it('renders the GitHub and LinkedIn icons, then the CV link, after the nav items', () => {
    renderHeader();

    const links = within(getNavigation()).getAllByRole('link', { hidden: true });
    expect(links.map(link => link.textContent || link.getAttribute('aria-label'))).toEqual([
      'Accueil',
      'Projets',
      'Expériences',
      GITHUB_LINK_NAME,
      LINKEDIN_LINK_NAME,
      CV_LINK_NAME,
    ]);
  });

  it('renders nav links with correct hrefs', () => {
    renderHeader();
    expect(screen.getByText('Accueil').closest('a')).toHaveAttribute('href', '/');
    expect(screen.getByText('Projets').closest('a')).toHaveAttribute('href', '/projects');
    expect(screen.getByText('Expériences').closest('a')).toHaveAttribute('href', '/experiences');
  });

  describe('at an English URL', () => {
    beforeEach(async () => {
      window.history.pushState({}, '', '/en/projects');
      await act(() => i18n.changeLanguage('en'));
    });

    afterEach(async () => {
      window.history.pushState({}, '', '/');
      await act(() => i18n.changeLanguage('fr'));
    });

    it('links the logo and the navigation to the English pages', () => {
      renderHeader();

      expect(screen.getByText('AI').closest('a')).toHaveAttribute('href', '/en/');
      expect(screen.getByText('Home').closest('a')).toHaveAttribute('href', '/en/');
      expect(screen.getByText('Projects').closest('a')).toHaveAttribute('href', '/en/projects');
      expect(screen.getByText('Experience').closest('a')).toHaveAttribute(
        'href',
        '/en/experiences',
      );
    });

    it('marks the English page of the URL as the current one, and not the home page', () => {
      renderHeader();

      expect(screen.getByText('Projects').closest('a')).toHaveClass('active');
      expect(screen.getByText('Home').closest('a')).not.toHaveClass('active');
    });
  });

  it('links the logo to the home page', () => {
    renderHeader();
    expect(screen.getByText('AI').closest('a')).toHaveAttribute('href', '/');
  });

  it('renders a CV link that downloads the PDF', () => {
    renderHeader();

    expect(getCvLink()).toHaveAttribute('href', '/CV - Adam Issoufi.pdf');
    expect(getCvLink()).toHaveAttribute('download');
  });

  it('points the CV link to the CV written in English once English is active', async () => {
    renderHeader();

    await act(() => i18n.changeLanguage('en'));
    try {
      expect(screen.getByRole('link', { name: en.cvLink.text, hidden: true })).toHaveAttribute(
        'href',
        '/CV - Adam Issoufi (EN).pdf',
      );
    } finally {
      await act(() => i18n.changeLanguage('fr'));
    }
  });

  describe('mobile menu', () => {
    afterEach(async () => {
      await act(() => i18n.changeLanguage('fr'));
    });

    it('starts closed, with a burger button to open it', () => {
      renderHeader();

      expect(getBurgerButton()).toHaveAccessibleName('Ouvrir le menu');
      expect(getBurgerButton()).toHaveAttribute('aria-expanded', 'false');
      expect(getNavigation()).not.toBeVisible();
      expect(getComputedStyle(getMenu()).position).not.toBe('fixed');
    });

    it('shows the profile icons after the links, then the CV link, once open', async () => {
      renderHeader();

      await userEvent.click(getBurgerButton());

      const gitHubLink = screen.getByRole('link', { name: GITHUB_LINK_NAME });
      expect(gitHubLink).toBeVisible();
      expect(getLinkedInLink()).toBeVisible();
      expect(getCvLink()).toBeVisible();
      expect(
        screen.getByRole('link', { name: 'Expériences' }).compareDocumentPosition(gitHubLink),
      ).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
      expect(getLinkedInLink().compareDocumentPosition(getCvLink())).toBe(
        Node.DOCUMENT_POSITION_FOLLOWING,
      );
    });

    it('opens over the page with the burger button', async () => {
      renderHeader();

      await userEvent.click(getBurgerButton());

      expect(getBurgerButton()).toHaveAccessibleName('Fermer le menu');
      expect(getBurgerButton()).toHaveAttribute('aria-expanded', 'true');
      expect(getNavigation()).toBeVisible();
      expect(getComputedStyle(getNavigation()).position).toBe('fixed');
      // The header stays at the top of the screen, so the burger keeps its place in its row
      expect(getComputedStyle(getMenu()).position).not.toBe('fixed');
    });

    describe('language toggle', () => {
      afterEach(() => {
        window.history.pushState({}, '', '/');
        // The toggle stores the language it switches to
        localStorage.removeItem(LANGUAGE_STORAGE_KEY);
      });

      it('stays above it, like the burger', async () => {
        renderHeader();

        await userEvent.click(getBurgerButton());

        const toggleControls = getLanguageToggle().parentElement;
        expect(declaredStyle({ element: toggleControls, property: 'z-index' })).toBe(
          String(theme.zIndices.header),
        );
        expect(declaredStyle({ element: getBurgerButton(), property: 'z-index' })).toBe(
          String(theme.zIndices.header),
        );
        expect(getLanguageToggle().closest('[inert]')).toBeNull();
      });

      it('changes the language while it is open, which stays open', async () => {
        renderHeader();
        await userEvent.click(getBurgerButton());

        await userEvent.click(within(getLanguageToggle()).getByRole('button', { name: 'English' }));

        expect(window.location.pathname).toBe('/en/');
        expect(
          within(getLanguageToggle()).getByRole('button', { name: 'English' }),
        ).toHaveAttribute('aria-pressed', 'true');
        expect(getBurgerButton()).toHaveAttribute('aria-expanded', 'true');
        expect(getRootOverflow()).toBe('hidden');
      });
    });

    it('locks the page behind it while open, and lets it scroll again once closed', async () => {
      renderHeader();
      expect(getRootOverflow()).toBe('');

      await userEvent.click(getBurgerButton());
      expect(getRootOverflow()).toBe('hidden');

      await userEvent.click(getBurgerButton());
      expect(getRootOverflow()).toBe('');
    });

    it('lets the page scroll again when one of its links is chosen', async () => {
      renderHeader();
      await userEvent.click(getBurgerButton());

      await userEvent.click(screen.getByRole('link', { name: 'Projets' }));

      expect(getRootOverflow()).toBe('');
    });

    it('closes with the burger button', async () => {
      renderHeader();

      await userEvent.click(getBurgerButton());
      await userEvent.click(getBurgerButton());

      expect(getBurgerButton()).toHaveAccessibleName('Ouvrir le menu');
      expect(getBurgerButton()).toHaveAttribute('aria-expanded', 'false');
      expect(getNavigation()).not.toBeVisible();
      expect(getComputedStyle(getMenu()).position).not.toBe('fixed');
    });

    it('closes when one of its links is clicked', async () => {
      renderHeader();

      await userEvent.click(getBurgerButton());
      await userEvent.click(screen.getByRole('link', { name: 'Projets' }));

      expect(getBurgerButton()).toHaveAttribute('aria-expanded', 'false');
      expect(getNavigation()).not.toBeVisible();
    });

    it('closes when the screen grows to the desktop layout, and stays closed back on mobile', async () => {
      const { setDesktop } = stubScreen({ isDesktop: false });
      renderHeader();
      await userEvent.click(getBurgerButton());

      setDesktop(true);

      expect(getBurgerButton()).toHaveAttribute('aria-expanded', 'false');
      expect(getComputedStyle(getMenu()).position).not.toBe('fixed');
      expect(getComputedStyle(getNavigation()).position).not.toBe('fixed');
      getCoveredElements().forEach(element => expect(element.closest('[inert]')).toBeNull());
      expect(getRootOverflow()).toBe('');

      setDesktop(false);

      expect(getBurgerButton()).toHaveAttribute('aria-expanded', 'false');
      expect(getNavigation()).not.toBeVisible();
    });

    it('stays closed when the screen shrinks to the mobile layout', () => {
      const { setDesktop } = stubScreen({ isDesktop: true });
      renderHeader();

      setDesktop(false);

      expect(getBurgerButton()).toHaveAttribute('aria-expanded', 'false');
      expect(getNavigation()).not.toBeVisible();
    });

    it('links the burger button to the navigation it controls', () => {
      renderHeader();

      expect(getNavigation().id).not.toBe('');
      expect(getBurgerButton()).toHaveAttribute('aria-controls', getNavigation().id);
    });

    it('opens with Enter, goes on to its links with Tab, and closes with Space', async () => {
      renderHeader();
      act(() => getBurgerButton().focus());

      await userEvent.keyboard('{Enter}');
      expect(getBurgerButton()).toHaveAttribute('aria-expanded', 'true');

      await userEvent.tab();
      expect(screen.getByRole('link', { name: 'Accueil' })).toHaveFocus();

      await userEvent.tab({ shift: true });
      await userEvent.keyboard(' ');
      expect(getBurgerButton()).toHaveAttribute('aria-expanded', 'false');
    });

    it('names the burger button in English', async () => {
      await act(() => i18n.changeLanguage('en'));
      renderHeader();

      expect(getBurgerButton()).toHaveAccessibleName('Open menu');

      await userEvent.click(getBurgerButton());

      expect(getBurgerButton()).toHaveAccessibleName('Close menu');
      expect(getBurgerButton()).toHaveAttribute('aria-expanded', 'true');
    });
  });

  describe('keyboard focus in the open mobile menu', () => {
    it('makes the rest of the page inert while open, and reachable again once closed', async () => {
      renderHeader();
      getCoveredElements().forEach(element => expect(element.closest('[inert]')).toBeNull());

      await userEvent.click(getBurgerButton());
      getCoveredElements().forEach(element => expect(element.closest('[inert]')).not.toBeNull());
      expect(getMenu().closest('[inert]')).toBeNull();
      expect(getLanguageToggle().closest('[inert]')).toBeNull();

      await userEvent.click(getBurgerButton());
      getCoveredElements().forEach(element => expect(element.closest('[inert]')).toBeNull());
    });

    it('goes through the burger and every link with Tab', async () => {
      renderHeader();
      await userEvent.click(getBurgerButton());

      for (const name of [
        'Accueil',
        'Projets',
        'Expériences',
        GITHUB_LINK_NAME,
        LINKEDIN_LINK_NAME,
        CV_LINK_NAME,
      ]) {
        await userEvent.tab();
        expect(screen.getByRole('link', { name })).toHaveFocus();
      }
    });

    it('keeps Tab in the header controls after the last link, away from the page behind', async () => {
      renderHeader();
      await userEvent.click(getBurgerButton());
      act(() => getCvLink().focus());

      await userEvent.tab();

      expect(getPageLink()).not.toHaveFocus();
      expect(screen.getByRole('link', { name: 'AI' })).not.toHaveFocus();
      expect(getHeaderControls()).toContainElement(document.activeElement);
    });

    it('reaches the language toggle above the menu with Shift+Tab from the burger', async () => {
      renderHeader();
      await userEvent.click(getBurgerButton());

      await userEvent.tab({ shift: true });

      expect(within(getLanguageToggle()).getByRole('button', { name: 'English' })).toHaveFocus();

      await userEvent.tab({ shift: true });
      expect(within(getLanguageToggle()).getByRole('button', { name: 'Français' })).toHaveFocus();
    });

    it('gives the focus back to the burger when a link is chosen with Enter', async () => {
      renderHeader();
      await userEvent.click(getBurgerButton());
      await userEvent.tab();
      await userEvent.tab();
      expect(screen.getByRole('link', { name: 'Projets' })).toHaveFocus();

      await userEvent.keyboard('{Enter}');

      expect(getBurgerButton()).toHaveAttribute('aria-expanded', 'false');
      expect(getBurgerButton()).toHaveFocus();
      expect(document.body).not.toHaveFocus();
    });

    it('gives the focus back to the burger when the CV link downloads the CV', async () => {
      // The link only closes the menu here
      await withoutNavigation(async () => {
        renderHeader();
        await userEvent.click(getBurgerButton());
        act(() => getCvLink().focus());

        await userEvent.keyboard('{Enter}');
      });

      expect(getBurgerButton()).toHaveAttribute('aria-expanded', 'false');
      expect(getBurgerButton()).toHaveFocus();
    });

    it('closes with Escape and gives the focus back to the burger', async () => {
      renderHeader();
      await userEvent.click(getBurgerButton());
      await userEvent.tab();
      expect(screen.getByRole('link', { name: 'Accueil' })).toHaveFocus();

      await userEvent.keyboard('{Escape}');

      expect(getBurgerButton()).toHaveAttribute('aria-expanded', 'false');
      expect(getBurgerButton()).toHaveFocus();
      expect(getNavigation()).not.toBeVisible();
      getCoveredElements().forEach(element => expect(element.closest('[inert]')).toBeNull());
    });

    it('gives the focus back to the burger when a profile icon opens its profile', async () => {
      // The link only closes the menu here
      await withoutNavigation(async () => {
        renderHeader();
        await userEvent.click(getBurgerButton());
        act(() => getLinkedInLink().focus());

        await userEvent.keyboard('{Enter}');
      });

      expect(getBurgerButton()).toHaveAttribute('aria-expanded', 'false');
      expect(getBurgerButton()).toHaveFocus();
    });

    it('closes with Escape while the burger has the focus', async () => {
      renderHeader();
      await userEvent.click(getBurgerButton());

      await userEvent.keyboard('{Escape}');

      expect(getBurgerButton()).toHaveAttribute('aria-expanded', 'false');
      expect(getBurgerButton()).toHaveFocus();
    });

    it('leaves the focus where it is when Escape is pressed while the menu is closed', async () => {
      renderHeader();
      act(() => getPageLink().focus());

      await userEvent.keyboard('{Escape}');

      expect(getPageLink()).toHaveFocus();
      expect(getBurgerButton()).toHaveAttribute('aria-expanded', 'false');
    });

    it('leaves the focus on a link chosen on the desktop layout', async () => {
      stubScreen({ isDesktop: true });
      renderHeader();
      showDesktopNavigation();
      const projectsLink = screen.getByRole('link', { name: 'Projets' });
      act(() => projectsLink.focus());
      expect(projectsLink).toHaveFocus();

      await userEvent.keyboard('{Enter}');

      expect(projectsLink).toHaveFocus();
    });

    it('changes nothing on the desktop layout, where the menu is a bar of the page', async () => {
      stubScreen({ isDesktop: true });
      renderHeader();
      // The burger is hidden on desktop, but jsdom still lets a click reach it
      await userEvent.click(getBurgerButton());

      getCoveredElements().forEach(element => expect(element.closest('[inert]')).toBeNull());
      expect(getRootOverflow()).toBe('');
      act(() => getPageLink().focus());
      await userEvent.keyboard('{Escape}');
      expect(getPageLink()).toHaveFocus();
      expect(getBurgerButton()).toHaveAttribute('aria-expanded', 'true');
    });
  });
});
