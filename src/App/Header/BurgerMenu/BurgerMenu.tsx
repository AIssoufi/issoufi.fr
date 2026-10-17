import Lottie, { type AnimationItem } from 'lottie-web';
import { useEffect, useRef } from 'react';

import burgerMenuData from './burger-menu.json';
import { Container } from './BurgerMenu.styled';

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
 * on open and backward on close; the animation is created on mount and destroyed on unmount.
 * The parent owns the open state and passes it back through `isOpen`.
 */
const BurgerMenu = ({ isOpen = false, onOpen, onClose }: BurgerMenuProps) => {
  const menuBurgerEl = useRef<HTMLDivElement>(null);
  const lottieRef = useRef<AnimationItem | null>(null);

  useEffect(() => {
    const container = menuBurgerEl.current;
    if (!container) return;

    const lottieInstance = Lottie.loadAnimation({
      container,
      renderer: 'svg',
      loop: false,
      autoplay: false,
      animationData: burgerMenuData,
    });

    lottieRef.current = lottieInstance;

    return () => {
      lottieInstance?.destroy?.();
    };
  }, []);

  useEffect(() => {
    const lottieInstance = lottieRef.current;
    if (!lottieInstance) return;
    if (!isOpen) {
      lottieInstance.setSpeed(4);
      lottieInstance.setDirection(-1);
      lottieInstance.play();
    }
  }, [isOpen]);

  const handleBurgerMenuClick = () => {
    const lottieInstance = lottieRef.current;
    if (isOpen) {
      onClose?.();
      lottieInstance?.setSpeed(4);
      lottieInstance?.setDirection(-1);
    } else {
      onOpen?.();
      lottieInstance?.setSpeed(1.5);
      lottieInstance?.setDirection(1);
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
