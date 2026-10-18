import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import lottie from 'lottie-web/build/player/lottie_light';
import { BrowserRouter as Router } from 'react-router';

import i18n from '../../i18n';
import Header from './Header';

/**
 * Renders the header above a page holding a link, which the open mobile menu covers, then waits
 * for the burger icon animation, drawn once lottie-web is loaded, so that this update never lands
 * outside `act` after the test.
 */
const renderHeader = async () => {
  const loadAnimation = vi.spyOn(lottie, 'loadAnimation');
  render(
    <Router>
      <Header testId="header" />
      <main>
        <a href="/page">Page link</a>
      </main>
    </Router>,
  );
  await waitFor(() => expect(loadAnimation).toHaveBeenCalled());
};

/**
 * Replaces `window.matchMedia`, which jsdom lacks, so that every media query matches: the header
 * then sees the desktop layout.
 */
const stubDesktopScreen = () => {
  vi.stubGlobal('matchMedia', () => ({
    matches: true,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
};

/** The burger button, whatever its state and language. */
const getBurgerButton = () => screen.getByRole('button', { name: /menu/i });

/** The navigation, found even while the closed mobile menu hides it. */
const getNavigation = () => screen.getByRole('navigation', { hidden: true });

/** The element holding the burger button and the navigation, fixed while the menu is open. */
const getMenu = () => getBurgerButton().parentElement;

/** The last link of the menu, which downloads the CV. */
const getCvLink = () => screen.getByRole('link', { name: 'CV' });

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

  it('renders the CV button', async () => {
    await renderHeader();
    expect(screen.getByText('CV')).toBeInTheDocument();
  });

  it('renders nav links with correct hrefs', async () => {
    await renderHeader();
    expect(screen.getByText('Accueil').closest('a')).toHaveAttribute('href', '/');
    expect(screen.getByText('Projets').closest('a')).toHaveAttribute('href', '/projects');
    expect(screen.getByText('Expériences').closest('a')).toHaveAttribute('href', '/experiences');
  });

  it('renders CV link pointing to the PDF', async () => {
    await renderHeader();
    expect(screen.getByText('CV').closest('a')).toHaveAttribute('href', '/CV - Adam Issoufi.pdf');
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

      for (const name of ['Accueil', 'Projets', 'Expériences', 'CV']) {
        await userEvent.tab();
        expect(screen.getByRole('link', { name })).toHaveFocus();
      }
    });

    it('keeps Tab in the menu after its last link, away from the page behind', async () => {
      await renderHeader();
      await userEvent.click(getBurgerButton());
      act(() => getCvLink().focus());

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

    it('changes nothing on the desktop layout, where the menu is a bar of the page', async () => {
      stubDesktopScreen();
      await renderHeader();
      // The burger is hidden on desktop: its menu stays open when a screen grows to this layout
      await userEvent.click(getBurgerButton());

      getCoveredElements().forEach(element => expect(element.closest('[inert]')).toBeNull());
      act(() => getPageLink().focus());
      await userEvent.keyboard('{Escape}');
      expect(getPageLink()).toHaveFocus();
      expect(getBurgerButton()).toHaveAttribute('aria-expanded', 'true');
    });
  });
});
