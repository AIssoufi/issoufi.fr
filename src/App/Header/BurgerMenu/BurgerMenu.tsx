import { useEffect, useRef } from 'react';

import burgerMenuData from './burger-menu.json';
import { Container } from './BurgerMenu.styled';
import { CLOSE_ANIMATION, OPEN_ANIMATION } from './constants';
import { useLottieAnimation } from './hooks/useLottieAnimation';

/** Props of {@link BurgerMenu}. */
interface BurgerMenuProps {
  /** Whether the mobile menu is open; drives the icon animation direction. @default false */
  isOpen?: boolean;
  /** Called when the icon is clicked while the menu is closed. */
  onOpen?: () => void;
  /** Called when the icon is clicked while the menu is open. */
  onClose?: () => void;
}

/**
 * Animated burger icon that opens and closes the mobile menu. Plays a Lottie animation forward
 * on open and backward on close; the animation is drawn once lottie-web is loaded, after the
 * first render, and destroyed on unmount. The icon keeps its size meanwhile.
 * The parent owns the open state and passes it back through `isOpen`.
 */
const BurgerMenu = ({ isOpen = false, onOpen, onClose }: BurgerMenuProps) => {
  const menuBurgerEl = useRef<HTMLDivElement>(null);
  const lottieRef = useLottieAnimation({
    containerRef: menuBurgerEl,
    animationData: burgerMenuData,
  });

  useEffect(() => {
    const lottieInstance = lottieRef.current;
    if (!lottieInstance) return;
    if (!isOpen) {
      lottieInstance.setSpeed(CLOSE_ANIMATION.speedMultiplier);
      lottieInstance.setDirection(CLOSE_ANIMATION.direction);
      lottieInstance.play();
    }
  }, [isOpen, lottieRef]);

  const handleBurgerMenuClick = () => {
    const lottieInstance = lottieRef.current;
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

  return (
    <Container
      $isOpen={isOpen}
      ref={menuBurgerEl}
      onClick={handleBurgerMenuClick}
    />
  );
};

export default BurgerMenu;
