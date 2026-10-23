import { LARGE_FILE_ADVICE, LARGE_IMAGE_ADVICE } from '../constants.mjs';
import { findLargeFiles, getCompressionAdvice } from './bundle-large-files.mjs';

describe('findLargeFiles', () => {
  it('lists the files over the limit, the biggest first', () => {
    const files = [
      { path: 'small.png', bytes: 100 },
      { path: 'chess.png', bytes: 900 },
      { path: 'photos/study.jpeg', bytes: 600 },
      { path: 'CV - Adam Issoufi.pdf', bytes: 3000 },
    ];
    expect(findLargeFiles({ files, limitBytes: 500 })).toEqual([
      { path: 'CV - Adam Issoufi.pdf', bytes: 3000 },
      { path: 'chess.png', bytes: 900 },
      { path: 'photos/study.jpeg', bytes: 600 },
    ]);
  });

  it('leaves out the scripts and style sheets of the budgets, but not the other assets', () => {
    const files = [
      { path: 'assets/index.js', bytes: 5000 },
      { path: 'assets/index.css', bytes: 5000 },
      { path: 'assets/logo.svg', bytes: 900 },
      { path: 'animation.json', bytes: 800 },
      { path: 'register-sw.js', bytes: 700 },
      { path: 'assets/index.js.map', bytes: 600 },
    ];
    expect(findLargeFiles({ files, limitBytes: 500 })).toEqual([
      { path: 'assets/logo.svg', bytes: 900 },
      { path: 'animation.json', bytes: 800 },
      { path: 'register-sw.js', bytes: 700 },
      { path: 'assets/index.js.map', bytes: 600 },
    ]);
  });

  it('keeps a file exactly at the limit out of the list', () => {
    const files = [
      { path: 'at-limit.pdf', bytes: 500 },
      { path: 'over.pdf', bytes: 501 },
    ];
    expect(findLargeFiles({ files, limitBytes: 500 })).toEqual([{ path: 'over.pdf', bytes: 501 }]);
  });

  it('keeps a file without an extension', () => {
    const files = [{ path: '_redirects', bytes: 900 }];
    expect(findLargeFiles({ files, limitBytes: 500 })).toEqual(files);
  });

  it.each([undefined, null, 'chess.png', {}])('gives an empty list for the files %o', files => {
    expect(findLargeFiles({ files, limitBytes: 500 })).toEqual([]);
  });

  it('ignores entries without a path or with an invalid size', () => {
    const files = [null, { bytes: 900 }, { path: 'a.png', bytes: NaN }, { path: 'b.pdf' }];
    expect(findLargeFiles({ files, limitBytes: 500 })).toEqual([]);
  });

  it.each([0, -1, NaN, Infinity, undefined, null, '500'])(
    'throws for the invalid limit %s',
    limitBytes => {
      const files = [{ path: 'chess.png', bytes: 900 }];
      expect(() => findLargeFiles({ files, limitBytes })).toThrow(RangeError);
    },
  );
});

describe('getCompressionAdvice', () => {
  it.each(['chess.png', 'photos/study.jpeg', 'PHOTO.JPG', 'assets/logo.svg', 'home.webp'])(
    'advises a lighter format for the image %s',
    path => {
      expect(getCompressionAdvice(path)).toBe(LARGE_IMAGE_ADVICE);
    },
  );

  it.each(['CV - Adam Issoufi.pdf', 'animation.json', '_redirects', 'png', 'chess.png.pdf'])(
    'advises compression alone for the file %s',
    path => {
      expect(getCompressionAdvice(path)).toBe(LARGE_FILE_ADVICE);
    },
  );

  it.each([undefined, null, 42, {}, ''])('advises compression alone for the path %o', path => {
    expect(getCompressionAdvice(path)).toBe(LARGE_FILE_ADVICE);
  });
});
