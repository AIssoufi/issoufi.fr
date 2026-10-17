import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import BurgerMenu from './BurgerMenu';
import NavMenu from './NavMenu';

import { Container, Logo, Menu } from './Header.styled';

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
    </Container>
  );
};

export default Header;

interface HeaderProps {
  testId?: string;
}
