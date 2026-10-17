import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';
import './i18n/index';

// jsdom cannot draw the animation: the BurgerMenu icon loads this build of lottie-web
vi.mock('lottie-web/build/player/lottie_light', () => ({
  default: {
    loadAnimation: () => ({
      play: vi.fn(),
      destroy: vi.fn(),
      setSpeed: vi.fn(),
      setDirection: vi.fn(),
    }),
  },
}));
