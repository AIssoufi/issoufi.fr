import '@testing-library/jest-dom/vitest';
import type { RenderOptions } from '@testing-library/react';
import type { ReactNode } from 'react';
import { vi } from 'vitest';
import './i18n/index';

// jsdom ignores the inert attribute: like a browser, refuse the focus to an element inside an
// inert subtree, so that keyboard tests see the focus stay out of it. The specs that run in the
// node environment (`@vitest-environment node`) have no DOM to patch.
const hasDom = typeof HTMLElement !== 'undefined';
if (hasDom) {
  const nativeFocus = HTMLElement.prototype.focus;
  HTMLElement.prototype.focus = function focus(this: HTMLElement, options?: FocusOptions) {
    if (this.closest('[inert]')) return;
    nativeFocus.call(this, options);
  };

  // jsdom has no canvas and logs "Not implemented" for each context asked: like a browser
  // without canvas support, give none, as the ParticleField of the home page expects. Its specs
  // replace it with a fake 2D context to check the drawing.
  HTMLCanvasElement.prototype.getContext = () => null;
}

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

// Every render is in the theme and the global styles of the app, so that the styles hold the
// values of the tokens instead of their names (`padding-left: page`). The wrapper a spec passes,
// such as a router, goes inside the theme.
vi.mock('@testing-library/react', async importOriginal => {
  const testingLibrary = await importOriginal<typeof import('@testing-library/react')>();
  const { withTheme } = await import('./testUtils');
  const render = (ui: ReactNode, options?: RenderOptions) =>
    testingLibrary.render(ui, { ...options, wrapper: withTheme(options?.wrapper) });

  return { ...testingLibrary, render };
});
