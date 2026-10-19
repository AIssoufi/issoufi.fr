import type { Ref } from 'react';
import { useTranslation } from 'react-i18next';

import BurgerIcon from './BurgerIcon/index.ts';
import { CLOSED_MENU_FRAGMENT } from './constants.ts';
import { Button, CloseLink, OpenLink } from './BurgerMenu.styled.ts';

/** Props of {@link BurgerMenu}. */
interface BurgerMenuProps {
  /** Whether the mobile menu is open; the icon then shows a cross. @default false */
  isOpen?: boolean;
  /**
   * `id` of the menu the button opens and closes, announced to screen readers as the element it
   * controls, and named by the links that stand for the button without JavaScript. Without it, or
   * when empty, the button names no menu, and those links are left out.
   */
  menuId?: string;
  /** Called when the button is pressed (click, `Enter` or `Space`) while the menu is closed. */
  onOpen?: () => void;
  /** Called when the button is pressed (click, `Enter` or `Space`) while the menu is open. */
  onClose?: () => void;
  /** Receives the button element, so the parent can give it the focus back. */
  ref?: Ref<HTMLButtonElement>;
}

/**
 * Burger button that opens and closes the mobile menu, with the bars of {@link BurgerIcon}, which
 * turn into a cross while the menu is open. The parent owns the open state and passes it back
 * through `isOpen`.
 *
 * It is a native button, so `Tab` reaches it and `Enter` or `Space` toggles the menu. Screen
 * readers announce it with a translated name that follows the state ("Ouvrir le menu" / "Open
 * menu", then "Fermer le menu" / "Close menu"), its expanded state and the menu it controls.
 *
 * Without JavaScript, the button can do nothing: below the `tablet` breakpoint, two links with the
 * same look and names take its place. The first one leads to the fragment of the menu
 * (`#menu`), which opens it (see `NavMenu`), then the second one, a cross, takes its place and
 * leads to a fragment of no element, which closes it. A page that runs scripts never shows them.
 */
const BurgerMenu = ({ isOpen = false, menuId, onOpen, onClose, ref }: BurgerMenuProps) => {
  const { t } = useTranslation();

  const handleBurgerMenuClick = () => {
    if (isOpen) onClose?.();
    else onOpen?.();
  };

  const label = isOpen ? t('burgerMenu.close') : t('burgerMenu.open');
  // An empty id names no element: the attribute is left out instead
  const controlledMenuId = menuId || undefined;

  return (
    <>
      <Button
        type="button"
        ref={ref}
        aria-label={label}
        aria-expanded={isOpen}
        aria-controls={controlledMenuId}
        onClick={handleBurgerMenuClick}
      >
        <BurgerIcon isOpen={isOpen} />
      </Button>
      {controlledMenuId && (
        <>
          <OpenLink
            href={`#${controlledMenuId}`}
            aria-label={t('burgerMenu.open')}
            aria-expanded={false}
            aria-controls={controlledMenuId}
          >
            <BurgerIcon />
          </OpenLink>
          <CloseLink
            href={CLOSED_MENU_FRAGMENT}
            aria-label={t('burgerMenu.close')}
            aria-expanded
            aria-controls={controlledMenuId}
          >
            <BurgerIcon isOpen />
          </CloseLink>
        </>
      )}
    </>
  );
};

export default BurgerMenu;
