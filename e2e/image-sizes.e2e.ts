import { expect, type Page, test } from '@playwright/test';

import experiencesData from '../src/pages/Experiences/.data/experiences.json' with { type: 'json' };
import freelanceProjectsData from '../src/pages/Projects/.data/freelance-projects.json' with { type: 'json' };
import personalProjectsData from '../src/pages/Projects/.data/personal-projects.json' with { type: 'json' };
import { MAX_THUMBNAIL_ASPECT_RATIO } from '../src/pages/Projects/Project/constants.ts';
import {
  HIGH_DENSITY_SCALE,
  LIGHT_IMAGE_SCREEN_WIDTH_PX,
  LOW_RESOLUTION_PROJECT_NAME_KEYS,
  MAX_FILE_TO_SHOWN_WIDTH_RATIO,
  MAX_IMAGE_ENLARGEMENT,
  MAX_THUMBNAIL_SIZES_OFFSET_PX,
  PAGE_SELECTOR,
  PROJECT_CARD_SELECTOR,
  PROJECTS_ROUTE,
  SCREEN_HEIGHT_PX,
  SHARP_IMAGE_SCREEN_WIDTHS_PX,
  SIZES_MAX_FUNCTION,
  THUMBNAIL_FILE_SCREENS,
  THUMBNAIL_SIZES_SCREEN_WIDTHS_PX,
  TIMELINE_ROUTE,
  UNKNOWN_SIZES_FUNCTION,
} from './constants.ts';
import { getImageEnlargement, type ImageSize } from './images.ts';
import { showAllProjects } from './projects.ts';

/** Projects of the Projects page, from both sections. */
const PROJECTS = [...personalProjectsData.projects, ...freelanceProjectsData.projects];

/** Number of thumbnails of the Projects page once every section shows all its projects. */
const THUMBNAIL_COUNT = PROJECTS.length;

/** Paths of the files of the screenshots too small for a 2x screen, until they are replaced. */
const LOW_RESOLUTION_FILE_PATHS = new Set(
  PROJECTS.filter(({ nameKey }) => LOW_RESOLUTION_PROJECT_NAME_KEYS.includes(nameKey)).flatMap(
    ({ thumbnails }) => thumbnails.map(({ url }) => url),
  ),
);

/** Number of logos of the Experiences page: one per job of each company, on its card. */
const LOGO_COUNT = experiencesData.experiences.reduce(
  (count, { roles = [] }) => count + roles.length,
  0,
);

/**
 * Tells whether an `img` has downloaded and decoded its file. Run in the page by `evaluate`, so it
 * uses nothing outside itself.
 */
const isImageLoaded = (img: HTMLImageElement) => img.complete && img.naturalWidth > 0;

/** An image of a page once downloaded, as the browser shows it. */
interface ShownImage {
  /** Path of the file that the browser picked, e.g. `/chess-960.webp`, which names the image. */
  path: string;
  /** Box that the `img` draws the image in, inside its border, in CSS pixels. */
  box: ImageSize;
  /** Width of the `img` on the screen, its border included, in CSS pixels. */
  shownWidth: number;
  /** Size of the file, in its own pixels. */
  file: ImageSize;
}

/** Parameters of {@link measureShownImages}. */
interface MeasureShownImagesParams {
  /** Page of the browser. */
  page: Page;
  /** Number of images that the page shows, every project shown on the Projects page. */
  count: number;
}

/**
 * Brings each image of the page into view, so that a lazy one downloads, waits for its file, and
 * measures it: the size of the file is read from a separate `Image` without `srcset`, since the
 * natural size of an `img` that picked a file from its `srcset` is divided by its density.
 */
