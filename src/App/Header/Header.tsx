import { useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import LocalizedLink from '../../components/LocalizedLink/index.ts';
import { useMediaQuery } from '../../hooks/useMediaQuery/index.ts';
import { useUrlLanguage } from '../../hooks/useUrlLanguage/index.ts';
import { localizePath } from '../../i18n/utils.ts';
import BurgerMenu from './BurgerMenu/index.ts';
import { DESKTOP_MEDIA_QUERY } from './constants.ts';
import { useEscapeKey } from './hooks/useEscapeKey/index.ts';
import { useInertOutside } from './hooks/useInertOutside/index.ts';
import { useScrollLock } from './hooks/useScrollLock/index.ts';
import LangToggle from './LangToggle/index.ts';
import NavMenu from './NavMenu/index.ts';
import { formatVersion } from './utils.ts';

import {
  Actions,
  Brand,
  BuildVersion,
  Container,
  FloatingControls,
  Logo,
  Menu,
} from './Header.styled.ts';

/**
 * Site header: the "AI" logo linking home, followed by the version of the build in small letters
 * (`build v1.0.0`, see {@link formatVersion}), the language toggle, the navigation and, on mobile,
 * the burger button that opens it. The navigation holds the links to the pages, in the language of
 * the current URL, then the GitHub and LinkedIn icons and the link that downloads the CV (see
 * `NavMenu`). From tablet up, it is a bar of the header and the language toggle floats alone on
 * the right edge of the screen. Owns the open state of the mobile menu, and closes it when one of
 * its links is followed and when the screen grows to the desktop layout, as when a tablet is
 * rotated. It stays at the top of the screen down to the end of every page, and is compact on a
 * short screen, as on a phone held sideways, so the page keeps most of it. Must be rendered inside
 * a router.
 *
 * `Tab` follows the screen: the logo, the navigation, then the language toggle, which comes after
 * the navigation in the page, as it floats on the middle right of the screen from tablet up; on
 * mobile, it still shows before the burger. The burger button comes before the links in the page,
 * so once a keyboard user opens the menu, the next `Tab` reaches its first link. While open, the
 * mobile menu acts as a modal dialog: the language toggle and the burger stay above it, in the
 * header row, and the rest of the page is inert, so `Tab` and `Shift+Tab` only reach the burger,
 * the links and the toggle; the page behind it no longer scrolls (see {@link useScrollLock}), and
 * `Escape` or a click on one of its links closes it and gives the focus back to the burger, rather
 * than leaving it on a hidden link. The toggle changes the language without closing it. None of
 * this applies to the desktop layout, where the links are a bar of the page.
 */
const Header = ({ testId, version = __APP_VERSION__ }: HeaderProps) => {
  const [mobileMenuIsOpen, setMobileMenuIsOpen] = useState(false);
  const navMenuId = useId();
  const controlsRef = useRef<HTMLDivElement>(null);
  const burgerRef = useRef<HTMLButtonElement>(null);
  const { t } = useTranslation();
  const versionText = formatVersion(version);
  const showsVersion = versionText !== '';
  const language = useUrlLanguage();

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

  // Closing hides the links, and the focus would fall back to the body from a hidden one: the
  // burger takes it back, and a navigation then moves it on to the new page
  const closeMobileMenu = () => {
    setMobileMenuIsOpen(false);
    if (isMenuCoveringPage) burgerRef.current?.focus();
  };

  // The language toggle stays usable over the open menu, like the burger: both stay reachable
  useInertOutside({ containerRef: controlsRef, isActive: isMenuCoveringPage });
  useEscapeKey({ isActive: isMenuCoveringPage, onEscape: closeMobileMenu });
  useScrollLock({ isActive: isMenuCoveringPage });

  const items = [
    { name: t('nav.home'), url: localizePath({ path: '/', language }), end: true },
    { name: t('nav.projects'), url: localizePath({ path: '/projects', language }) },
    { name: t('nav.experience'), url: localizePath({ path: '/experiences', language }) },
  ];

  return (
    <Container data-testid={testId}>
      <Brand>
        <Logo>
          <LocalizedLink to="/">AI</LocalizedLink>
        </Logo>
        {showsVersion && (
          <BuildVersion>{t('header.buildVersion', { version: versionText })}</BuildVersion>
        )}
      </Brand>
      <Actions ref={controlsRef}>
        <Menu>
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
            onClick={closeMobileMenu}
          />
        </Menu>
        <FloatingControls>
          <LangToggle />
        </FloatingControls>
      </Actions>
    </Container>
  );
};

export default Header;

/** Props of {@link Header}. */
interface HeaderProps {
  /** `data-testid` set on the header element, for tests. */
  testId?: string;
  /**
   * Version of the site shown after the logo, as `package.json` writes it, e.g. `1.0.0`. Not shown
   * when empty. Defaults to the version of the build, which Vite reads from `package.json`.
   * @default __APP_VERSION__
   */
  version?: string;
}
