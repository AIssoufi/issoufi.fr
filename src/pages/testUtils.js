import { existsSync, statSync } from 'node:fs';
import { join, sep } from 'node:path';

/** Folder whose files are served at the root of the site. */
const PUBLIC_DIR = 'public';

/**
 * CSS selector of the interactive content of the HTML specification, plus the elements made
 * focusable or editable by an attribute. Used by the page tests to check that no link holds one,
 * since interactive content inside a link is invalid HTML.
 */
export const INTERACTIVE_SELECTOR = [
  'a[href]',
  'audio[controls]',
  'button',
  'details',
  'embed',
  'iframe',
  'img[usemap]',
  'input:not([type="hidden"])',
  'label',
  'select',
  'textarea',
  'video[controls]',
  '[tabindex]',
  '[contenteditable]:not([contenteditable="false"])',
].join(', ');

/** Hidden from screen readers, with its whole content. */
const ARIA_HIDDEN_SELECTOR = '[aria-hidden="true"]';

/** One or more white space characters, line breaks included. */
const WHITE_SPACE_PATTERN = /\s+/g;

/**
 * Text that screen readers read in an element: its text without the parts hidden from them with
 * `aria-hidden="true"`, each run of white space collapsed into one space, and trimmed. The text
 * hidden from the screen only, such as a `VisuallyHidden` word, is kept. jsdom computes no
 * accessibility tree, and ignores the media queries that hide a part on some screens.
 *
 * @param {unknown} element - Element to read.
 * @returns {string} `''` when it is not an element, or when it is hidden from screen readers.
 *
 * @example
 * // <span>août 2021</span> <span aria-hidden="true">↓</span><span>à</span> <span>Aujourd’hui</span>
 * getReadText(period); // 'août 2021 à Aujourd’hui'
 */
export const getReadText = element => {
  const isElement = element instanceof Element;
  if (!isElement) return '';

  const isHiddenFromScreenReaders = element.closest(ARIA_HIDDEN_SELECTOR) !== null;
  if (isHiddenFromScreenReaders) return '';

  const copy = element.cloneNode(true);
  copy.querySelectorAll(ARIA_HIDDEN_SELECTOR).forEach(hiddenPart => hiddenPart.remove());
  return copy.textContent.replace(WHITE_SPACE_PATTERN, ' ').trim();
};

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
