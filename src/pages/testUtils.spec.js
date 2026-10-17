import { isPublicFile } from './testUtils';

describe('isPublicFile', () => {
  it('takes an absolute URL naming a file of public/', () => {
    expect(isPublicFile('/robots.txt')).toBe(true);
  });

  it('does not take a missing file or a folder', () => {
    expect(isPublicFile('/missing-screenshot.webp')).toBe(false);
    expect(isPublicFile('')).toBe(false);
    expect(isPublicFile('/')).toBe(false);
  });

  it('only takes absolute URLs that stay inside public/', () => {
    expect(isPublicFile('robots.txt')).toBe(false);
    expect(isPublicFile('/../package.json')).toBe(false);
    expect(isPublicFile(undefined)).toBe(false);
    expect(isPublicFile(null)).toBe(false);
    expect(isPublicFile(42)).toBe(false);
  });
});
