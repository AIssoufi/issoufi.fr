/** A page of the app rendered to HTML at build time (`src/prerender.tsx`). */
export interface PrerenderedPage {
  /** Markup of the app, which goes inside its container ({@link APP_CONTAINER_ID}). */
  html: string;
  /** `<style>` elements of the rules of styled-components that the markup uses, for the head. */
  styleTags: string;
}

/** Renders the app at the path of a page, such as `/en/projects` (`src/prerender.tsx`). */
export type PrerenderPage = (path: string) => Promise<PrerenderedPage>;

/** `id` of the element of `index.html` that holds the app. */
export const APP_CONTAINER_ID = 'welcome';

/**
 * Attribute of the container of the app ({@link APP_CONTAINER_ID}) that names the path at which
 * the build rendered the page that it holds, such as `/en/projects`. The browser hydrates that
 * page only at that path (see {@link canHydrate}). A not found page has none: its message names
 * the path that the visitor typed, which the build cannot know.
 */
export const PRERENDERED_PATH_ATTRIBUTE = 'data-prerendered-path';

/**
 * Tags that React writes before the markup of a page, outside of any element: the links that
 * preload its images, which it hoists to the head of a whole document.
 */
const LEADING_LINK_TAGS_PATTERN = /^(?:<link\b[^>]*>)+/;

/**
 * Removes the links that React writes before the markup of a page, which preload its images: the
 * page names its images itself, which the browser finds as soon as it reads the HTML, and a
 * preload of an image would delay the scripts and the fonts of the text.
 *
 * @param html - Markup of a page, as React renders it.
 * @returns The markup without those links, and an empty string when it is not a string.
 *
 * @example
 * removeLeadingLinks('<link rel="preload" as="image" href="/a.webp"/><main>…</main>');
 * // '<main>…</main>'
 */
export const removeLeadingLinks = (html: unknown): string =>
  typeof html === 'string' ? html.replace(LEADING_LINK_TAGS_PATTERN, '') : '';

/** Parameters of {@link canHydrate}. */
interface CanHydrateParams {
  /** Container of the app, {@link APP_CONTAINER_ID}, or `null` when the document has none. */
  container?: Element | null;
  /** Path of the current URL, such as `location.pathname`, once the language is resolved. */
  pathname?: string;
}

/**
 * Tells whether the browser can hydrate the page that the build wrote in the container of the
 * app, rather than render the app again: only when the build rendered it at the current path
 * ({@link PRERENDERED_PATH_ATTRIBUTE}), so the app renders the same elements. Otherwise the page
 * would not match: the root URL that took the visitor to the language that they chose before, a
 * not found page, a page of the standalone build, or the dev server, which writes no page.
 *
 * @returns `true` when the container holds a page rendered at `pathname`, `false` otherwise and
 * when the container or the path is missing.
 *
 * @example
 * // <div id="welcome" data-prerendered-path="/en/projects">…</div>
 * canHydrate({ container, pathname: '/en/projects' }); // true
 * canHydrate({ container, pathname: '/en/' }); // false
 */
export const canHydrate = ({ container, pathname }: CanHydrateParams = {}): boolean => {
  const prerenderedPath = container?.getAttribute(PRERENDERED_PATH_ATTRIBUTE);
  const hasPrerenderedPage = typeof prerenderedPath === 'string' && container?.hasChildNodes();
  return hasPrerenderedPage === true && prerenderedPath === pathname;
};
