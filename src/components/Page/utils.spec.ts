import { NO_BACKGROUND_IMAGE } from './constants';
import { getBackgroundImages, toBackgroundImage } from './utils';

describe('toBackgroundImage', () => {
  it('writes the URL of the image in a CSS string', () => {
    expect(toBackgroundImage('/home.webp')).toBe('url("/home.webp")');
  });

  it('keeps a URL with spaces and parentheses whole', () => {
    expect(toBackgroundImage('/CV (2026) - Adam.pdf')).toBe('url("/CV (2026) - Adam.pdf")');
  });

  it('escapes the quotes and backslashes that would end the CSS string', () => {
    expect(toBackgroundImage('/a"b\\c.webp')).toBe('url("/a\\"b\\\\c.webp")');
  });

  it('escapes the line breaks inside the URL, which would also end the CSS string', () => {
    expect(toBackgroundImage('/a\nb\r\fc.webp')).toBe('url("/a\\a b\\d \\c c.webp")');
  });

  it('trims the spaces around the URL', () => {
    expect(toBackgroundImage('  /home.webp\n')).toBe('url("/home.webp")');
  });

  it.each([undefined, null, '', '   ', 42, {}, ['/home.webp']])('shows no image for %j', url => {
    expect(toBackgroundImage(url)).toBe(NO_BACKGROUND_IMAGE);
  });
});

describe('getBackgroundImages', () => {
  const placeholderUrl = 'data:image/webp;base64,UklGRg==';

  it('shows each version of the photo over its placeholder', () => {
    expect(
      getBackgroundImages({
        url: '/home.webp',
        portraitUrl: '/home-portrait.webp',
        placeholderUrl,
      }),
    ).toEqual({
      image: `url("/home.webp"), url("${placeholderUrl}")`,
      portraitImage: `url("/home-portrait.webp"), url("${placeholderUrl}")`,
    });
  });

  it('shows the placeholder alone when the photo has no other URL', () => {
    expect(getBackgroundImages({ placeholderUrl })).toEqual({
      image: `url("${placeholderUrl}")`,
      portraitImage: `url("${placeholderUrl}")`,
    });
  });

  it.each(['', '  ', 42, null])('leaves out a placeholder of %j', placeholder => {
    expect(
      getBackgroundImages({ url: '/home.webp', placeholderUrl: placeholder as never }),
    ).toEqual({ image: 'url("/home.webp")', portraitImage: 'url("/home.webp")' });
  });

  it('shows the whole photo, and its portrait version on narrow portrait screens', () => {
    expect(getBackgroundImages({ url: '/home.webp', portraitUrl: '/home-portrait.webp' })).toEqual({
      image: 'url("/home.webp")',
      portraitImage: 'url("/home-portrait.webp")',
    });
  });

  it('shows the whole photo on every screen when it has no portrait version', () => {
    expect(getBackgroundImages({ url: '/home.webp' })).toEqual({
      image: 'url("/home.webp")',
      portraitImage: 'url("/home.webp")',
    });
  });

  it('shows the portrait version on every screen when the photo has no other URL', () => {
    expect(getBackgroundImages({ url: ' ', portraitUrl: '/home-portrait.webp' })).toEqual({
      image: 'url("/home-portrait.webp")',
      portraitImage: 'url("/home-portrait.webp")',
    });
  });

  it.each([
    ['no photo', undefined],
    ['a null photo', null],
    ['a photo without URLs', {}],
    ['blank URLs', { url: '', portraitUrl: '  ' }],
    ['URLs that are not strings', { url: 42, portraitUrl: {} }],
    ['a photo that is a string', '/home.webp'],
  ])('shows no image for %s', (_, photo) => {
    expect(getBackgroundImages(photo as never)).toEqual({
      image: NO_BACKGROUND_IMAGE,
      portraitImage: NO_BACKGROUND_IMAGE,
    });
  });
});
