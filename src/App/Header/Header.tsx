import { useState } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';

import BurgerMenu from './BurgerMenu';
import LangToggle from './LangToggle';
import NavMenu from './NavMenu';

import { Actions, Container, Logo, Menu } from './Header.styled';

/**
 * Site header: the "AI" logo linking home, the language toggle, the navigation and, on mobile,
 * the burger icon that opens it. Owns the open state of the mobile menu and closes it after
 * each navigation. Must be rendered inside a router.
 */
const Header = ({ testId }: HeaderProps) => {
  const [mobileMenuIsOpen, setMobileMenuIsOpen] = useState(false);
  const { t } = useTranslation();

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
        <Menu $isSticky={mobileMenuIsOpen}>
          <NavMenu
            items={items}
            mobileMenuIsOpen={mobileMenuIsOpen}
            onClick={() => setMobileMenuIsOpen(false)}
          />
          <BurgerMenu
            isOpen={mobileMenuIsOpen}
            onOpen={() => setMobileMenuIsOpen(true)}
            onClose={() => setMobileMenuIsOpen(false)}
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
