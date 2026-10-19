import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';

import { declaredStyle, serializeCssValue } from '../../../styleTestUtils';
import { theme } from '../../../theme';
import { DESKTOP_MEDIA_QUERY } from '../constants';
import NavMenu from './NavMenu';

const items = [
  { name: 'Accueil', url: '/', end: true },
  { name: 'Projets', url: '/projects' },
];

/** Media query of the short screens, on which the open mobile menu is compact. */
const SHORT_SCREEN_MEDIA_QUERY = `(max-height: ${theme.screenHeights.short})`;

/** Renders the navigation with its props in a router at a path, the home page by default. */
const renderNavMenu = ({ path = '/', ...props } = {}) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <NavMenu {...props} />
    </MemoryRouter>,
  );

/** Name of the link that downloads the CV, which its text gives. */
const CV_LINK_NAME = 'Télécharger CV';

/** Names of the profile icons, in their order, which tell that they open a new tab. */
const PROFILE_LINK_NAMES = [
  'Profil GitHub d’ADAM Issoufi (nouvel onglet)',
  'Profil LinkedIn d’ADAM Issoufi (nouvel onglet)',
];

/** Value that the navigation declares for a property on an element on the desktop layout. */
const desktopStyle = ({ element, property, pseudo }) =>
  declaredStyle({ element, property, pseudo, media: DESKTOP_MEDIA_QUERY });

/** The link that downloads the CV, found even while the closed mobile menu hides it. */
const getCvLink = () => screen.getByRole('link', { name: CV_LINK_NAME, hidden: true });

/** The profile icons, in their order, found even while the closed mobile menu hides them. */
const getProfileLinks = () =>
  PROFILE_LINK_NAMES.map(name => screen.getByRole('link', { name, hidden: true }));

/** The row holding the profile icons. */
const getProfileRow = () => getProfileLinks()[0].parentElement;

/** The lines between the groups of the bar, which screen readers skip. */
const getSeparators = () =>
  [...getNavigation().children].filter(child => child.localName === 'span');

/** The navigation, found even while the closed mobile menu hides it. */
const getNavigation = () => screen.getByRole('navigation', { hidden: true });

