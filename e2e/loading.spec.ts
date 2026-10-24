import { waitForPageContent } from './loading.ts';

/** Style that the stubbed `getComputedStyle` gives an element or one of its pseudo-elements. */
interface StubStyle {
  /** Value of `background-image`. */
  backgroundImage?: string;
  /** Value of `content`, `none` when the pseudo-element has none. */
  content?: string;
  /** Value of `display`. */
  display?: string;
}

/** Styles of each element, by pseudo-element, `''` for the element itself. */
const styles = new Map<Element, Partial<Record<string, StubStyle>>>();
/** Elements that the stubbed layout draws, which have a box. */
const drawnElements = new Set<Element>();
/** Images that the stubbed `IntersectionObserver` sees on the screen. */
const imagesOnScreen = new Set<Element>();
/** URLs of the files that the browser has downloaded, which an image loads at once. */
const downloadedUrls = new Set<string>();
/** Images that the helper created with `new Image()`, to load the backgrounds. */
const createdImages: HTMLImageElement[] = [];
/** Resolves the `document.fonts.ready` of the current test. */
let resolveFonts: () => void = () => {};

/**
 * `IntersectionObserver` of jsdom, which has none: it tells each image observed whether it is on
 * the screen, in a callback of its own, as a browser may split the first callbacks.
 */
class StubIntersectionObserver {
  private readonly callback: IntersectionObserverCallback;

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
  }

  observe(target: Element) {
    queueMicrotask(() =>
      this.callback(
        [{ target, isIntersecting: imagesOnScreen.has(target) } as IntersectionObserverEntry],
        this as unknown as IntersectionObserver,
      ),
    );
  }

  disconnect() {}
}

/** `Image` of jsdom, which loads no file: its image is complete once its URL has downloaded. */
class StubImage {
  constructor() {
    const image = document.createElement('img');
    Object.defineProperty(image, 'complete', { get: () => downloadedUrls.has(image.src) });
    createdImages.push(image);
    return image;
  }
}

beforeEach(() => {
  vi.stubGlobal('IntersectionObserver', StubIntersectionObserver);
  vi.stubGlobal('Image', StubImage);
  vi.spyOn(window, 'getComputedStyle').mockImplementation(
    (element, pseudoElement) =>
      ({
        backgroundImage: 'none',
        content: pseudoElement ? 'none' : 'normal',
        display: 'block',
        ...styles.get(element)?.[pseudoElement ?? ''],
      }) as CSSStyleDeclaration,
  );
  vi.spyOn(Element.prototype, 'getClientRects').mockImplementation(function (this: Element) {
    return { length: drawnElements.has(this) ? 1 : 0 } as DOMRectList;
  });
  const fontsReady = new Promise<void>(resolve => {
    resolveFonts = resolve;
  });
  Object.defineProperty(document, 'fonts', { value: { ready: fontsReady }, configurable: true });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  Reflect.deleteProperty(document, 'fonts');
  document.body.replaceChildren();
  [styles, drawnElements, imagesOnScreen, downloadedUrls].forEach(set => set.clear());
  createdImages.length = 0;
});

/** Parameters of {@link addImage}. */
interface AddImageParams {
  /** Value of the `loading` attribute, none when undefined. */
  loading?: string;
  /** Whether the image has loaded its file, or failed to. */
  isComplete?: boolean;
  /** Whether the image shows on the screen. */
  isOnScreen?: boolean;
}

/** Adds an image to the page. */
const addImage = ({ loading, isComplete = false, isOnScreen = false }: AddImageParams = {}) => {
  const image = document.createElement('img');
  if (loading !== undefined) image.setAttribute('loading', loading);
  Object.defineProperty(image, 'complete', { value: isComplete });
  if (isOnScreen) imagesOnScreen.add(image);
  document.body.append(image);
  return image;
};

/** Parameters of {@link addElement}. */
interface AddElementParams {
  /** Styles of the element, by pseudo-element, `''` for the element itself. */
  style?: Partial<Record<string, StubStyle>>;
  /**
   * Whether the page draws the element.
   * @default true
   */
  isDrawn?: boolean;
}

/** Adds a `div` to the page, with the styles given. */
const addElement = ({ style = {}, isDrawn = true }: AddElementParams = {}) => {
  const element = document.createElement('div');
  styles.set(element, style);
  if (isDrawn) drawnElements.add(element);
  document.body.append(element);
  return element;
};

/** Starts the helper, and tells whether it has resolved yet. */
const startWaiting = () => {
  const state = { isDone: false };
  const waiting = waitForPageContent().then(() => {
    state.isDone = true;
  });
  return { state, waiting };
};

/** Lets the pending promises and callbacks of the helper run. */
const settle = () => new Promise(resolve => setTimeout(resolve));

/** Downloads a file, which loads the images that the helper created for its URL. */
const download = (url: string) => {
  downloadedUrls.add(url);
  createdImages
    .filter(image => image.src === url)
    .forEach(image => image.dispatchEvent(new Event('load')));
};

