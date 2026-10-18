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

const renderAt = (path, props) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <NavMenu {...props} />
    </MemoryRouter>,
  );

describe('NavMenu', () => {
  it('renders the CV link without any props', () => {
    renderAt('/');

    expect(screen.getByText('CV').closest('a')).toHaveAttribute('href', '/CV - Adam Issoufi.pdf');
  });

  describe('CV button', () => {
    const getCvLink = () => screen.getByRole('link', { name: 'Télécharger le CV', hidden: true });

    it('follows the links in the open mobile menu, with its download icon', () => {
      renderAt('/', { items, mobileMenuIsOpen: true });

      expect(getCvLink()).toBeVisible();
      // The link sits in the element that also holds its tooltip
      expect(getCvLink().parentElement.previousElementSibling).toContainElement(
        screen.getByText('Projets'),
      );
      expect(getCvLink().querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    });

    it('closes the mobile menu when it is clicked', async () => {
      const onClick = vi.fn(event => event?.preventDefault());
      renderAt('/', { items, onClick, mobileMenuIsOpen: true });

      await userEvent.click(getCvLink());

      expect(onClick).toHaveBeenCalledOnce();
    });

    it('shows its tooltip above it, where the GitHub icon under it leaves it room', () => {
      renderAt('/', { items, mobileMenuIsOpen: true });

      const tooltip = screen.getByRole('tooltip', { hidden: true });
      expect(getCvLink()).toHaveAttribute('aria-labelledby', tooltip.id);
      expect(declaredStyle({ element: tooltip, property: 'bottom' })).toBe(
        serializeCssValue({
          property: 'bottom',
          value: `calc(100% + ${theme.space['tooltip-gap']})`,
        }),
      );
    });

    it('is spaced by the gap of the open menu, with no margin to move its tooltip away', () => {
      renderAt('/', { items, mobileMenuIsOpen: true });

      expect(getComputedStyle(screen.getByRole('navigation')).gap).toBe(theme.space[28]);
      expect(declaredStyle({ element: getCvLink(), property: 'margin-top' })).toBe('');
      expect(declaredStyle({ element: getCvLink(), property: 'margin' })).toBe('');
    });

    it('is hidden on desktop, where the header floats it under the language toggle', () => {
      renderAt('/', { items });

      const display = declaredStyle({
        element: getCvLink(),
        property: 'display',
        media: DESKTOP_MEDIA_QUERY,
      });
      expect(display).toBe('none');
    });
  });

  describe('open mobile menu', () => {
    const getNavigation = () => screen.getByRole('navigation');

    it('scrolls when higher than the screen, from its top, without scrolling the page', () => {
      renderAt('/', { items, mobileMenuIsOpen: true });

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
      renderAt('/', { items, mobileMenuIsOpen: true });
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
      // The gap of the menu alone would leave the tooltip of the CV button over the last link
      expect(
        shortScreenStyle({ element: screen.getByRole('list'), property: 'margin-bottom' }),
      ).toBe(theme.space[20]);
    });

    it('keeps the menu as it is on a short screen of the desktop layout', () => {
      renderAt('/', { items });

      expect(
        declaredStyle({
          element: screen.getByRole('list', { hidden: true }),
          property: 'margin-bottom',
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
    renderAt('/projects', { items });

    expect(screen.getByText('Projets').closest('a')).toHaveClass('active');
    expect(screen.getByText('Accueil').closest('a')).not.toHaveClass('active');
  });

  it('lists the links with an explicit list role, which Safari drops from lists without bullets', () => {
    renderAt('/', { items });
    const list = screen.getByRole('list', { hidden: true });

    expect(list).toHaveAttribute('role', 'list');
    expect(within(list).getAllByRole('listitem', { hidden: true })).toHaveLength(items.length);
  });

  it('keeps the list role without any items', () => {
    renderAt('/');
    const list = screen.getByRole('list', { hidden: true });

    expect(list).toHaveAttribute('role', 'list');
    expect(list).toBeEmptyDOMElement();
  });

  it('calls onClick when a link is clicked', async () => {
    const onClick = vi.fn();
    renderAt('/', { items, onClick });

    await userEvent.click(screen.getByText('Projets'));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  describe('GitHub icon', () => {
    const getGitHubLink = () =>
      screen.getByRole('link', { name: 'Profil GitHub d’ADAM Issoufi', hidden: true });

    it('follows the CV button in the mobile menu', () => {
      renderAt('/', { items, mobileMenuIsOpen: true });

      // After the element that holds the CV button and its tooltip
      const cvLink = screen.getByText('CV').closest('a');
      expect(cvLink.parentElement.nextElementSibling).toBe(getGitHubLink());
      expect(getGitHubLink()).toBeVisible();
    });

    it('closes the mobile menu when it is clicked', async () => {
      const onClick = vi.fn(event => event?.preventDefault());
      renderAt('/', { items, onClick, mobileMenuIsOpen: true });

      await userEvent.click(getGitHubLink());

      expect(onClick).toHaveBeenCalledOnce();
    });

    it('is hidden on desktop, where the header floats it under the CV button', () => {
      renderAt('/', { items });

      const display = declaredStyle({
        element: getGitHubLink(),
        property: 'display',
        media: DESKTOP_MEDIA_QUERY,
      });
      expect(display).toBe('none');
    });
  });

  it('gives the navigation its id, so a button can name it as the menu it controls', () => {
    renderAt('/', { id: 'mobile-menu' });

    expect(screen.getByRole('navigation', { hidden: true })).toHaveAttribute('id', 'mobile-menu');
  });

  it.each([
    ['without one', {}],
    ['when it is empty', { id: '' }],
  ])('gives the navigation no id %s', (_case, props) => {
    renderAt('/', props);

    expect(screen.getByRole('navigation', { hidden: true })).not.toHaveAttribute('id');
  });
});