describe('NavMenu', () => {
  it('renders the profile icons and the CV link without any props', () => {
    renderNavMenu();

    expect(getCvLink()).toHaveAttribute('href', '/CV - Adam Issoufi.pdf');
    expect(getProfileLinks()).toHaveLength(PROFILE_LINK_NAMES.length);
  });

  it('starts with the profile icons, after no line, without links', () => {
    renderNavMenu();

    expect(getSeparators()).toHaveLength(1);
    expect([...getNavigation().children]).toEqual([
      screen.getByRole('list', { hidden: true }),
      getProfileRow(),
      getSeparators()[0],
      getCvLink(),
    ]);
  });

  it('puts the links, a line, the profile icons, a line, then the CV link, in this order', () => {
    renderNavMenu({ items });

    const [firstSeparator, secondSeparator] = getSeparators();
    expect([...getNavigation().children]).toEqual([
      screen.getByRole('list', { hidden: true }),
      firstSeparator,
      getProfileRow(),
      secondSeparator,
      getCvLink(),
    ]);
  });

  it('goes through the links, the profile icons, then the CV link with Tab', async () => {
    renderNavMenu({ items, mobileMenuIsOpen: true });

    for (const name of ['Accueil', 'Projets', ...PROFILE_LINK_NAMES, CV_LINK_NAME]) {
      await userEvent.tab();
      expect(screen.getByRole('link', { name })).toHaveFocus();
    }
  });

  describe('separators', () => {
    it('hides them from screen readers, as they only decorate the bar', () => {
      renderNavMenu({ items });

      expect(getSeparators()).toHaveLength(2);
      getSeparators().forEach(separator => {
        expect(separator).toHaveAttribute('aria-hidden', 'true');
        expect(separator).toBeEmptyDOMElement();
      });
    });

    it('leaves them out of the open mobile menu, which spaces its groups with its gap', () => {
      renderNavMenu({ items, mobileMenuIsOpen: true });

      getSeparators().forEach(separator =>
        expect(getComputedStyle(separator).display).toBe('none'),
      );
    });

    it('draws each one on desktop as a faint line, as high as the text of the links', () => {
      renderNavMenu({ items });

      getSeparators().forEach(element => {
        expect(desktopStyle({ element, property: 'display' })).toBe('block');
        expect(desktopStyle({ element, property: 'height' })).toBe(theme.sizes[16]);
        expect(desktopStyle({ element, property: 'border-left' })).toBe(
          serializeCssValue({
            property: 'border-left',
            value: `${theme.borderWidths.thin} solid ${theme.colors['foreground-a25']}`,
          }),
        );
      });
    });

    it('stands halfway between its neighbours, which keep 16 px on each side as the links do', () => {
      renderNavMenu({ items });
      const [firstItem] = screen.getAllByRole('listitem', { hidden: true });

      expect(desktopStyle({ element: firstItem, property: 'padding' })).toBe(
        `${theme.space[10]} ${theme.space[16]}`,
      );
      expect(desktopStyle({ element: getProfileRow(), property: 'padding' })).toBe(
        serializeCssValue({ property: 'padding', value: `0 ${theme.space[16]}` }),
      );
      expect(desktopStyle({ element: getCvLink(), property: 'padding' })).toBe(
        `${theme.space[10]} ${theme.space[16]}`,
      );
      getSeparators().forEach(element => {
        expect(desktopStyle({ element, property: 'margin' })).toBe('');
      });
    });
  });

  describe('profile icons', () => {
    it('follow the links in the open mobile menu, on one row', () => {
      renderNavMenu({ items, mobileMenuIsOpen: true });

      getProfileLinks().forEach(link => expect(link).toBeVisible());
      expect(getProfileRow().previousElementSibling.previousElementSibling).toContainElement(
        screen.getByText('Projets'),
      );
      expect(getComputedStyle(getProfileRow()).flexDirection).toBe('row');
    });

    it.each(PROFILE_LINK_NAMES)('close the mobile menu when %s is clicked', async name => {
      const onClick = vi.fn(event => event?.preventDefault());
      renderNavMenu({ items, onClick, mobileMenuIsOpen: true });

      await userEvent.click(screen.getByRole('link', { name }));

      expect(onClick).toHaveBeenCalledOnce();
    });

    it('stay shown on desktop, in the bar of the header', () => {
      renderNavMenu({ items });

      expect(desktopStyle({ element: getProfileRow(), property: 'display' })).not.toBe('none');
      expect(desktopStyle({ element: getProfileRow(), property: 'animation' })).toBe('none');
    });
  });

  describe('CV link', () => {
    it('follows the profile icons in the open mobile menu, as a pill with its download icon', () => {
      renderNavMenu({ items, mobileMenuIsOpen: true });

      expect(getCvLink()).toBeVisible();
      expect(getCvLink().previousElementSibling.previousElementSibling).toBe(getProfileRow());
      expect(getCvLink()).toHaveTextContent(/^Télécharger CV$/);
      expect(getCvLink().querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
      expect(getComputedStyle(getCvLink()).borderRadius).toBe(theme.radii.pill);
    });

    it('gets smaller on a short screen, as the links do, to stay clear of the language toggle', () => {
      renderNavMenu({ items, mobileMenuIsOpen: true });
      const shortScreenStyle = property =>
        declaredStyle({ element: getCvLink(), property, media: SHORT_SCREEN_MEDIA_QUERY });

      expect(shortScreenStyle('font-size')).toBe(theme.fontSizes[16]);
      expect(shortScreenStyle('padding')).toBe(`${theme.space[10]} ${theme.space[24]}`);
    });

    it('is big enough for a finger in the mobile menu, even on a short screen', () => {
      renderNavMenu({ items, mobileMenuIsOpen: true });

      expect(getComputedStyle(getCvLink()).minHeight).toBe(theme.sizes['finger-target']);
      expect(
        declaredStyle({
          element: getCvLink(),
          property: 'min-height',
          media: SHORT_SCREEN_MEDIA_QUERY,
        }),
      ).toBe('');
    });

    it('closes the mobile menu when it is clicked', async () => {
      const onClick = vi.fn(event => event?.preventDefault());
      renderNavMenu({ items, onClick, mobileMenuIsOpen: true });

      await userEvent.click(getCvLink());

      expect(onClick).toHaveBeenCalledOnce();
    });

    it('is a text link like the others in the bar of the header on desktop, without its icon', () => {
      renderNavMenu({ items });
      const [firstItem] = screen.getAllByRole('listitem', { hidden: true });

      expect(desktopStyle({ element: getCvLink(), property: 'display' })).not.toBe('none');
      expect(desktopStyle({ element: getCvLink(), property: 'font-size' })).toBe(
        desktopStyle({ element: firstItem, property: 'font-size' }),
      );
      expect(desktopStyle({ element: getCvLink(), property: 'letter-spacing' })).toBe(
        desktopStyle({ element: firstItem, property: 'letter-spacing' }),
      );
      expect(desktopStyle({ element: getCvLink(), property: 'border-style' })).toBe('none');
      expect(desktopStyle({ element: getCvLink(), property: 'min-height' })).toBe('0px');
      expect(desktopStyle({ element: getCvLink(), property: 'display', pseudo: ' svg' })).toBe(
        'none',
      );
    });

    it('turns to the accent color and grows on hover on desktop, as the links do', () => {
      renderNavMenu({ items });

      expect(desktopStyle({ element: getCvLink(), property: 'color', pseudo: ':hover' })).toBe(
        serializeCssValue({ property: 'color', value: theme.colors['accent-foreground'] }),
      );
      expect(desktopStyle({ element: getCvLink(), property: 'transform', pseudo: ':hover' })).toBe(
        'scale(1.06)',
      );
    });
  });

  describe('open mobile menu', () => {
    it('scrolls when higher than the screen, from its top, without scrolling the page', () => {
      renderNavMenu({ items, mobileMenuIsOpen: true });

      expect(getComputedStyle(getNavigation()).overflowY).toBe('auto');
      expect(declaredStyle({ element: getNavigation(), property: 'overscroll-behavior' })).toBe(
        'contain',
      );
      // Plain centering would push the top of a higher menu above the screen, out of reach
      expect(declaredStyle({ element: getNavigation(), property: 'justify-content' })).toBe(
        'safe center',
      );
    });

    it('gets more compact on a short screen, as on a phone held sideways', () => {
      renderNavMenu({ items, mobileMenuIsOpen: true });
      const shortScreenStyle = ({ element, property }) =>
        declaredStyle({ element, property, media: SHORT_SCREEN_MEDIA_QUERY });
      const [firstItem] = screen.getAllByRole('listitem');

      expect(shortScreenStyle({ element: getNavigation(), property: 'gap' })).toBe(theme.space[16]);
      expect(shortScreenStyle({ element: firstItem, property: 'font-size' })).toBe(
        theme.fontSizes[22],
      );
      expect(shortScreenStyle({ element: firstItem, property: 'padding' })).toBe(
        `${theme.space[6]} ${theme.space[48]}`,
      );
      expect(shortScreenStyle({ element: screen.getByRole('list'), property: 'gap' })).toBe('0px');
    });

    it('keeps the menu as it is on a short screen of the desktop layout', () => {
      renderNavMenu({ items });

      expect(
        declaredStyle({
          element: screen.getByRole('list', { hidden: true }),
          property: 'gap',
          media: DESKTOP_MEDIA_QUERY,
        }),
      ).toBe('0px');
      expect(
        declaredStyle({
          element: screen.getByRole('navigation', { hidden: true }),
          property: 'overflow-y',
          media: DESKTOP_MEDIA_QUERY,
        }),
      ).toBe('visible');
    });
  });

  it('renders the links and highlights the active one', () => {
    renderNavMenu({ path: '/projects', items });

    expect(screen.getByText('Projets').closest('a')).toHaveClass('active');
    expect(screen.getByText('Accueil').closest('a')).not.toHaveClass('active');
  });

  it('lists the links with an explicit list role, which Safari drops from lists without bullets', () => {
    renderNavMenu({ items });
    const list = screen.getByRole('list', { hidden: true });

    expect(list).toHaveAttribute('role', 'list');
    expect(within(list).getAllByRole('listitem', { hidden: true })).toHaveLength(items.length);
  });

  it('keeps the list role without any items', () => {
    renderNavMenu();
    const list = screen.getByRole('list', { hidden: true });

    expect(list).toHaveAttribute('role', 'list');
    expect(list).toBeEmptyDOMElement();
  });

  it('calls onClick when a link is clicked', async () => {
    const onClick = vi.fn();
    renderNavMenu({ items, onClick });

    await userEvent.click(screen.getByText('Projets'));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('gives the navigation its id, so a button can name it as the menu it controls', () => {
    renderNavMenu({ id: 'mobile-menu' });

    expect(screen.getByRole('navigation', { hidden: true })).toHaveAttribute('id', 'mobile-menu');
  });

  it.each([
    ['without one', {}],
    ['when it is empty', { id: '' }],
  ])('gives the navigation no id %s', (_case, props) => {
    renderNavMenu(props);

    expect(screen.getByRole('navigation', { hidden: true })).not.toHaveAttribute('id');
  });
});
