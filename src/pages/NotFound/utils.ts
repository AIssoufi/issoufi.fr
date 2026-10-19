import type { TFunction } from 'i18next';

import {
  ELLIPSIS,
  INVISIBLE_CHARACTER_PATTERN,
  MAX_DISPLAYED_PATH_LENGTH_CHARS,
  PATH_PLACEHOLDER,
} from './constants.ts';

/**
 * Decodes the percent-encoded characters of a path, such as the spaces and accents of a link shared
 * by mail, so that the not found page names it as the visitor reads it. Like `decodeURI`, it keeps
 * the escapes of the characters that structure a URL, such as `%2F` (`/`) and `%3F` (`?`).
 *
 * @param path - Path to decode, such as the `pathname` of the current location.
 * @returns The decoded path, the path as given when it holds a malformed escape such as
 * `%E0%A4%A`, and an empty string when it is not a string.
 *
 * @example
 * decodePath('/un%20lien%20partag%C3%A9'); // '/un lien partagé'
 * decodePath('/a%2Fb'); // '/a%2Fb'
 * decodePath('/100%'); // '/100%', malformed
 */
export const decodePath = (path?: string | null): string => {
  if (typeof path !== 'string') return '';

  try {
    return decodeURI(path);
  } catch {
    // A malformed escape cannot be decoded: show the path as it is in the URL
    return path;
  }
};

/**
 * Percent-encodes the control and format characters of a text
 * ({@link INVISIBLE_CHARACTER_PATTERN}), such as a zero width space or a right-to-left override, so
 * that they show as escapes instead of hiding or reordering the rest of the text. The joiner inside
 * an emoji sequence is encoded too.
 *
 * @param text - Text to encode, such as a decoded path.
 * @returns The text with each of these characters replaced by its UTF-8 escapes (`%E2%80%8B`), and
 * an empty string when it is not a string.
 *
 * @example
 * encodeInvisibleCharacters('/a\u200Bb'); // '/a%E2%80%8Bb'
 */
export const encodeInvisibleCharacters = (text?: string | null): string => {
  if (typeof text !== 'string') return '';

  return text.replace(INVISIBLE_CHARACTER_PATTERN, character => encodeURIComponent(character));
};

/** Parameters of {@link truncateText}. */
interface TruncateTextParams {
  /** Text to cut. Any value that is not a string counts as an empty text. */
  text?: string | null;
  /**
   * Largest number of characters of the result, the ellipsis included, counted in code points, so
   * an emoji is never cut in half. A decimal is rounded down; a negative or non-finite value sets
   * no limit.
   */
  maxLength?: number;
}

/**
 * Cuts a text longer than a number of characters, and ends it with {@link ELLIPSIS}.
 *
 * @returns The text as given when it fits, otherwise its start followed by the ellipsis, in
 * `maxLength` characters; an empty string for a `maxLength` from 0 to below 1, or for a text that
 * is not a string.
 *
 * @example
 * truncateText({ text: '/projets/2024', maxLength: 8 }); // '/projet…'
 * truncateText({ text: '/projets', maxLength: 8 }); // '/projets'
 */
export const truncateText = ({ text, maxLength }: TruncateTextParams = {}): string => {
  if (typeof text !== 'string') return '';

  const hasLimit = typeof maxLength === 'number' && Number.isFinite(maxLength) && maxLength >= 0;
  if (!hasLimit) return text;

  const limit = Math.floor(maxLength);
  const characters = Array.from(text);
  if (characters.length <= limit) return text;
  if (limit < 1) return '';

  return `${characters.slice(0, limit - 1).join('')}${ELLIPSIS}`;
};

/**
 * Turns the path of the current location into the text that the not found page names: decoded
 * ({@link decodePath}), with its control and format characters left encoded
 * ({@link encodeInvisibleCharacters}), and cut to {@link MAX_DISPLAYED_PATH_LENGTH_CHARS}. The cut
 * counts the escapes as they show, and may fall inside one, which then shows in part.
 *
 * @param path - Path of the current location, as the URL encodes it.
 * @returns The path to show, and an empty string when it is not a string.
 *
 * @example
 * getDisplayedPath('/un%20lien%E2%80%AE'); // '/un lien%E2%80%AE'
 */
export const getDisplayedPath = (path?: string | null): string =>
  truncateText({
    text: encodeInvisibleCharacters(decodePath(path)),
    maxLength: MAX_DISPLAYED_PATH_LENGTH_CHARS,
  });

/** Parameters of {@link replacePlaceholder}. */
interface ReplacePlaceholderParams {
  /** Text holding the placeholder. Any value that is not a string counts as an empty text. */
  text?: string | null;
  /** Placeholder to replace. An empty one, or a value that is not a string, replaces nothing. */
  placeholder?: string | null;
  /**
   * Text to put in place of each placeholder, as it is. Any value that is not a string counts as
   * an empty text.
   */
  value?: string | null;
}

/**
 * Replaces each placeholder of a text with a value, taken as it is: unlike `replaceAll` with a
 * text, it reads no pattern such as `$&` or `$'` in the value.
 *
 * @returns The text with every placeholder replaced, the text as given when it holds none or the
 * placeholder is empty, and an empty string when the text is not a string.
 *
 * @example
 * replacePlaceholder({ text: 'La page # n’existe pas.', placeholder: '#', value: '/$&' });
 * // 'La page /$& n’existe pas.'
 */
export const replacePlaceholder = ({
  text,
  placeholder,
  value,
}: ReplacePlaceholderParams = {}): string => {
  if (typeof text !== 'string') return '';

  const hasPlaceholder = typeof placeholder === 'string' && placeholder !== '';
  if (!hasPlaceholder) return text;

  const replacement = typeof value === 'string' ? value : '';
  return text.split(placeholder).join(replacement);
};

/** Parameters of {@link getNotFoundMessage}. */
interface GetNotFoundMessageParams {
  /** Translation function of the language to show. */
  t: TFunction;
  /** Path of the current location, as the URL encodes it. */
  path?: string | null;
}

/**
 * Translates the message of the not found page, `errors.notFound.message`, naming the path as
 * {@link getDisplayedPath} shows it. i18next only interpolates {@link PATH_PLACEHOLDER}, which the
 * path then replaces: the path, which anyone can type in a URL, never goes through i18next, which
 * would read a `$t(` in it as the start of a nested translation.
 *
 * @returns The translated message, in the language of `t`, with the path in place of its
 * `{{path}}`.
 *
 * @example
 * getNotFoundMessage({ t, path: '/$t(skills' }); // 'La page /$t(skills n’existe pas.'
 */
export const getNotFoundMessage = ({ t, path }: GetNotFoundMessageParams): string =>
  replacePlaceholder({
    text: t('errors.notFound.message', { path: PATH_PLACEHOLDER }),
    placeholder: PATH_PLACEHOLDER,
    value: getDisplayedPath(path),
  });
