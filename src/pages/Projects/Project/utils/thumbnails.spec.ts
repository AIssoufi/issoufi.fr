import { getThumbnailSources } from './thumbnails.ts';

describe('getThumbnailSources', () => {
  const NARROW = { url: '/chess-480.webp', width: 480, height: 300 };
  const MEDIUM = { url: '/chess-720.webp', width: 720, height: 450 };
  const WIDE = { url: '/chess-960.webp', width: 960, height: 600 };

  it('names every file with its width, from the narrowest, and gives the widest as the src', () => {
    expect(getThumbnailSources([NARROW, MEDIUM, WIDE])).toEqual({
      src: '/chess-960.webp',
      srcSet: '/chess-480.webp 480w, /chess-720.webp 720w, /chess-960.webp 960w',
      width: 960,
      height: 600,
    });
  });

  it('orders the files by width, whatever their order in the data', () => {
    expect(getThumbnailSources([WIDE, NARROW, MEDIUM])?.srcSet).toBe(
      '/chess-480.webp 480w, /chess-720.webp 720w, /chess-960.webp 960w',
    );
  });

  it('takes a single file', () => {
    expect(getThumbnailSources([NARROW])).toEqual({
      src: '/chess-480.webp',
      srcSet: '/chess-480.webp 480w',
      width: 480,
      height: 300,
    });
  });

  it('keeps the first file of a width that a srcset cannot hold twice', () => {
    const copy = { url: '/copy-480.webp', width: 480, height: 300 };

    expect(getThumbnailSources([NARROW, copy, WIDE])?.srcSet).toBe(
      '/chess-480.webp 480w, /chess-960.webp 960w',
    );
  });

  it.each([
    ['without a url', { width: 960, height: 600 }],
    ['with an empty url', { url: '', width: 960, height: 600 }],
    ['with a blank url', { url: '  ', width: 960, height: 600 }],
    ['with a url holding a space', { url: '/chess 960.webp', width: 960, height: 600 }],
    ['with a url that is not a string', { url: 960, width: 960, height: 600 }],
    ['without a width', { url: '/chess-960.webp', height: 600 }],
    ['with a width of zero', { url: '/chess-960.webp', width: 0, height: 600 }],
    ['with a negative width', { url: '/chess-960.webp', width: -960, height: 600 }],
    ['with a fractional width', { url: '/chess-960.webp', width: 960.5, height: 600 }],
    ['with a width written as text', { url: '/chess-960.webp', width: '960', height: 600 }],
    ['with an infinite width', { url: '/chess-960.webp', width: Infinity, height: 600 }],
    ['with a width that is not a number', { url: '/chess-960.webp', width: NaN, height: 600 }],
    ['without a height', { url: '/chess-960.webp', width: 960 }],
    ['with a height of zero', { url: '/chess-960.webp', width: 960, height: 0 }],
    ['that is null', null],
    ['that is a text', '/chess-960.webp'],
    ['that is a list', ['/chess-960.webp', 960, 600]],
  ])('leaves out a file %s', (_case, file) => {
    expect(getThumbnailSources([NARROW, file])).toEqual(getThumbnailSources([NARROW]));
  });

  it.each([undefined, null, [], [null], '/chess-960.webp', 42, {}, { 0: WIDE, length: 1 }])(
    'gives no sources for %j, which holds no valid file',
    files => {
      expect(getThumbnailSources(files)).toBeUndefined();
    },
  );
});
