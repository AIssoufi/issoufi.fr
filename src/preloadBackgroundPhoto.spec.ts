import { stubMatchMedia } from './mediaQueryTestUtils.ts';
import { PORTRAIT_PHOTO_MEDIA_QUERY } from './utils/pages.ts';

/** Links of the head that preload an image. */
const getImagePreloads = () => [
  ...document.head.querySelectorAll<HTMLLinkElement>('link[rel="preload"][as="image"]'),
];

/** Imports the module again, so that its first preload runs as when the app starts. */
const importModule = async () => {
  vi.resetModules();
  return import('./preloadBackgroundPhoto.ts');
};

describe('preloadBackgroundPhoto', () => {
  afterEach(() => {
    getImagePreloads().forEach(link => link.remove());
    vi.unstubAllGlobals();
    window.history.replaceState(null, '', '/');
  });

  it('preloads the photo of the page at the current URL as soon as the module runs', async () => {
    window.history.replaceState(null, '', '/projects');
    await importModule();

    expect(getImagePreloads().map(link => link.getAttribute('href'))).toEqual(['/projects.webp']);
  });

  it('preloads the portrait version on a narrow portrait screen', async () => {
    const { matchMedia } = stubMatchMedia({ matches: true });
    window.history.replaceState(null, '', '/en/experiences');
    await importModule();

    expect(matchMedia).toHaveBeenCalledWith(PORTRAIT_PHOTO_MEDIA_QUERY);
    expect(getImagePreloads().map(link => link.getAttribute('href'))).toEqual([
      '/experiences-portrait.webp',
    ]);
  });

  it('preloads the whole photo on the other screens', async () => {
    stubMatchMedia({ matches: false });
    window.history.replaceState(null, '', '/');
    await importModule();

    expect(getImagePreloads().map(link => link.getAttribute('href'))).toEqual(['/home.webp']);
  });

  it('returns the link that it adds to the head', async () => {
    const { preloadBackgroundPhoto } = await importModule();
    getImagePreloads().forEach(link => link.remove());

    const link = preloadBackgroundPhoto();

    expect(link?.parentElement).toBe(document.head);
    expect(getImagePreloads()).toEqual([link]);
  });

  describe('in a page that the build rendered', () => {
    /** Adds to the head the link that preloads an image, as the build writes it. */
    const addBuildPreload = (href: string) => {
      const link = document.createElement('link');
      link.setAttribute('rel', 'preload');
      link.setAttribute('as', 'image');
      link.setAttribute('href', href);
      link.setAttribute('fetchpriority', 'low');
      document.head.append(link);
      return link;
    };

    it('adds nothing where the head already preloads the photo of the screen', async () => {
      window.history.replaceState(null, '', '/en/projects');
      const buildPreload = addBuildPreload('/projects.webp');
      const { preloadBackgroundPhoto } = await importModule();

      expect(preloadBackgroundPhoto()).toBeNull();
      expect(getImagePreloads()).toEqual([buildPreload]);
    });

    it('preloads the photo of the screen where the head preloads another file', async () => {
      window.history.replaceState(null, '', '/projects');
      addBuildPreload('/projects-portrait.webp');
      await importModule();

      expect(getImagePreloads().map(link => link.getAttribute('href'))).toEqual([
        '/projects-portrait.webp',
        '/projects.webp',
      ]);
    });
  });

  describe('edge cases', () => {
    it.each(['/skills', '/en/does-not-exist', '/Users/adam/site/index.html'])(
      'preloads nothing at %s, the path of no page',
      async path => {
        window.history.replaceState(null, '', path);
        const { preloadBackgroundPhoto } = await importModule();

        expect(preloadBackgroundPhoto()).toBeNull();
        expect(getImagePreloads()).toEqual([]);
      },
    );
  });
});