const measureShownImages = async ({
  page,
  count,
}: MeasureShownImagesParams): Promise<ShownImage[]> => {
  const images = page.locator(`${PAGE_SELECTOR} img`);
  // The page is rendered from its own chunk, after the first paint
  await expect(images, 'images of the page').toHaveCount(count);
  const shownImages: ShownImage[] = [];
  for (const image of await images.all()) {
    await image.scrollIntoViewIfNeeded();
    await expect.poll(() => image.evaluate(isImageLoaded)).toBe(true);
    shownImages.push(
      await image.evaluate(async (img: HTMLImageElement) => {
        const file = new Image();
        file.src = img.currentSrc;
        await file.decode();
        return {
          path: new URL(img.currentSrc).pathname,
          box: { width: img.clientWidth, height: img.clientHeight },
          shownWidth: img.offsetWidth,
          file: { width: file.naturalWidth, height: file.naturalHeight },
        };
      }),
    );
  }
  return shownImages;
};

/** Parameters of {@link openAndMeasureImages}. */
interface OpenAndMeasureImagesParams extends MeasureShownImagesParams {
  /** Route of the page of the site to open. */
  route: string;
}

/** Opens a page, with every project shown on the Projects page, and measures its images. */
const openAndMeasureImages = async ({ page, route, count }: OpenAndMeasureImagesParams) => {
  await page.goto(route);
  if (route === PROJECTS_ROUTE) await showAllProjects(page);
  return measureShownImages({ page, count });
};

/** Pages whose images are checked, with the number of images that each one shows. */
const IMAGE_PAGES = [
  { name: 'thumbnail of the Projects page', route: PROJECTS_ROUTE, count: THUMBNAIL_COUNT },
  { name: 'logo of the Experiences page', route: TIMELINE_ROUTE, count: LOGO_COUNT },
] as const;

// jsdom downloads no image and lays nothing out: only a real browser tells which file of a
// srcset it picks for a screen, and at what size it draws it
for (const { name, route, count } of IMAGE_PAGES) {
  for (const width of SHARP_IMAGE_SCREEN_WIDTHS_PX) {
    test.describe(`on a ${width} px wide ${HIGH_DENSITY_SCALE}x screen`, () => {
      test.use({
        viewport: { width, height: SCREEN_HEIGHT_PX },
        deviceScaleFactor: HIGH_DENSITY_SCALE,
      });

      test(`no ${name} is enlarged`, async ({ page }) => {
        const images = await openAndMeasureImages({ page, route, count });

        const sharpImages = images.filter(({ path }) => !LOW_RESOLUTION_FILE_PATHS.has(path));
        for (const { path, box, file } of sharpImages) {
          const enlargement = getImageEnlargement({
            box,
            file,
            deviceScaleFactor: HIGH_DENSITY_SCALE,
          });
          expect
            .soft(enlargement, `device pixels per pixel of ${path}`)
            .toBeLessThanOrEqual(MAX_IMAGE_ENLARGEMENT);
        }
      });
    });
  }

  test.describe(`on a ${LIGHT_IMAGE_SCREEN_WIDTH_PX} px wide 1x screen`, () => {
    test.use({
      viewport: { width: LIGHT_IMAGE_SCREEN_WIDTH_PX, height: SCREEN_HEIGHT_PX },
      deviceScaleFactor: 1,
    });

    test(`no ${name} downloads a file much wider than it shows`, async ({ page }) => {
      const images = await openAndMeasureImages({ page, route, count });

      for (const { path, shownWidth, file } of images) {
        expect
          .soft(file.width, `width of ${path}`)
          .toBeLessThanOrEqual(MAX_FILE_TO_SHOWN_WIDTH_RATIO * shownWidth);
      }
    });
  });
}

/** First thumbnail of the Projects page once downloaded, measured with its card. */
interface MeasuredThumbnail {
  /** Width of the file that the browser picked from the `srcset`, in its own pixels. */
  fileWidth: number;
  /** Width that the `sizes` of the `img` gives on this screen, in CSS pixels, a whole number. */
  sizesWidth: number;
  /**
   * Width that the `sizes` of the `img` gives on this screen in a browser that refuses `max()`
   * there, in CSS pixels, a whole number.
   */
  fallbackSizesWidth: number;
  /** Width of the card that holds the thumbnail, in CSS pixels. */
  cardWidth: number;
  /** Height of the box of the thumbnail inside its border, in CSS pixels. */
  thumbnailHeight: number;
}

