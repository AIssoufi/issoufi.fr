import { VERSION_PREFIX } from './constants';

/**
 * Lists the ancestors of an element inside the page body, from its parent up to `<body>`
 * included.
 *
 * @param element - Element whose ancestors are listed.
 * @returns An empty list for `<body>` itself, and for an element outside the body or detached
 * from the document.
 */
export function getAncestorsInBody(element: Element): Element[] {
  const { body } = element.ownerDocument;
  const isInsideBody = element !== body && Boolean(body?.contains(element));
  if (!isInsideBody) return [];

  const ancestors: Element[] = [];
  for (let parent = element.parentElement; parent; parent = parent.parentElement) {
    ancestors.push(parent);
    if (parent === body) break;
  }
  return ancestors;
}

/**
 * Lists every element of the page around a container: the other children of its parent, then of
 * each ancestor up to `<body>`. Together they hold the whole page but the container, so making
 * them inert leaves only the container reachable.
 *
 * @example
 * // <body><header><a/><div id="menu"/></header><main/></body>
 * getElementsOutside(menu); // [a, main]
 *
 * @param container - Element left out, with everything inside it.
 * @returns An empty list when the container is not inside the page body (see
 * {@link getAncestorsInBody}).
 */
export function getElementsOutside(container: Element): Element[] {
  return getAncestorsInBody(container).flatMap(ancestor =>
    [...ancestor.children].filter(child => !child.contains(container)),
  );
}

/**
 * Removes the leading `v` of a version written as a tag, as in `v1.0.0` or `V1.0.0`, so the
 * formatted version never gets two.
 */
const removeVersionPrefix = (version: string): string => {
  const isWrittenAsTag = version.toLowerCase().startsWith(VERSION_PREFIX);
  return isWrittenAsTag ? version.slice(VERSION_PREFIX.length) : version;
};

/**
 * Formats the version of the site as the header shows it after the logo: the version number after
 * a `v`.
 *
 * @param version - Version as `package.json` writes it, e.g. `1.0.0`. One that already starts
 * with a `v` keeps a single one.
 * @returns `v<version>`, trimmed, or an empty string when the version is missing, empty or not a
 * string, so the header never shows `undefined` or `v` alone.
 *
 * @example
 * formatVersion('1.0.0'); // 'v1.0.0'
 * formatVersion('v2.3.4'); // 'v2.3.4'
 * formatVersion(''); // ''
 */
export const formatVersion = (version?: string): string => {
  const text = typeof version === 'string' ? version.trim() : '';
  const versionNumber = removeVersionPrefix(text).trim();
  return versionNumber ? `${VERSION_PREFIX}${versionNumber}` : '';
};
