import { useId, useRef, useState } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';

import BurgerMenu from './BurgerMenu';
import { DESKTOP_MEDIA_QUERY } from './constants';
import { useEscapeKey } from './hooks/useEscapeKey';
import { useInertOutside } from './hooks/useInertOutside';
import { useMediaQuery } from './hooks/useMediaQuery';
import LangToggle from './LangToggle';
import NavMenu from './NavMenu';

import { Actions, Container, Logo, Menu } from './Header.styled';

/**
 * Site header: the "AI" logo linking home, the language toggle, the navigation and, on mobile,
 * the burger button that opens it. Owns the open state of the mobile menu, and closes it after
 * each navigation and when the screen grows to the desktop layout, as when a tablet is rotated.
 * Must be rendered inside a router.
 *
 * The burger button comes before the links in the page, so once a keyboard user opens the menu,
 * the next `Tab` reaches its first link. While open, the mobile menu acts as a modal dialog: the
 * rest of the page is inert, so `Tab` and `Shift+Tab` only reach the burger and the links, and
 * `Escape` closes it and gives the focus back to the burger. None of this applies to the desktop
 * layout, where the links are a bar of the page.
 */
const Header = ({ testId }: HeaderProps) => {
  const [mobileMenuIsOpen, setMobileMenuIsOpen] = useState(false);
  const navMenuId = useId();
  const menuRef = useRef<HTMLDivElement>(null);
  const burgerRef = useRef<HTMLButtonElement>(null);
  const { t } = useTranslation();

  const closeMobileMenuOnDesktop = (isDesktopLayout: boolean) => {
    if (isDesktopLayout) setMobileMenuIsOpen(false);
  };
  const isDesktop = useMediaQuery({
    query: DESKTOP_MEDIA_QUERY,
    onChange: closeMobileMenuOnDesktop,
  });

  // The burger is hidden on the desktop layout, where the links are a bar of the page: the menu
  // never covers the page there
  const isMenuCoveringPage = mobileMenuIsOpen && !isDesktop;

  useInertOutside({ containerRef: menuRef, isActive: isMenuCoveringPage });
  useEscapeKey({
    isActive: isMenuCoveringPage,
    onEscape: () => {
      setMobileMenuIsOpen(false);
      burgerRef.current?.focus();
    },
  });

  const items = [
    { name: t('nav.home'), url: '/', end: true },
    { name: t('nav.projects'), url: '/projects' },
    { name: t('nav.experience'), url: '/experiences' },
  ];

  return (
    <Container data-testid={testId}>
      <Logo>
        <Link to="/">AI</Link>
      </Logo>
      <Actions>
        <LangToggle />
        <Menu
          ref={menuRef}
          $isSticky={mobileMenuIsOpen}
        >
          <BurgerMenu
            ref={burgerRef}
            isOpen={mobileMenuIsOpen}
            menuId={navMenuId}
            onOpen={() => setMobileMenuIsOpen(true)}
            onClose={() => setMobileMenuIsOpen(false)}
          />
          <NavMenu
            id={navMenuId}
            items={items}
            mobileMenuIsOpen={mobileMenuIsOpen}
            onClick={() => setMobileMenuIsOpen(false)}
          />
        </Menu>
      </Actions>
    </Container>
  );
};

export default Header;

/** Props of {@link Header}. */
interface HeaderProps {
  /** `data-testid` set on the header element, for tests. */
  testId?: string;
}
