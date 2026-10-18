import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';
import './i18n/index';

// jsdom ignores the inert attribute: like a browser, refuse the focus to an element inside an
// inert subtree, so that keyboard tests see the focus stay out of it
const nativeFocus = HTMLElement.prototype.focus;
HTMLElement.prototype.focus = function focus(this: HTMLElement, options?: FocusOptions) {
  if (this.closest('[inert]')) return;
  nativeFocus.call(this, options);
};

// jsdom cannot draw the animation: the BurgerMenu icon loads this build of lottie-web
vi.mock('lottie-web/build/player/lottie_light', () => ({
  default: {
    loadAnimation: () => ({
      play: vi.fn(),
      destroy: vi.fn(),
      setSpeed: vi.fn(),
      setDirection: vi.fn(),
      goToAndStop: vi.fn(),
      totalFrames: 60,
    }),
  },
}));
