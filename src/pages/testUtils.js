import { existsSync, statSync } from 'node:fs';
import { join, sep } from 'node:path';

/** Folder whose files are served at the root of the site. */
const PUBLIC_DIR = 'public';

/**
 * Whether an absolute URL such as `/chess.webp` names a file of `public/`, not a folder. Used by
 * the page tests to check that every image they reference is served.
 *
 * @param {unknown} url - URL of the image, as written in the code or the data.
 * @returns {boolean} `false` for a relative URL, a missing file, a folder, a path leaving
 * `public/` or a value that is not a string.
 */
export const isPublicFile = url => {
  const isAbsoluteUrl = typeof url === 'string' && url.startsWith('/');
  if (!isAbsoluteUrl) return false;

  const path = join(PUBLIC_DIR, url);
  // join() resolves `..`, which could leave public/
  const isInsidePublicDir = path.startsWith(`${PUBLIC_DIR}${sep}`);
  return isInsidePublicDir && existsSync(path) && statSync(path).isFile();
};

/**
 * Every style rule of the document, with the condition of the media query holding it, if any.
 *
 * @returns {{ media: string, rule: CSSRule }[]} `media` is `''` for a rule outside any media query.
 */
export const listStyleRules = () =>
  [...document.styleSheets].flatMap(sheet =>
    [...sheet.cssRules].flatMap(rule =>
      rule instanceof CSSMediaRule
        ? [...rule.cssRules].map(innerRule => ({ media: rule.media.mediaText, rule: innerRule }))
        : [{ media: '', rule }],
    ),
  );

/**
 * Value that the generated CSS declares for a property on one of the element's classes, outside
 * any media query or inside the given one; the last declaration wins. Used by the page tests,
 * since jsdom's computed styles ignore media queries.
 *
 * @param {object} params
 * @param {Element} [params.element] - Element whose classes hold the declaration.
 * @param {string} [params.property] - CSS property, such as `padding-left`.
 * @param {string} [params.media] - Condition of the media query, such as `(min-width: 50em)`;
 * `''` for the rules outside any media query.
 * @returns {string} `''` when no rule declares it, or when the element is missing.
 *
 * @example
 * declaredStyle({ element: grid, property: 'display', media: '(min-width: 50em)' }); // 'grid'
 */
export const declaredStyle = ({ element, property, media = '' } = {}) => {
  const hasClasses = element?.classList instanceof DOMTokenList;
  if (!hasClasses || typeof property !== 'string') return '';

  const classSelectors = [...element.classList].map(className => `.${className}`);
  const isRuleOfElement = entry => {
    const isInMedia = entry.media === media;
    return isInMedia && classSelectors.includes(entry.rule.selectorText);
  };
  const values = listStyleRules()
    .filter(isRuleOfElement)
    .map(({ rule }) => rule.style.getPropertyValue(property));
  return values.findLast(Boolean) ?? '';
};
