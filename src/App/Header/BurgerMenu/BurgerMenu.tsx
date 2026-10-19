import type { Ref } from 'react';
import { useTranslation } from 'react-i18next';

import { BottomBar, Button, MiddleBar, TopBar } from './BurgerMenu.styled.ts';

/** Props of {@link BurgerMenu}. */
interface BurgerMenuProps {
  /** Whether the mobile menu is open; the icon then shows a cross. @default false */
  isOpen?: boolean;
  /**
   * `id` of the menu the button opens and closes, announced to screen readers as the element it
   * controls. Without it, or when empty, the button names no menu.
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
 * Burger button that opens and closes the mobile menu. Its icon is three bars drawn in CSS, shown
 * with the first render: when the menu opens, the outer bars slide onto the middle one, then the
 * bars turn into a cross; when it closes, the cross turns back, then the bars slide apart. A menu
 * open from the first render shows the cross at once.
 * The parent owns the open state and passes it back through `isOpen`.
 *
 * It is a native button, so `Tab` reaches it and `Enter` or `Space` toggles the menu. Screen
 * readers announce it with a translated name that follows the state ("Ouvrir le menu" / "Open
 * menu", then "Fermer le menu" / "Close menu"), its expanded state and the menu it controls.
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
    <Button
      type="button"
      ref={ref}
      aria-label={label}
      aria-expanded={isOpen}
      aria-controls={controlledMenuId}
      onClick={handleBurgerMenuClick}
    >
      <TopBar $isOpen={isOpen} />
      <MiddleBar $isOpen={isOpen} />
      <BottomBar $isOpen={isOpen} />
    </Button>
  );
};

export default BurgerMenu;
