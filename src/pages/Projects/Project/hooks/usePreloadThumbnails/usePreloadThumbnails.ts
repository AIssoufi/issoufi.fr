import { useCallback, useRef } from 'react';

import { THUMBNAIL_SIZES } from '../../constants.ts';
import type { ProjectItemData } from '../../types.ts';
import { getThumbnailSources } from '../../utils/thumbnails.ts';

/**
 * Downloads the thumbnails of projects before their cards show them, as those of the page that an
 * arrow is about to show: each is an `Image` with the `srcset` and the `sizes` of its card, so the
 * browser picks the same file, and the card takes it from the cache instead of showing empty.
 * Each thumbnail is requested once per section, whatever the number of calls.
 *
 * @returns A stable function that starts the downloads of the given projects and returns at once.
 * It ignores a value that is not a list, and the projects without a valid thumbnail file.
 *
 * @example
 * const preloadThumbnails = usePreloadThumbnails();
 * // <button onPointerEnter={() => preloadThumbnails(nextPageProjects)}>…</button>
 */
export function usePreloadThumbnails(): (projects?: readonly ProjectItemData[]) => void {
  // The images by their srcset: kept so that the garbage collector cannot stop a download, and so
  // that each thumbnail is requested once
  const images = useRef(new Map<string, HTMLImageElement>());

  return useCallback((projects?: readonly ProjectItemData[]) => {
    if (!Array.isArray(projects)) return;

    projects.forEach(project => {
      const sources = getThumbnailSources(project?.thumbnails);
      if (!sources) return;
      if (images.current.has(sources.srcSet)) return;

      const image = new Image();
      image.decoding = 'async';
      // The sizes before the srcset, so that the browser picks the file for the width of the card
      image.sizes = THUMBNAIL_SIZES;
      image.srcset = sources.srcSet;
      images.current.set(sources.srcSet, image);
    });
  }, []);
}
