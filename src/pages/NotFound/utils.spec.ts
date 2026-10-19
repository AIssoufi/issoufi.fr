import { ELLIPSIS, MAX_DISPLAYED_PATH_LENGTH_CHARS } from './constants';
import { decodePath, encodeInvisibleCharacters, getDisplayedPath, truncateText } from './utils';

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
