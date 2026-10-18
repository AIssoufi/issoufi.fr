import { checkFontsLoaded } from './browser.mjs';

/** A page of Playwright that runs the callback in jsdom rather than in Chromium. */
const createPage = () => ({
  evaluate: async (callback, fonts) => callback(fonts),
});

/** Gives jsdom, which has no fonts, a `document.fonts` whose `load` gives the faces of a font. */
const mockFonts = load => {
  Object.defineProperty(document, 'fonts', { value: { load }, configurable: true });
};

describe('checkFontsLoaded', () => {
  afterEach(() => {
    delete document.fonts;
  });

  it('resolves when every font has a loaded face', async () => {
    mockFonts(async () => [{ status: 'loaded' }]);

    await expect(
      checkFontsLoaded({ page: createPage(), fonts: ['400 16px "Montserrat"'] }),
    ).resolves.toBeUndefined();
  });

  it('resolves when the page uses no font', async () => {
    mockFonts(async () => []);

    await expect(checkFontsLoaded({ page: createPage(), fonts: [] })).resolves.toBeUndefined();
  });

  it('names the fonts that have no loaded face', async () => {
    mockFonts(async font =>
      font.startsWith('700') ? [{ status: 'error' }] : [{ status: 'loaded' }],
    );

    await expect(
      checkFontsLoaded({
        page: createPage(),
        fonts: ['400 16px "Montserrat"', '700 16px "Montserrat"'],
      }),
    ).rejects.toThrow('Fonts not loaded, check the network: 700 16px "Montserrat"');
  });

  it('counts a font whose download fails as not loaded', async () => {
    mockFonts(() => Promise.reject(new Error('network down')));

    await expect(
      checkFontsLoaded({ page: createPage(), fonts: ['400 16px "Montserrat"'] }),
    ).rejects.toThrow('400 16px "Montserrat"');
  });

  it('counts a font that matches no face as not loaded', async () => {
    mockFonts(async () => []);

    await expect(
      checkFontsLoaded({ page: createPage(), fonts: ['400 16px "Unknown"'] }),
    ).rejects.toThrow('400 16px "Unknown"');
  });
});
