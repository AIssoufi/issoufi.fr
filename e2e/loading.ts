/**
 * Waits until the page has loaded what it shows: its eager images, wherever they stand, its lazy
 * images on the screen, the background images of its elements and their pseudo-elements, such as
 * the background photo of the page, then its web fonts. An image whose file fails to load counts
 * as loaded. Unlike the `networkidle` state of Playwright, it waits for no request that a test does
 * not measure, nor for a lazy image out of the screen, which never loads. Runs in the browser,
 * passed to `page.evaluate`, so it uses nothing from outside its own body.
 *
 * @example
 * await expect(page.locator(PAGE_SELECTOR)).toBeVisible();
 * await page.evaluate(waitForPageContent);
 */
export const waitForPageContent = async (): Promise<void> => {
  // Defined here rather than at the top of the module, which the page does not receive
  const PSEUDO_ELEMENTS = [null, '::before', '::after'];
  const URL_PATTERN = /url\(["']?([^"')]+)["']?\)/g;
  const DATA_URL_PREFIX = 'data:';
  // A pseudo-element without content, or not displayed, is not drawn
  const NO_CONTENT_VALUES = ['none', 'normal'];
  const HIDDEN_DISPLAY = 'none';
  const LAZY_LOADING = 'lazy';

  /** Tells whether an image waits to be near the screen before it loads. */
  const isLazy = (image: HTMLImageElement) => image.getAttribute('loading') === LAZY_LOADING;

  /** Tells whether the page draws an element, which only then downloads its background image. */
  const isDrawn = (element: Element) => element.getClientRects().length > 0;

  /** Resolves once an image has loaded its file or failed to. */
  const waitForImage = (image: HTMLImageElement) =>
    new Promise<void>(resolve => {
      if (image.complete) {
        resolve();
        return;
      }
      image.addEventListener('load', () => resolve(), { once: true });
      image.addEventListener('error', () => resolve(), { once: true });
    });

  /** Lists the images that intersect the screen, which the browser loads even when lazy. */
  const listImagesOnScreen = (images: HTMLImageElement[]) =>
    new Promise<HTMLImageElement[]>(resolve => {
      if (images.length === 0) {
        resolve([]);
        return;
      }
      const isOnScreen = new Map<Element, boolean>();
      // Its first callbacks give the state of every image observed, then it stops
      const observer = new IntersectionObserver(entries => {
        entries.forEach(({ target, isIntersecting }) => isOnScreen.set(target, isIntersecting));
        const hasEveryImageReported = isOnScreen.size === images.length;
        if (!hasEveryImageReported) return;
        observer.disconnect();
        resolve(images.filter(image => isOnScreen.get(image)));
      });
      images.forEach(image => observer.observe(image));
    });

  /** Tells whether a URL names a file to download, which a `data:` URL holds itself. */
  const isDownloadedUrl = (url: string) => url !== '' && !url.startsWith(DATA_URL_PREFIX);

  /** Lists the URLs of the files that an element and its pseudo-elements show as backgrounds. */
  const listBackgroundUrls = (element: Element) =>
    PSEUDO_ELEMENTS.flatMap(pseudoElement => {
      const style = getComputedStyle(element, pseudoElement);
      const hasContent = !NO_CONTENT_VALUES.includes(style.content);
      const isDrawn = pseudoElement === null || (hasContent && style.display !== HIDDEN_DISPLAY);
      if (!isDrawn) return [];
      return [...style.backgroundImage.matchAll(URL_PATTERN)]
        .map(([, url = '']) => url)
        .filter(isDownloadedUrl)
        .map(url => new URL(url, document.baseURI).href);
    });

  /**
   * Resolves once a background image has loaded its file or failed to. It loads the URL as an
   * image, which the browser takes from its memory cache, or from the request of the style still
   * running, rather than read the resource timing entries, which Chromium leaves out for some
   * backgrounds.
   */
  const waitForBackgroundImage = (url: string) => {
    const image = new Image();
    image.src = url;
    return waitForImage(image);
  };

  const images = [...document.images];
  const lazyImages = images.filter(isLazy);
  const eagerImages = images.filter(image => !isLazy(image));
  const lazyImagesOnScreen = await listImagesOnScreen(lazyImages);
  const drawnElements = [...document.querySelectorAll('*')].filter(isDrawn);
  const backgroundUrls = new Set(drawnElements.flatMap(listBackgroundUrls));

  await Promise.all([
    ...[...eagerImages, ...lazyImagesOnScreen].map(waitForImage),
    ...[...backgroundUrls].map(waitForBackgroundImage),
  ]);
  // The page is laid out by now, so it has requested every web font that its text needs
  await document.fonts.ready;
};
