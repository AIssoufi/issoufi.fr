import type { AnimationItem } from 'lottie-web';
import { useEffect, useEffectEvent, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import burgerMenuData from './burger-menu.json';
import { Button } from './BurgerMenu.styled';
import { CLOSE_ANIMATION, OPEN_ANIMATION } from './constants';
import { useLottieAnimation } from './hooks/useLottieAnimation';

/** Props of {@link BurgerMenu}. */
interface BurgerMenuProps {
  /** Whether the mobile menu is open; drives the icon animation direction. @default false */
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
}

/**
 * Animated burger button that opens and closes the mobile menu. Plays a Lottie animation forward
 * on open and backward on close; the animation is drawn once lottie-web is loaded, after the
 * first render, and destroyed on unmount. The icon keeps its size meanwhile, and shows the cross
 * at once when the menu was opened before the animation was drawn.
 * The parent owns the open state and passes it back through `isOpen`.
 *
 * It is a native button, so `Tab` reaches it and `Enter` or `Space` toggles the menu. Screen
 * readers announce it with a translated name that follows the state ("Ouvrir le menu" / "Open
 * menu", then "Fermer le menu" / "Close menu"), its expanded state and the menu it controls.
 */
const BurgerMenu = ({ isOpen = false, menuId, onOpen, onClose }: BurgerMenuProps) => {
  const { t } = useTranslation();
  const menuBurgerEl = useRef<HTMLButtonElement>(null);
  const lottieInstance = useLottieAnimation({
    containerRef: menuBurgerEl,
    animationData: burgerMenuData,
  });

  // An effect event reads the latest open state but does not run again when it changes: a toggle
  // plays the animation, and only the first draw jumps straight to the cross
  const showCrossIfOpen = useEffectEvent((animation: AnimationItem) => {
    const lastFrame = animation.totalFrames - 1;
    if (isOpen) animation.goToAndStop(lastFrame, true);
  });

  useEffect(() => {
    if (lottieInstance) showCrossIfOpen(lottieInstance);
  }, [lottieInstance]);

  useEffect(() => {
    if (!lottieInstance) return;
    if (!isOpen) {
      lottieInstance.setSpeed(CLOSE_ANIMATION.speedMultiplier);
      lottieInstance.setDirection(CLOSE_ANIMATION.direction);
      lottieInstance.play();
    }
  }, [isOpen, lottieInstance]);

  const handleBurgerMenuClick = () => {
    if (isOpen) {
      onClose?.();
      lottieInstance?.setSpeed(CLOSE_ANIMATION.speedMultiplier);
      lottieInstance?.setDirection(CLOSE_ANIMATION.direction);
    } else {
      onOpen?.();
      lottieInstance?.setSpeed(OPEN_ANIMATION.speedMultiplier);
      lottieInstance?.setDirection(OPEN_ANIMATION.direction);
    }
    lottieInstance?.play();
  };

  const label = isOpen ? t('burgerMenu.close') : t('burgerMenu.open');
  // An empty id names no element: the attribute is left out instead
  const controlledMenuId = menuId || undefined;

  return (
    <Button
      type="button"
      ref={menuBurgerEl}
      aria-label={label}
      aria-expanded={isOpen}
      aria-controls={controlledMenuId}
      onClick={handleBurgerMenuClick}
    />
  );
};

export default BurgerMenu;
