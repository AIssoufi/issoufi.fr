import { renderHook } from '@testing-library/react';

import { THUMBNAIL_SIZES } from '../../constants';
import type { ProjectItemData } from '../../types';
import { usePreloadThumbnails } from './usePreloadThumbnails';

/** Attributes that the hook gives an image, which a stub records in place of downloading it. */
interface RecordedImage {
  decoding?: string;
  sizes?: string;
  srcset?: string;
}

/** Makes `new Image()` record the images that the hook creates, in the order of creation. */
const stubImages = () => {
  const images: RecordedImage[] = [];
  vi.stubGlobal(
    'Image',
    class {
      constructor() {
        images.push(this);
      }
    },
  );
  return images;
};

/** Project `id`, with its screenshot at two widths. */
const projectOf = (id: number) =>
  ({
    id,
    thumbnails: [
      { url: `/${id}-480.webp`, width: 480, height: 300 },
      { url: `/${id}-960.webp`, width: 960, height: 600 },
    ],
  }) as ProjectItemData;

/** `srcset` of the thumbnail of the project `id`. */
const srcSetOf = (id: number) => `/${id}-480.webp 480w, /${id}-960.webp 960w`;

describe('usePreloadThumbnails', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('downloads each thumbnail with the sizes of its card, so the browser picks its file', () => {
    const images = stubImages();
    const { result } = renderHook(() => usePreloadThumbnails());

    result.current([projectOf(1), projectOf(2)]);

    expect(images).toEqual([
      { decoding: 'async', sizes: THUMBNAIL_SIZES, srcset: srcSetOf(1) },
      { decoding: 'async', sizes: THUMBNAIL_SIZES, srcset: srcSetOf(2) },
    ]);
  });

  it('downloads a thumbnail once, however often it is asked for', () => {
    const images = stubImages();
    const { result } = renderHook(() => usePreloadThumbnails());

    result.current([projectOf(1), projectOf(1)]);
    result.current([projectOf(1), projectOf(2)]);

    expect(images.map(({ srcset }) => srcset)).toEqual([srcSetOf(1), srcSetOf(2)]);
  });

  it('keeps the thumbnails already downloaded across renders, with the same function', () => {
    const images = stubImages();
    const { result, rerender } = renderHook(() => usePreloadThumbnails());
    const preloadThumbnails = result.current;

    preloadThumbnails([projectOf(1)]);
    rerender();
    result.current([projectOf(1)]);

    expect(result.current).toBe(preloadThumbnails);
    expect(images).toHaveLength(1);
  });

  it('downloads the thumbnails again for another section, which has its own list', () => {
    const images = stubImages();
    const first = renderHook(() => usePreloadThumbnails());
    const second = renderHook(() => usePreloadThumbnails());

    first.result.current([projectOf(1)]);
    second.result.current([projectOf(1)]);

    expect(images).toHaveLength(2);
  });

  it.each([
    ['without thumbnails', { id: 1 }],
    ['with no valid file', { id: 1, thumbnails: [{ url: '', width: 480, height: 300 }] }],
    ['that is null', null],
    ['that is not an object', 'chess'],
  ])('downloads nothing for a project %s', (_case, project) => {
    const images = stubImages();
    const { result } = renderHook(() => usePreloadThumbnails());

    result.current([project as ProjectItemData, projectOf(2)]);

    expect(images.map(({ srcset }) => srcset)).toEqual([srcSetOf(2)]);
  });

  it.each([undefined, null, 'chess', 42, {}])('downloads nothing for %j, not a list', projects => {
    const images = stubImages();
    const { result } = renderHook(() => usePreloadThumbnails());

    result.current(projects as unknown as ProjectItemData[]);

    expect(images).toEqual([]);
  });

  it('downloads nothing for an empty list', () => {
    const images = stubImages();
    const { result } = renderHook(() => usePreloadThumbnails());

    result.current([]);

    expect(images).toEqual([]);
  });
});
