import i18n from '../../i18n';
import { en } from '../../i18n/en';
import { fr } from '../../i18n/fr';
import { ELLIPSIS, MAX_DISPLAYED_PATH_LENGTH_CHARS, PATH_PLACEHOLDER } from './constants';
import {
  decodePath,
  encodeInvisibleCharacters,
  getDisplayedPath,
  getNotFoundMessage,
  replacePlaceholder,
  truncateText,
} from './utils';

/** Texts that `String.prototype.replace` reads as patterns in a replacement text. */
const REPLACEMENT_PATTERNS = ['$&', "$'", '$`', '$$', '$1', '$<name>'];

describe('decodePath', () => {
  it.each([
    ['/projets/2024/un%20lien%20partag%C3%A9', '/projets/2024/un lien partagé'],
    ['/en/tr%C3%A8s%20long', '/en/très long'],
    ['/caf%C3%A9%E2%98%95', '/café☕'],
    ['/100%25', '/100%'],
  ])('decodes the escapes of %s', (path, decodedPath) => {
    expect(decodePath(path)).toBe(decodedPath);
  });

  it.each(['/', '/skills', '/en/skills', '/un lien partagé', ''])(
    'leaves %j as it is when it holds no escape',
    path => {
      expect(decodePath(path)).toBe(path);
    },
  );

  it.each(['/a%2Fb', '/a%3Fb', '/a%23b', '/a%26b'])(
    'keeps the escape of a character that structures a URL in %s',
    path => {
      expect(decodePath(path)).toBe(path);
    },
  );

  it.each(['/projets/%E0%A4%A', '/100%', '/a%zz', '/%C3', '/%FF%FE'])(
    'returns the malformed path %s as it is, without throwing',
    path => {
      expect(decodePath(path)).toBe(path);
    },
  );

  it.each([undefined, null, 404, {}, ['/skills']])('returns an empty string for %j', path => {
    expect(decodePath(path as unknown as string)).toBe('');
  });
});

describe('encodeInvisibleCharacters', () => {
  it.each([
    ['/a\u202Etxt.exe', '/a%E2%80%AEtxt.exe'],
    ['/a\u200Bb', '/a%E2%80%8Bb'],
    ['/a\u200Db', '/a%E2%80%8Db'],
    ['/a\u00ADb', '/a%C2%ADb'],
    ['/a\tb\nc', '/a%09b%0Ac'],
    ['/a\u0000b\u007Fc', '/a%00b%7Fc'],
    ['/\u{E0041}', '/%F3%A0%81%81'],
  ])('encodes the control and format characters of %j', (text, encodedText) => {
    expect(encodeInvisibleCharacters(text)).toBe(encodedText);
  });

  it.each(['/un lien partagé', '/café☕', '/日本語', '/a%20b', ''])(
    'leaves %j as it is when it holds none',
    text => {
      expect(encodeInvisibleCharacters(text)).toBe(text);
    },
  );

  it('encodes every one of them, not only the first', () => {
    expect(encodeInvisibleCharacters('\u202E\u202E')).toBe('%E2%80%AE%E2%80%AE');
  });

  it.each([undefined, null, 404, {}])('returns an empty string for %j', text => {
    expect(encodeInvisibleCharacters(text as unknown as string)).toBe('');
  });
});

