import { NavLink } from 'react-router';

import DownloadIcon from './icons/download.svg?react';
import { CtaButton, Nav, NavItem, NavList } from './NavMenu.styled';

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
  /** Called when a link or the CV button is clicked, so the parent can close the mobile menu. */
  onClick?: () => void;
}

const NO_ITEMS: Item[] = [];

/**
 * Main navigation: the route links, with the active one highlighted, and the CV download button.
 * Displayed as a horizontal bar on desktop and as a full-screen overlay on mobile.
 * Must be rendered inside a router, because the links are `NavLink`s.
 */
const NavMenu = ({ id, items = NO_ITEMS, onClick, mobileMenuIsOpen = false }: NavMenuProps) => {
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
      <CtaButton
        target="_blank"
        rel="noreferrer"
        onClick={onClick}
        href="/CV - Adam Issoufi.pdf"
      >
        <DownloadIcon className="icon" />
        <span className="text">CV</span>
      </CtaButton>
    </Nav>
  );
};

export default NavMenu;
