import { NavLink } from 'react-router';

import { MenuCvLink, MenuProfileLinks, Nav, NavItem, NavList, Separator } from './NavMenu.styled';

/** A single link of the navigation menu. */
interface Item {
  /** Label shown in the menu, already translated. */
  name: string;
  /**
   * Route path the link points to, e.g. `/projects`.
   * Also used as the React key, so it must be unique.
   */
  url: string;
  /**
   * Marks the link active only on an exact path match.
   * Needed for `/`, which would otherwise be active on every route.
   * @default false
   */
  end?: boolean;
}

/** Props of {@link NavMenu}. */
interface NavMenuProps {
  /**
   * `id` of the navigation element, so the button that opens it can name it in `aria-controls`.
   * Left out when empty, as an empty `id` is invalid.
   */
  id?: string;
  /** Links to render, in display order. @default [] */
  items?: Item[];
  /**
   * Whether the full-screen mobile menu is open. Below `50em` the menu is hidden while false;
   * on wider screens it is always shown as a horizontal bar.
   * @default false
   */
  mobileMenuIsOpen?: boolean;
  /**
   * Called when a link, one of the profile icons or the CV link is clicked, so the parent can
   * close the mobile menu.
   */
  onClick?: () => void;
}

const NO_ITEMS: Item[] = [];

/**
 * Main navigation: the route links, with the active one highlighted, then the GitHub and LinkedIn
 * icons (see `ProfileLinks`) and the link that downloads the CV, "Télécharger CV". Displayed
 * as a horizontal bar on desktop, where a line stands between the route links, when there are
 * any, and the icons, and another between the icons and the CV link, and as a full-screen overlay
 * on mobile, where the same items follow each other, centered: the links, the icons on one row,
 * then the CV link as a pill with a download icon. On a short screen, as on a phone held sideways, the overlay is more
 * compact, and it scrolls whenever its content is higher than the screen. Must be rendered inside
 * a router, because the links are `NavLink`s.
 */
const NavMenu = ({ id, items = NO_ITEMS, onClick, mobileMenuIsOpen = false }: NavMenuProps) => {
  // Without links, the bar starts with the icons, and no line stands before them
  const hasItems = items.length > 0;

  return (
    <Nav
      id={id || undefined}
      $mobileMenuIsOpen={mobileMenuIsOpen}
    >
      <NavList>
        {items.map(item => (
          <NavItem key={item.url}>
            <NavLink
              to={item.url}
              end={item.end}
              onClick={onClick}
              className={({ isActive }) => (isActive ? 'active' : '')}
            >
              {item.name}
            </NavLink>
          </NavItem>
        ))}
      </NavList>
      {hasItems && <Separator aria-hidden />}
      <MenuProfileLinks onClick={onClick} />
      <Separator aria-hidden />
      <MenuCvLink
        hasIcon
        onClick={onClick}
      />
    </Nav>
  );
};

export default NavMenu;
