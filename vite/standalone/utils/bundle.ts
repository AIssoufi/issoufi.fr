import type { Rolldown } from 'vite';

import {
  ESCAPED_INLINE_SCRIPT_BREAKER,
  HTML_FILE_PATTERN,
  INLINE_SCRIPT_BREAKER_PATTERN,
  NO_PRELOAD,
  PRELOAD_MARKER_PATTERN,
  SERVER_ONLY_FILE_NAMES,
  STANDALONE_PAGE_FILE_NAME,
  WEB_MANIFEST_FILE_PATTERN,
} from '../constants.ts';
import { escapeRegExp } from '../../utils/strings.ts';
import { isFileName } from './strings.ts';

/**
 * Tells whether a file of the build is one that only a web server needs: every HTML page but
 * `index.html`, such as `projects.html` or `404.html`, the web app manifests, such as
 * `en/manifest.webmanifest`, and the files of {@link SERVER_ONLY_FILE_NAMES} at its root, such as
 * the `_headers` of Cloudflare Pages or `robots.txt`. Opened from the disk, the standalone build
 * shows every route from `index.html`, no browser installs it as an app, no server reads its
 * headers or its redirects, and no search engine crawls it.
 *
 * @param fileName - Path of the file in the build, e.g. `projects.html`.
 * @returns `true` for an HTML page other than `index.html`, for a web app manifest and for a file
 * of {@link SERVER_ONLY_FILE_NAMES}, `false` otherwise, and when the name is missing or not a
 * string.
 *
 * @example
 * isServerOnlyFile('404.html'); // true
 * isServerOnlyFile('manifest.webmanifest'); // true
 * isServerOnlyFile('_headers'); // true
 * isServerOnlyFile('robots.txt'); // true
 * isServerOnlyFile('index.html'); // false
 */
export const isServerOnlyFile = (fileName?: unknown): boolean => {
  const isName = typeof fileName === 'string';
  const isHtmlFile = isName && HTML_FILE_PATTERN.test(fileName);
  const isStandalonePage = fileName === STANDALONE_PAGE_FILE_NAME;
  const isServerOnlyPage = isHtmlFile && !isStandalonePage;
  const isWebManifest = isName && WEB_MANIFEST_FILE_PATTERN.test(fileName);
  const isServerOnlyName = isName && SERVER_ONLY_FILE_NAMES.includes(fileName);
  return isServerOnlyPage || isWebManifest || isServerOnlyName;
};

/**
 * Tells whether a file of the build is an entry chunk, the script that the page loads, as opposed
 * to an asset or a chunk that another script imports.
 *
 * @param file - File of the bundle, as Rolldown passes it to `generateBundle`.
 * @returns `true` for a chunk marked as an entry, `false` otherwise, and when the file is missing
 * or not an object.
 *
 * @example
 * isEntryChunk({ type: 'chunk', isEntry: true, fileName: 'assets/index-1a2b.js' }); // true
 * isEntryChunk({ type: 'asset', fileName: 'index.html' }); // false
 */
export const isEntryChunk = (file?: unknown): file is Rolldown.OutputChunk => {
  const isObject = typeof file === 'object' && file !== null;
  if (!isObject) return false;

  const { type, isEntry } = file as Partial<Rolldown.OutputChunk>;
  return type === 'chunk' && isEntry === true;
};

/**
 * Replaces the preload markers that Vite leaves in a chunk whose dynamic imports are inlined
 * (`codeSplitting: false`) with "no file to preload". Vite writes `__VITE_PRELOAD__` in place of
 * the files to preload with each dynamic import, and fills it in when it renders the chunk; once
 * the imports are inlined, it finds none of them and leaves the marker, a variable that does not
 * exist when the code runs, so loading a lazy page would throw.
 *
 * @param code - Code of the chunk. Missing or not a string, it counts as empty.
 * @returns The code with `void 0` in place of each marker, or unchanged when it has none.
 *
 * @example
 * removePreloadMarkers('preload(() => page, __VITE_PRELOAD__, import.meta.url)');
 * // 'preload(() => page, void 0, import.meta.url)'
 */
export const removePreloadMarkers = (code?: unknown): string =>
  typeof code === 'string' ? code.replace(PRELOAD_MARKER_PATTERN, NO_PRELOAD) : '';

/** Parameters of {@link inlineScript}. */
interface InlineScriptParams {
  /** HTML of the page. Missing or not a string, it counts as empty. */
  html?: string;
  /**
   * Path of the script in the build, e.g. `assets/index-1a2b.js`: the page loads it with a `src`
   * that ends with it, such as `./assets/index-1a2b.js`.
   */
  fileName?: string;
  /** Code of the script. Missing or not a string, it counts as empty. */
  code?: string;
}

/**
 * Puts the code of a script inside the tag of the page that loads it from a file, so the page
 * runs it without loading anything: browsers refuse to load module scripts from `file://`. The
 * tag keeps its other attributes (`type="module"`…) and loses its `src`. Every `</script` and
 * `<!--` written in the code becomes `\x3C/script` and `\x3C!--`, which mean the same in a
 * JavaScript string, so the code cannot end the tag early.
 *
 * @returns The HTML with the code inlined, or unchanged when no tag loads that file, or when the
 * file name is missing or blank.
 *
 * @example
 * inlineScript({
 *   html: '<script type="module" src="./assets/index.js"></script>',
 *   fileName: 'assets/index.js',
 *   code: 'console.log("</script>")',
 * });
 * // '<script type="module">console.log("\x3C/script>")</script>'
 */
export const inlineScript = ({ html, fileName, code }: InlineScriptParams = {}): string => {
  const page = typeof html === 'string' ? html : '';
  if (!isFileName(fileName)) return page;

  const script = typeof code === 'string' ? code : '';
  const safeScript = script.replace(INLINE_SCRIPT_BREAKER_PATTERN, ESCAPED_INLINE_SCRIPT_BREAKER);
  const tagPattern = new RegExp(
    `<script([^>]*?)\\ssrc="(?:[^"]*/)?${escapeRegExp(fileName)}"([^>]*)></script>`,
  );
  // A function, so that a `$` of the code is not read as a replacement pattern
  return page.replace(
    tagPattern,
    (_tag, before: string, after: string) => `<script${before}${after}>${safeScript}</script>`,
  );
};