/**
 * Opens the Projects page and measures its first thumbnail, which downloads at once, as every card
 * of the page has its width. The browser divides the natural width of an `img` by the density of
 * the file that it picked, its `w` descriptor over the width that `sizes` gives: since the files
 * are as wide as their descriptors say, the natural width is the width that `sizes` gives. A copy
 * whose `sizes` calls an unknown function instead of `max()` tells what a browser that refuses
 * `max()` there gets.
 */
const measureFirstThumbnail = async (page: Page): Promise<MeasuredThumbnail> => {
  await page.goto(PROJECTS_ROUTE);
  const thumbnail = page.locator(`${PROJECT_CARD_SELECTOR} img`).first();
  await expect.poll(() => thumbnail.evaluate(isImageLoaded)).toBe(true);
  return thumbnail.evaluate(
    async (img: HTMLImageElement, { cardSelector, maxFunction, unknownFunction }) => {
      const file = new Image();
      file.src = img.currentSrc;
      const fallback = new Image();
      fallback.sizes = img.sizes.replaceAll(maxFunction, unknownFunction);
      fallback.srcset = img.srcset;
      await Promise.all([file.decode(), fallback.decode()]);
      const box = img.getBoundingClientRect();
      return {
        fileWidth: file.naturalWidth,
        sizesWidth: img.naturalWidth,
        fallbackSizesWidth: fallback.naturalWidth,
        cardWidth: img.closest(cardSelector)?.getBoundingClientRect().width ?? Number.NaN,
        thumbnailHeight: box.height,
      };
    },
    {
      cardSelector: PROJECT_CARD_SELECTOR,
      maxFunction: SIZES_MAX_FUNCTION,
      unknownFunction: UNKNOWN_SIZES_FUNCTION,
    },
  );
};

// A file narrower than the screenshot drawn on the screen enlarges it; a wider one wastes the data
// of a phone, as Lighthouse reports
for (const { width, height, deviceScaleFactor, fileWidth } of THUMBNAIL_FILE_SCREENS) {
  test.describe(`on a ${width} × ${height} screen at ${deviceScaleFactor}x`, () => {
    test.use({ viewport: { width, height }, deviceScaleFactor });

    test(`a thumbnail downloads its ${fileWidth} px wide file`, async ({ page }) => {
      const thumbnail = await measureFirstThumbnail(page);

      expect(thumbnail.fileWidth, 'width of the downloaded file').toBe(fileWidth);
    });
  });
}

for (const width of THUMBNAIL_SIZES_SCREEN_WIDTHS_PX) {
  test.describe(`on a ${width} px wide screen`, () => {
    test.use({ viewport: { width, height: SCREEN_HEIGHT_PX } });

    // Narrower, sizes would enlarge the screenshot; wider, the file would be wider than needed
    test('the sizes of a thumbnail give the width that it draws its screenshot at', async ({
      page,
    }) => {
      const { sizesWidth, cardWidth, thumbnailHeight } = await measureFirstThumbnail(page);
      // A screenshot of the widest ratio covers the thumbnail at this width, the card's or more
      const drawnWidth = Math.max(cardWidth, thumbnailHeight * MAX_THUMBNAIL_ASPECT_RATIO);

      expect(
        Math.abs(sizesWidth - drawnWidth),
        `${sizesWidth} px for a screenshot drawn ${drawnWidth} px wide`,
      ).toBeLessThanOrEqual(MAX_THUMBNAIL_SIZES_OFFSET_PX);
    });

    test('a browser that refuses max() in sizes gets the width of the card', async ({ page }) => {
      const { fallbackSizesWidth, cardWidth } = await measureFirstThumbnail(page);

      expect(
        Math.abs(fallbackSizesWidth - cardWidth),
        `${fallbackSizesWidth} px for a ${cardWidth} px card`,
      ).toBeLessThanOrEqual(MAX_THUMBNAIL_SIZES_OFFSET_PX);
    });
  });
}
