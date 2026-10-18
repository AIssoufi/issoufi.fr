import type { AnimationItem } from 'lottie-web';
import { useEffect, useEffectEvent, useRef } from 'react';

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
 * first render, and destroyed on unmount. The icon keeps its size meanwhile, and shows the cross
 * at once when the menu was opened before the animation was drawn.
 * The parent owns the open state and passes it back through `isOpen`.
 */
const BurgerMenu = ({ isOpen = false, onOpen, onClose }: BurgerMenuProps) => {
  const menuBurgerEl = useRef<HTMLDivElement>(null);
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

  return (
    <Container
      $isOpen={isOpen}
      ref={menuBurgerEl}
      onClick={handleBurgerMenuClick}
    />
  );
};

export default BurgerMenu;
