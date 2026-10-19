import { getMediaType } from './media-types.mjs';

describe('getMediaType', () => {
  it.each([
    ['application/manifest+json', 'application/manifest+json'],
    ['application/manifest+json; charset=utf-8', 'application/manifest+json'],
    [' Text/HTML ;charset=UTF-8', 'text/html'],
    ['text/plain;\n charset=utf-8', 'text/plain'],
  ])('reads %j as %j', (contentType, mediaType) => {
    expect(getMediaType(contentType)).toBe(mediaType);
  });

  it.each([undefined, null, '', 42, {}])('gives an empty media type for %o', contentType => {
    expect(getMediaType(contentType)).toBe('');
  });
});