describe('truncateText', () => {
  it('leaves a text that fits as it is, up to the exact limit', () => {
    expect(truncateText({ text: '/projets', maxLength: 9 })).toBe('/projets');
    expect(truncateText({ text: '/projets', maxLength: 8 })).toBe('/projets');
  });

  it('cuts a text one character too long and ends it with an ellipsis, within the limit', () => {
    expect(truncateText({ text: '/projets', maxLength: 7 })).toBe(`/proje${ELLIPSIS}`);
    expect(Array.from(truncateText({ text: 'a'.repeat(500), maxLength: 100 }))).toHaveLength(100);
  });

  it('counts an emoji as one character and never cuts it in half', () => {
    expect(truncateText({ text: '☕😀😀', maxLength: 3 })).toBe('☕😀😀');
    expect(truncateText({ text: '☕😀😀a', maxLength: 3 })).toBe(`☕😀${ELLIPSIS}`);
  });

  it.each([
    [1, ELLIPSIS],
    [1.9, ELLIPSIS],
    [0, ''],
    [0.5, ''],
  ])('keeps at most %j character', (maxLength, truncatedText) => {
    expect(truncateText({ text: '/projets', maxLength })).toBe(truncatedText);
  });

  it.each([undefined, -1, Number.NaN, Number.POSITIVE_INFINITY, '8'])(
    'sets no limit for a maxLength of %j',
    maxLength => {
      expect(truncateText({ text: '/projets', maxLength: maxLength as number })).toBe('/projets');
    },
  );

  it.each([undefined, null, 404])('returns an empty string for a text of %j', text => {
    expect(truncateText({ text: text as unknown as string, maxLength: 8 })).toBe('');
  });

  it('returns an empty string without parameters', () => {
    expect(truncateText()).toBe('');
  });
});

describe('getDisplayedPath', () => {
  it('decodes the path', () => {
    expect(getDisplayedPath('/projets/un%20lien%20partag%C3%A9')).toBe('/projets/un lien partagé');
  });

  it('leaves its invisible characters encoded, whether written encoded or not', () => {
    expect(getDisplayedPath('/a%E2%80%AEtxt.exe')).toBe('/a%E2%80%AEtxt.exe');
    expect(getDisplayedPath('/a%E2%80%8Bb')).toBe('/a%E2%80%8Bb');
    expect(getDisplayedPath('/a\u200Bb')).toBe('/a%E2%80%8Bb');
  });

  it('shows a malformed path as it is', () => {
    expect(getDisplayedPath('/projets/%E0%A4%A')).toBe('/projets/%E0%A4%A');
  });

  it(`cuts a path longer than ${MAX_DISPLAYED_PATH_LENGTH_CHARS} characters`, () => {
    const fittingPath = `/${'a'.repeat(MAX_DISPLAYED_PATH_LENGTH_CHARS - 1)}`;
    const longPath = `${fittingPath}b`;

    expect(getDisplayedPath(fittingPath)).toBe(fittingPath);
    expect(getDisplayedPath(longPath)).toBe(`${fittingPath.slice(0, -1)}${ELLIPSIS}`);
  });

  it('counts the length once decoded, not as the URL encodes it', () => {
    const encodedPath = `/${'%C3%A9'.repeat(MAX_DISPLAYED_PATH_LENGTH_CHARS - 1)}`;
    expect(getDisplayedPath(encodedPath)).toBe(
      `/${'é'.repeat(MAX_DISPLAYED_PATH_LENGTH_CHARS - 1)}`,
    );
    expect(getDisplayedPath(`${encodedPath}%C3%A9`)).toBe(
      `/${'é'.repeat(MAX_DISPLAYED_PATH_LENGTH_CHARS - 2)}${ELLIPSIS}`,
    );
  });

  it('counts an invisible character as its escapes, which the cut may split', () => {
    const start = `/${'a'.repeat(MAX_DISPLAYED_PATH_LENGTH_CHARS - 5)}`;
    expect(getDisplayedPath(`${start}%E2%80%8B`)).toBe(`${start}%E2${ELLIPSIS}`);
  });

  it.each([undefined, null, 404])('returns an empty string for %j', path => {
    expect(getDisplayedPath(path as unknown as string)).toBe('');
  });
});

