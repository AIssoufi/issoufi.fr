/** Width and height of an image file, in its pixels, or of the box that shows it, in CSS pixels. */
export interface ImageSize {
  /** Width, a number greater than zero for a size that can be measured. */
  width: number;
  /** Height, a number greater than zero for a size that can be measured. */
  height: number;
}

/** Tells whether a value is a finite number greater than zero, as a measured length is. */
const isPositiveLength = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value > 0;

/** Tells whether a value is a size whose width and height can divide a length. */
const isMeasurableSize = (size: unknown): size is ImageSize => {
  const isObject = typeof size === 'object' && size !== null;
  if (!isObject) return false;

  const { width, height } = size as Partial<ImageSize>;
  return isPositiveLength(width) && isPositiveLength(height);
};

/** Parameters of {@link getImageEnlargement}. */
interface GetImageEnlargementParams {
  /** Box of the `img`, in CSS pixels, which `object-fit: cover` fills with the image. */
  box?: ImageSize | null;
  /** Size of the file that the `img` shows, in its own pixels. */
  file?: ImageSize | null;
  /**
   * Device pixels per CSS pixel of the screen, 2 on a 2x screen.
   * @default 1
   */
  deviceScaleFactor?: number;
}

/**
 * Computes how many device pixels each pixel of a file takes on the screen once `object-fit:
 * cover` fills a box with it: scaled until it covers both the width and the height of the box,
 * then by the density of the screen. Above 1, the screen enlarges the image, which then looks
 * blurred; at most 1, it shows each pixel of the file in one device pixel or less.
 *
 * @returns `NaN` when the box, the file or the scale is not made of numbers greater than zero.
 *
 * @example
 * // A 16:10 file 720 px wide in a box of 325 × 220, on a 2x screen: its height sets the scale
 * getImageEnlargement({
 *   box: { width: 325, height: 220 },
 *   file: { width: 720, height: 450 },
 *   deviceScaleFactor: 2,
 * }); // 0.978
 */
export const getImageEnlargement = ({
  box,
  file,
  deviceScaleFactor = 1,
}: GetImageEnlargementParams = {}): number => {
  const canMeasure =
    isMeasurableSize(box) && isMeasurableSize(file) && isPositiveLength(deviceScaleFactor);
  if (!canMeasure) return Number.NaN;

  const coverScale = Math.max(box.width / file.width, box.height / file.height);
  return coverScale * deviceScaleFactor;
};
