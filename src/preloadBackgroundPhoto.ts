import { getBackgroundPhotoUrl, PORTRAIT_PHOTO_MEDIA_QUERY } from './utils/pages.ts';

/**
 * Tells whether the screen shows the portrait version of the background photos, the screens of
 * `PORTRAIT_PHOTO_MEDIA_QUERY`: `false` in a browser without `matchMedia`, such as jsdom.
 */
const isPortraitScreen = () =>
  typeof window.matchMedia === 'function' && window.matchMedia(PORTRAIT_PHOTO_MEDIA_QUERY).matches;

/** Tells whether a link of the head of the document already preloads the image at `href`. */
const isImagePreloaded = (href: string) =>
  [...document.head.querySelectorAll('link[rel="preload"][as="image"]')].some(
    link => link.getAttribute('href') === href,
  );

/**
 * Starts downloading the background photo of the page at the current URL, in the version that
 * the screen shows (see `getBackgroundPhotoUrl`), by adding to the head of the document a
 * `<link rel="preload" as="image">`, whose download the style of `Page` then reuses. Adds nothing
 * where the head already preloads it, as in a page that the build rendered (see
 * `addPrerenderedPage`), nor at a path of no page of `PAGES`, such as an unknown path.
 *
 * @returns The link it added, or `null` when it added none.
 */
export const preloadBackgroundPhoto = (): HTMLLinkElement | null => {
  const href = getBackgroundPhotoUrl({
    pathname: window.location.pathname,
    isPortraitScreen: isPortraitScreen(),
  });
  if (!href || isImagePreloaded(href)) return null;

  const link = document.createElement('link');
  link.setAttribute('rel', 'preload');
  link.setAttribute('as', 'image');
  link.setAttribute('href', href);
  document.head.append(link);
  return link;
};

// `index.tsx` imports this module before any other, so where the app draws the page itself, as in
// the standalone build, the photo starts downloading as soon as the main script runs, before the
// modules of the app are evaluated and the page is drawn
preloadBackgroundPhoto();