describe('replacePlaceholder', () => {
  it.each([
    ['La page # n’existe pas.', 'La page /skills n’existe pas.'],
    ['#', '/skills'],
    ['# puis #', '/skills puis /skills'],
    ['#début', '/skillsdébut'],
    ['fin#', 'fin/skills'],
  ])('replaces each placeholder of %j', (text, expected) => {
    expect(replacePlaceholder({ text, placeholder: '#', value: '/skills' })).toBe(expected);
  });

  it('leaves a text without the placeholder as it is', () => {
    expect(replacePlaceholder({ text: 'Introuvable.', placeholder: '#', value: '/skills' })).toBe(
      'Introuvable.',
    );
  });

  it.each(REPLACEMENT_PATTERNS)('puts the value %s as it is, without reading a pattern', value => {
    expect(replacePlaceholder({ text: 'La page # n’existe pas.', placeholder: '#', value })).toBe(
      `La page ${value} n’existe pas.`,
    );
  });

  it('replaces no placeholder that the value brings', () => {
    expect(replacePlaceholder({ text: 'a#b', placeholder: '#', value: '##' })).toBe('a##b');
  });

  it.each([undefined, null, 404])('removes the placeholder for the value %j', value => {
    expect(
      replacePlaceholder({ text: 'a#b', placeholder: '#', value: value as unknown as string }),
    ).toBe('ab');
  });

  it.each(['', undefined, null, 404])(
    'leaves the text as it is for the placeholder %j',
    placeholder => {
      expect(
        replacePlaceholder({
          text: 'a#b',
          placeholder: placeholder as unknown as string,
          value: '/skills',
        }),
      ).toBe('a#b');
    },
  );

  it.each([undefined, null, 404, {}])('returns an empty string for the text %j', text => {
    expect(
      replacePlaceholder({ text: text as unknown as string, placeholder: '#', value: '/skills' }),
    ).toBe('');
  });

  it('returns an empty string without any parameter', () => {
    expect(replacePlaceholder()).toBe('');
  });
});

describe('getNotFoundMessage', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each([
    ['fr', 'La page /skills n’existe pas.'],
    ['en', 'The page /skills does not exist.'],
  ])('names the path in %s', (language, message) => {
    expect(getNotFoundMessage({ t: i18n.getFixedT(language), path: '/skills' })).toBe(message);
  });

  it('names the path as the page shows it', () => {
    expect(
      getNotFoundMessage({ t: i18n.getFixedT('fr'), path: '/un%20lien%E2%80%8B%20partag%C3%A9' }),
    ).toBe('La page /un lien%E2%80%8B partagé n’existe pas.');
  });

  it.each([
    ['fr', fr],
    ['en', en],
  ])('uses a placeholder that no %s translation holds', (_language, translations) => {
    expect(JSON.stringify(translations)).not.toContain(PATH_PLACEHOLDER);
  });

  it('gives i18next the placeholder, never the path', () => {
    const translate = vi.spyOn(i18n, 't');

    const message = getNotFoundMessage({ t: i18n.getFixedT('fr'), path: '/$t(skills' });

    expect(message).toBe('La page /$t(skills n’existe pas.');
    expect(translate).toHaveBeenCalledWith(
      'errors.notFound.message',
      expect.objectContaining({ path: PATH_PLACEHOLDER }),
    );
    expect(JSON.stringify(translate.mock.calls)).not.toContain('skills');
  });

  // On an unclosed `$t(`, the nesting of i18next 25.3.3 to 26.4.3 took seconds for a dozen
  // characters, then twice as long for each more: this test would then outlast its timeout
  it.each(['/$t(', `/$t(${'a'.repeat(16)}`, '/$t(errors.backHome)', '/{{path}}', '/$t(a, {"x": 1'])(
    'names the path %s as it is, at once',
    path => {
      expect(getNotFoundMessage({ t: i18n.getFixedT('fr'), path })).toBe(
        `La page ${path} n’existe pas.`,
      );
    },
  );

  it.each(REPLACEMENT_PATTERNS)('names the path /%s as it is', pattern => {
    expect(getNotFoundMessage({ t: i18n.getFixedT('fr'), path: `/${pattern}` })).toBe(
      `La page /${pattern} n’existe pas.`,
    );
  });

  it.each([undefined, null, 404])('names an empty path for %j', path => {
    expect(getNotFoundMessage({ t: i18n.getFixedT('fr'), path: path as unknown as string })).toBe(
      'La page  n’existe pas.',
    );
  });

  it('shows a message without the path when its translation leaves the path out', async () => {
    const instance = i18n.createInstance();
    await instance.init({
      resources: { fr: { translation: { errors: { notFound: { message: 'Introuvable.' } } } } },
      lng: 'fr',
    });

    expect(getNotFoundMessage({ t: instance.t, path: '/skills' })).toBe('Introuvable.');
  });
});
