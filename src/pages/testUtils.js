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
