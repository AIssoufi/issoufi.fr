import { decodePath } from './utils';

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
