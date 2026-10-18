import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import lottie from 'lottie-web/build/player/lottie_light';
import { BrowserRouter as Router } from 'react-router';

import packageJson from '../../../package.json';
import i18n from '../../i18n';
import { declaredStyle, serializeCssValue } from '../../styleTestUtils';
import { theme } from '../../theme';
import { waitForBurgerIcon } from '../testUtils';
import { DESKTOP_MEDIA_QUERY } from './constants';
import Header from './Header';

/**
 * Renders the header above a page holding a link, which the open mobile menu covers, then waits
 * for the burger icon animation, drawn once lottie-web is loaded, so that this update never lands
 * outside `act` after the test.
 */
const renderHeader = async (props = {}) => {
  vi.spyOn(lottie, 'loadAnimation');
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
  await waitForBurgerIcon();
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

/** The element holding the burger button and the navigation, fixed while the menu is open. */
const getMenu = () => getBurgerButton().parentElement;

/**
 * Shows the closed navigation as the tablet media query of `NavMenu` does on the desktop layout.
 * jsdom ignores the media queries of the styles, so the navigation keeps the `display: none` of the
 * mobile layout, and jsdom does not focus a link that it hides.
 */
const showDesktopNavigation = () => {
  getNavigation().style.display = 'flex';
};

/** Name of the CV links: the one floating under the language toggle and the one of the menu. */
const CV_LINK_NAME = 'Télécharger le CV';

/** The CV link of the open mobile menu, the only one shown on mobile. */
const getCvLink = () => screen.getByRole('link', { name: CV_LINK_NAME });

/** Name of the GitHub links: the one floating under the language toggle and the one of the menu. */
const GITHUB_LINK_NAME = 'Profil GitHub d’ADAM Issoufi';

/** The GitHub link of the open mobile menu, the last link of the menu. */
const getMenuGitHubLink = () => screen.getByRole('link', { name: GITHUB_LINK_NAME });

/**
 * The element holding the language toggle, the CV button and the GitHub icon, floating from tablet
 * up.
 */
const getFloatingControls = () => screen.getByRole('group', { name: 'Langue' }).parentElement;

/** The element holding the CV button and the GitHub icon, under the language toggle. */
const getFloatingLinks = () => getFloatingControls().lastElementChild;

/** The CV link floating under the language toggle from tablet up, hidden on mobile. */
const getFloatingCvLink = () =>
  within(getFloatingLinks()).getByRole('link', { name: CV_LINK_NAME, hidden: true });

/** The GitHub link floating under the CV button from tablet up, hidden on mobile. */
const getFloatingGitHubLink = () =>
  within(getFloatingLinks()).getByRole('link', { name: GITHUB_LINK_NAME, hidden: true });

/** Value that the header declares for a property on an element on the desktop layout. */
const desktopStyle = ({ element, property }) =>
  declaredStyle({ element, property, media: DESKTOP_MEDIA_QUERY });

/** The link of the page under the header, covered by the open mobile menu. */
const getPageLink = () => screen.getByRole('link', { name: 'Page link' });

/** Elements of the page that the open mobile menu covers: the logo, the language toggle, the page. */
const getCoveredElements = () => [
  screen.getByRole('link', { name: 'AI' }),
  screen.getByText('EN'),
  getPageLink(),
];

describe('Header', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('renders the header', async () => {
    await renderHeader();
    expect(screen.getByTestId('header')).toBeInTheDocument();
  });

  it('renders the logo', async () => {
    await renderHeader();
    expect(screen.getByText('AI')).toBeInTheDocument();
  });

  describe('version', () => {
    it('shows the version of the build after the logo', async () => {
      await renderHeader();

      const version = screen.getByText(`build v${packageJson.version}`);
      expect(version.previousElementSibling).toContainElement(
        screen.getByRole('link', { name: 'AI' }),
      );
    });

    it.each([
      ['2.0.0', 'build v2.0.0'],
      ['v2.0.0', 'build v2.0.0'],
    ])('shows the version %j as %j', async (version, text) => {
      await renderHeader({ version });
      expect(screen.getByText(text)).toBeInTheDocument();
    });

    it.each(['', '  ', 'v', null, 2])('shows no version when it is %j', async version => {
      await renderHeader({ version });
      expect(screen.queryByText(/build/)).not.toBeInTheDocument();
    });

    it('shows it in small letters, lighter than the logo', async () => {
      await renderHeader();

      const versionStyle = getComputedStyle(screen.getByText(`build v${packageJson.version}`));
      expect(versionStyle.fontSize).toBe(theme.fontSizes[11]);
      expect(versionStyle.color).toBe(theme.colors['foreground-a65']);
    });
  });

  describe('floating controls', () => {
    it('floats the language toggle on the right edge from tablet up, with the CV button and the GitHub icon', async () => {
      await renderHeader();

      const floatingControls = getFloatingControls();
      expect(getFloatingCvLink()).toHaveAttribute('href', '/CV - Adam Issoufi.pdf');
      expect(getFloatingGitHubLink()).toHaveAttribute('aria-label', GITHUB_LINK_NAME);
      expect(desktopStyle({ element: floatingControls, property: 'position' })).toBe('fixed');
      expect(desktopStyle({ element: floatingControls, property: 'right' })).toBe(theme.space[20]);
      expect(desktopStyle({ element: floatingControls, property: 'top' })).toBe('50%');
    });

    it('puts the CV button between the language toggle and the GitHub icon', async () => {
      await renderHeader();

      expect(getFloatingLinks().previousElementSibling).toBe(
        screen.getByRole('group', { name: 'Langue' }),
      );
      // The CV button sits in the element that also holds its tooltip
      expect([...getFloatingLinks().children]).toEqual([
        getFloatingCvLink().parentElement,
        getFloatingGitHubLink(),
      ]);
    });

    it('stacks the CV button and the GitHub icon centered under the language toggle from tablet up', async () => {
      await renderHeader();

      const element = getFloatingLinks();
      expect(desktopStyle({ element, property: 'display' })).toBe('flex');
      expect(desktopStyle({ element, property: 'flex-direction' })).toBe('column');
      expect(desktopStyle({ element, property: 'align-items' })).toBe('center');
      expect(desktopStyle({ element, property: 'gap' })).toBe(theme.space[16]);
      expect(desktopStyle({ element, property: 'position' })).toBe('absolute');
      expect(desktopStyle({ element, property: 'top' })).toBe(
        serializeCssValue({ property: 'top', value: `calc(100% + ${theme.space[16]})` }),
      );
      expect(desktopStyle({ element, property: 'left' })).toBe('50%');
      expect(desktopStyle({ element, property: 'transform' })).toBe('translateX(-50%)');
    });

    it('draws the floating CV button as a circle holding only the text "CV"', async () => {
      await renderHeader();

      const cvLinkStyle = getComputedStyle(getFloatingCvLink());
      expect(cvLinkStyle.width).toBe(theme.sizes['round-button']);
      expect(cvLinkStyle.height).toBe(theme.sizes['round-button']);
      expect(cvLinkStyle.borderRadius).toBe(theme.radii.circle);
      expect(getFloatingCvLink()).toHaveTextContent(/^CV$/);
      expect(getFloatingCvLink().querySelector('svg')).not.toBeInTheDocument();
    });

    it.each([':hover', ':active'])(
      'fills the floating CV button with white and the accent text on %s',
      async pseudo => {
        await renderHeader();

        const pseudoStyle = property =>
          declaredStyle({ element: getFloatingCvLink(), property, pseudo });
        expect(pseudoStyle('background-color')).toBe(
          serializeCssValue({ property: 'background-color', value: theme.colors.foreground }),
        );
        expect(pseudoStyle('color')).toBe(
          serializeCssValue({ property: 'color', value: theme.colors.accent }),
        );
      },
    );

    it('grows the floating CV button on hover only, not while it is pressed', async () => {
      await renderHeader();

      const transform = pseudo =>
        declaredStyle({ element: getFloatingCvLink(), property: 'transform', pseudo });
      expect(transform(':hover')).toBe('scale(1.06)');
      expect(transform(':active')).toBe('');
    });

    it('shows the tooltip of the floating CV button on its left, away from the edge of the screen', async () => {
      await renderHeader();

      const tooltip = within(getFloatingLinks()).getByRole('tooltip', { hidden: true });
      expect(getFloatingCvLink()).toHaveAttribute('aria-labelledby', tooltip.id);
      expect(declaredStyle({ element: tooltip, property: 'right' })).toBe(
        serializeCssValue({
          property: 'right',
          value: `calc(100% + ${theme.space['tooltip-gap']})`,
        }),
      );
    });

    it('hides the floating CV button and GitHub icon on mobile, where the menu holds them', async () => {
      // jsdom applies no media query, so these are the narrow-screen styles
      await renderHeader();

      expect(getComputedStyle(getFloatingLinks()).display).toBe('none');
      expect(getFloatingCvLink()).not.toBeVisible();
      expect(getFloatingGitHubLink()).not.toBeVisible();
      expect(screen.queryByRole('link', { name: CV_LINK_NAME })).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: GITHUB_LINK_NAME })).not.toBeInTheDocument();
    });
  });

  it('renders the language toggle', async () => {
    await renderHeader();
    expect(screen.getByText('FR')).toBeInTheDocument();
    expect(screen.getByText('EN')).toBeInTheDocument();
  });

  it('renders all nav items', async () => {
    await renderHeader();
    expect(screen.getByText('Accueil')).toBeInTheDocument();
    expect(screen.getByText('Projets')).toBeInTheDocument();
    expect(screen.getByText('Expériences')).toBeInTheDocument();
  });

  it('does not render a skills nav item', async () => {
    await renderHeader();
    expect(screen.queryByText('Compétences')).not.toBeInTheDocument();
  });

  it('renders the CV button in the menu and in the floating controls', async () => {
    await renderHeader();

    expect(screen.getAllByRole('link', { name: CV_LINK_NAME, hidden: true })).toHaveLength(2);
    expect(
      within(getNavigation()).getByRole('link', { name: CV_LINK_NAME, hidden: true }),
    ).toBeInTheDocument();
    expect(getFloatingCvLink()).toBeInTheDocument();
  });

  it('renders nav links with correct hrefs', async () => {
    await renderHeader();
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

    it('links the logo and the navigation to the English pages', async () => {
      await renderHeader();

      expect(screen.getByText('AI').closest('a')).toHaveAttribute('href', '/en/');
      expect(screen.getByText('Home').closest('a')).toHaveAttribute('href', '/en/');
      expect(screen.getByText('Projects').closest('a')).toHaveAttribute('href', '/en/projects');
      expect(screen.getByText('Experience').closest('a')).toHaveAttribute(
        'href',
        '/en/experiences',
      );
    });

    it('marks the English page of the URL as the current one, and not the home page', async () => {
      await renderHeader();

      expect(screen.getByText('Projects').closest('a')).toHaveClass('active');
      expect(screen.getByText('Home').closest('a')).not.toHaveClass('active');
    });
  });

  it('links the logo to the home page', async () => {
    await renderHeader();
    expect(screen.getByText('AI').closest('a')).toHaveAttribute('href', '/');
  });

  it('renders CV links pointing to the PDF', async () => {
    await renderHeader();

    for (const cvLink of screen.getAllByRole('link', { name: CV_LINK_NAME, hidden: true })) {
      expect(cvLink).toHaveAttribute('href', '/CV - Adam Issoufi.pdf');
    }
  });

  describe('mobile menu', () => {
    afterEach(async () => {
      await act(() => i18n.changeLanguage('fr'));
    });

    it('starts closed, with a burger button to open it', async () => {
      await renderHeader();

      expect(getBurgerButton()).toHaveAccessibleName('Ouvrir le menu');
      expect(getBurgerButton()).toHaveAttribute('aria-expanded', 'false');
      expect(getNavigation()).not.toBeVisible();
      expect(getComputedStyle(getMenu()).position).not.toBe('fixed');
    });

    it('shows the GitHub icon after the CV button once open', async () => {
      await renderHeader();

      await userEvent.click(getBurgerButton());

      expect(getNavigation()).toContainElement(getMenuGitHubLink());
      expect(getCvLink().compareDocumentPosition(getMenuGitHubLink())).toBe(
        Node.DOCUMENT_POSITION_FOLLOWING,
      );
    });

    it('opens over the page with the burger button', async () => {
      await renderHeader();

      await userEvent.click(getBurgerButton());

      expect(getBurgerButton()).toHaveAccessibleName('Fermer le menu');
      expect(getBurgerButton()).toHaveAttribute('aria-expanded', 'true');
      expect(getNavigation()).toBeVisible();
      expect(getComputedStyle(getNavigation()).position).toBe('fixed');
      expect(getComputedStyle(getMenu()).position).toBe('fixed');
    });

    it('closes with the burger button', async () => {
      await renderHeader();

      await userEvent.click(getBurgerButton());
      await userEvent.click(getBurgerButton());

      expect(getBurgerButton()).toHaveAccessibleName('Ouvrir le menu');
      expect(getBurgerButton()).toHaveAttribute('aria-expanded', 'false');
      expect(getNavigation()).not.toBeVisible();
      expect(getComputedStyle(getMenu()).position).not.toBe('fixed');
    });

    it('closes when one of its links is clicked', async () => {
      await renderHeader();

      await userEvent.click(getBurgerButton());
      await userEvent.click(screen.getByRole('link', { name: 'Projets' }));

      expect(getBurgerButton()).toHaveAttribute('aria-expanded', 'false');
      expect(getNavigation()).not.toBeVisible();
    });

    it('closes when the screen grows to the desktop layout, and stays closed back on mobile', async () => {
      const { setDesktop } = stubScreen({ isDesktop: false });
      await renderHeader();
      await userEvent.click(getBurgerButton());

      setDesktop(true);

      expect(getBurgerButton()).toHaveAttribute('aria-expanded', 'false');
      expect(getComputedStyle(getMenu()).position).not.toBe('fixed');
      expect(getComputedStyle(getNavigation()).position).not.toBe('fixed');
      getCoveredElements().forEach(element => expect(element.closest('[inert]')).toBeNull());

      setDesktop(false);

      expect(getBurgerButton()).toHaveAttribute('aria-expanded', 'false');
      expect(getNavigation()).not.toBeVisible();
    });

    it('stays closed when the screen shrinks to the mobile layout', async () => {
      const { setDesktop } = stubScreen({ isDesktop: true });
      await renderHeader();

      setDesktop(false);

      expect(getBurgerButton()).toHaveAttribute('aria-expanded', 'false');
      expect(getNavigation()).not.toBeVisible();
    });

    it('links the burger button to the navigation it controls', async () => {
      await renderHeader();

      expect(getNavigation().id).not.toBe('');
      expect(getBurgerButton()).toHaveAttribute('aria-controls', getNavigation().id);
    });

    it('opens with Enter, goes on to its links with Tab, and closes with Space', async () => {
      await renderHeader();
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
      await renderHeader();

      expect(getBurgerButton()).toHaveAccessibleName('Open menu');

      await userEvent.click(getBurgerButton());

      expect(getBurgerButton()).toHaveAccessibleName('Close menu');
      expect(getBurgerButton()).toHaveAttribute('aria-expanded', 'true');
    });
  });

  describe('keyboard focus in the open mobile menu', () => {
    it('makes the rest of the page inert while open, and reachable again once closed', async () => {
      await renderHeader();
      getCoveredElements().forEach(element => expect(element.closest('[inert]')).toBeNull());

      await userEvent.click(getBurgerButton());
      getCoveredElements().forEach(element => expect(element.closest('[inert]')).not.toBeNull());
      expect(getMenu().closest('[inert]')).toBeNull();

      await userEvent.click(getBurgerButton());
      getCoveredElements().forEach(element => expect(element.closest('[inert]')).toBeNull());
    });

    it('goes through the burger and every link with Tab', async () => {
      await renderHeader();
      await userEvent.click(getBurgerButton());

      for (const name of ['Accueil', 'Projets', 'Expériences', CV_LINK_NAME, GITHUB_LINK_NAME]) {
        await userEvent.tab();
        expect(screen.getByRole('link', { name })).toHaveFocus();
      }
    });

    it('keeps Tab in the menu after its last link, away from the page behind', async () => {
      await renderHeader();
      await userEvent.click(getBurgerButton());
      act(() => getMenuGitHubLink().focus());

      await userEvent.tab();

      expect(getPageLink()).not.toHaveFocus();
      expect(getMenu()).toContainElement(document.activeElement);
    });

    it('keeps Shift+Tab on the burger, away from the language toggle behind', async () => {
      await renderHeader();
      await userEvent.click(getBurgerButton());

      await userEvent.tab({ shift: true });

      expect(screen.getByText('EN')).not.toHaveFocus();
      expect(getBurgerButton()).toHaveFocus();
    });

    it('gives the focus back to the burger when a link is chosen with Enter', async () => {
      await renderHeader();
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
      // jsdom cannot download a file: the link only closes the menu here
      const preventNavigation = event => event.preventDefault();
      window.addEventListener('click', preventNavigation, { capture: true });
      await renderHeader();
      await userEvent.click(getBurgerButton());
      act(() => getCvLink().focus());

      await userEvent.keyboard('{Enter}');

      window.removeEventListener('click', preventNavigation, { capture: true });
      expect(getBurgerButton()).toHaveAttribute('aria-expanded', 'false');
      expect(getBurgerButton()).toHaveFocus();
    });

    it('closes with Escape and gives the focus back to the burger', async () => {
      await renderHeader();
      await userEvent.click(getBurgerButton());
      await userEvent.tab();
      expect(screen.getByRole('link', { name: 'Accueil' })).toHaveFocus();

      await userEvent.keyboard('{Escape}');

      expect(getBurgerButton()).toHaveAttribute('aria-expanded', 'false');
      expect(getBurgerButton()).toHaveFocus();
      expect(getNavigation()).not.toBeVisible();
      getCoveredElements().forEach(element => expect(element.closest('[inert]')).toBeNull());
    });

    it('closes the tooltip that Tab shows on the CV button with a first Escape, then itself with the next', async () => {
      await renderHeader();
      await userEvent.click(getBurgerButton());
      for (const name of ['Accueil', 'Projets', 'Expériences', CV_LINK_NAME]) {
        await userEvent.tab();
        expect(screen.getByRole('link', { name })).toHaveFocus();
      }
      const tooltip = within(getNavigation()).getByRole('tooltip');
      expect(tooltip).toBeVisible();

      await userEvent.keyboard('{Escape}');
      expect(tooltip).not.toBeVisible();
      expect(getBurgerButton()).toHaveAttribute('aria-expanded', 'true');
      expect(getCvLink()).toHaveFocus();

      await userEvent.keyboard('{Escape}');
      expect(getBurgerButton()).toHaveAttribute('aria-expanded', 'false');
      expect(getBurgerButton()).toHaveFocus();
    });

    it('closes with Escape while the burger has the focus', async () => {
      await renderHeader();
      await userEvent.click(getBurgerButton());

      await userEvent.keyboard('{Escape}');

      expect(getBurgerButton()).toHaveAttribute('aria-expanded', 'false');
      expect(getBurgerButton()).toHaveFocus();
    });

    it('leaves the focus where it is when Escape is pressed while the menu is closed', async () => {
      await renderHeader();
      act(() => getPageLink().focus());

      await userEvent.keyboard('{Escape}');

      expect(getPageLink()).toHaveFocus();
      expect(getBurgerButton()).toHaveAttribute('aria-expanded', 'false');
    });

    it('leaves the focus on a link chosen on the desktop layout', async () => {
      stubScreen({ isDesktop: true });
      await renderHeader();
      showDesktopNavigation();
      const projectsLink = screen.getByRole('link', { name: 'Projets' });
      act(() => projectsLink.focus());
      expect(projectsLink).toHaveFocus();

      await userEvent.keyboard('{Enter}');

      expect(projectsLink).toHaveFocus();
    });

    it('changes nothing on the desktop layout, where the menu is a bar of the page', async () => {
      stubScreen({ isDesktop: true });
      await renderHeader();
      // The burger is hidden on desktop, but jsdom still lets a click reach it
      await userEvent.click(getBurgerButton());

      getCoveredElements().forEach(element => expect(element.closest('[inert]')).toBeNull());
      act(() => getPageLink().focus());
      await userEvent.keyboard('{Escape}');
      expect(getPageLink()).toHaveFocus();
      expect(getBurgerButton()).toHaveAttribute('aria-expanded', 'true');
    });
  });
});