describe('waitForPageContent', () => {
  it('resolves on a page without any image nor background, once its fonts are ready', async () => {
    const { state, waiting } = startWaiting();
    await settle();
    expect(state.isDone).toBe(false);

    resolveFonts();
    await waiting;
    expect(state.isDone).toBe(true);
  });

  it.each([
    { kind: 'eager', loading: 'eager' },
    { kind: 'without a loading attribute', loading: undefined },
  ])('waits until an image $kind loads, even out of the screen', async ({ loading }) => {
    const image = addImage({ loading });
    resolveFonts();

    const { state, waiting } = startWaiting();
    await settle();
    expect(state.isDone).toBe(false);

    image.dispatchEvent(new Event('load'));
    await waiting;
    expect(state.isDone).toBe(true);
  });

  it('counts an image whose file fails to load as loaded', async () => {
    const image = addImage();
    resolveFonts();

    const { waiting } = startWaiting();
    await settle();
    image.dispatchEvent(new Event('error'));

    await expect(waiting).resolves.toBeUndefined();
  });

  it('waits for no image that has already loaded', async () => {
    addImage({ isComplete: true });
    addImage({ loading: 'lazy', isComplete: true, isOnScreen: true });
    resolveFonts();

    await expect(waitForPageContent()).resolves.toBeUndefined();
  });

  it('waits until a lazy image on the screen loads', async () => {
    const image = addImage({ loading: 'lazy', isOnScreen: true });
    resolveFonts();

    const { state, waiting } = startWaiting();
    await settle();
    expect(state.isDone).toBe(false);

    image.dispatchEvent(new Event('load'));
    await waiting;
    expect(state.isDone).toBe(true);
  });

  it('waits for no lazy image out of the screen, which the browser does not load', async () => {
    addImage({ loading: 'lazy' });
    addImage({ loading: 'lazy' });
    resolveFonts();

    await expect(waitForPageContent()).resolves.toBeUndefined();
  });

  it('waits for the lazy image on the screen once it knows where every lazy image stands', async () => {
    addImage({ loading: 'lazy' });
    const imageOnScreen = addImage({ loading: 'lazy', isOnScreen: true });
    resolveFonts();

    const { state, waiting } = startWaiting();
    await settle();
    expect(state.isDone).toBe(false);

    imageOnScreen.dispatchEvent(new Event('load'));
    await waiting;
    expect(state.isDone).toBe(true);
  });

  it('waits until the background image of a pseudo-element downloads', async () => {
    addElement({
      style: {
        '::before': { content: '""', backgroundImage: 'url("https://site.test/photo.webp")' },
      },
    });
    resolveFonts();

    const { state, waiting } = startWaiting();
    await settle();
    expect(state.isDone).toBe(false);

    download('https://site.test/photo.webp');
    await waiting;
    expect(state.isDone).toBe(true);
  });

  it('waits for every file of a background with several images', async () => {
    addElement({
      style: {
        '': { backgroundImage: 'url("https://site.test/a.webp"), url(https://site.test/b.webp)' },
      },
    });
    resolveFonts();
    downloadedUrls.add('https://site.test/a.webp');

    const { state, waiting } = startWaiting();
    await settle();
    expect(state.isDone).toBe(false);

    download('https://site.test/b.webp');
    await waiting;
    expect(state.isDone).toBe(true);
  });

  it('counts a background whose file fails to load as loaded', async () => {
    addElement({ style: { '': { backgroundImage: 'url("https://site.test/missing.webp")' } } });
    resolveFonts();

    const { waiting } = startWaiting();
    await settle();
    createdImages.forEach(image => image.dispatchEvent(new Event('error')));

    await expect(waiting).resolves.toBeUndefined();
  });

  it('reads a relative URL of a background against the address of the page', async () => {
    addElement({ style: { '::after': { content: '"›"', backgroundImage: "url('/photo.webp')" } } });
    resolveFonts();
    downloadedUrls.add(new URL('/photo.webp', document.baseURI).href);

    await expect(waitForPageContent()).resolves.toBeUndefined();
  });

  it.each([
    {
      kind: 'a data: URL, which downloads nothing',
      style: { '': { backgroundImage: 'url("data:image/webp;base64,UklGRg==")' } },
    },
    { kind: 'a gradient', style: { '': { backgroundImage: 'linear-gradient(red, blue)' } } },
    { kind: 'an empty URL', style: { '': { backgroundImage: 'url("")' } } },
    {
      kind: 'a pseudo-element without content',
      style: { '::before': { content: 'none', backgroundImage: 'url("/photo.webp")' } },
    },
    {
      kind: 'a pseudo-element whose content is normal',
      style: { '::before': { content: 'normal', backgroundImage: 'url("/photo.webp")' } },
    },
    {
      kind: 'a pseudo-element not displayed',
      style: {
        '::before': { content: '""', display: 'none', backgroundImage: 'url("/photo.webp")' },
      },
    },
  ])('waits for no background of $kind', async ({ style }) => {
    addElement({ style });
    resolveFonts();

    await expect(waitForPageContent()).resolves.toBeUndefined();
  });

  it('waits for no background of an element that the page does not draw', async () => {
    addElement({ style: { '': { backgroundImage: 'url("/photo.webp")' } }, isDrawn: false });
    resolveFonts();

    await expect(waitForPageContent()).resolves.toBeUndefined();
  });

  it('waits for the web fonts once the images have loaded', async () => {
    const image = addImage();

    const { state, waiting } = startWaiting();
    await settle();
    image.dispatchEvent(new Event('load'));
    await settle();
    expect(state.isDone).toBe(false);

    resolveFonts();
    await waiting;
    expect(state.isDone).toBe(true);
  });
});
