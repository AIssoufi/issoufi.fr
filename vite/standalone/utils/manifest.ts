import { LINK_TAG_PATTERN, MANIFEST_RELATION_PATTERN } from '../constants.ts';

/** Tells whether a link tag links a web app manifest. */
const isManifestLink = (tag: string) => MANIFEST_RELATION_PATTERN.test(tag);

/**
 * Removes the links to a web app manifest from an HTML page, such as the one that
 * `renderPageHtml` adds to `index.html`: no browser installs a page opened from the disk as an
 * app, and the build leaves out the manifests (see `isServerOnlyFile`), so the link would only
 * name a missing file.
 *
 * @param html - HTML of the page. A value that is not a string counts as an empty page.
 * @returns The page without those links and the spaces before them; other links stay.
 *
 * @example
 * removeManifestLinks('<head>\n  <link rel="manifest" href="/manifest.webmanifest" />\n</head>');
 * // '<head>\n</head>'
 */
export const removeManifestLinks = (html?: unknown): string => {
  const page = typeof html === 'string' ? html : '';
  return page.replace(LINK_TAG_PATTERN, tag => (isManifestLink(tag) ? '' : tag));
};
