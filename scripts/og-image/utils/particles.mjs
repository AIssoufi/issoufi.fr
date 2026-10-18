// @ts-check

/**
 * A dot of the particle field, as `createParticles` of the home page creates it. Only its
 * position and radius are drawn.
 * @typedef {object} Dot
 * @property {number} x - Horizontal position, in pixels.
 * @property {number} y - Vertical position, in pixels.
 * @property {number} size - Radius, in pixels.
 */

/**
 * Line between two dots close to each other.
 * @typedef {object} DotLink
 * @property {Dot} from - One end of the line.
 * @property {Dot} to - The other end of the line.
 * @property {number} strength - Between 0 and 1: 1 when the dots touch, fading with distance.
 */

/** Decimals kept in the coordinates of the drawing: a hundredth of a pixel is invisible. */
const COORDINATE_DECIMALS = 2;

/**
 * Rounds a coordinate or a size of the drawing, to keep the SVG short.
 * @param {number} value - Value in pixels.
 * @returns {string} The value with at most two decimals.
 */
const formatNumber = value => String(Number(value.toFixed(COORDINATE_DECIMALS)));

/**
 * Tells whether a value is a dot that can be drawn: an object with a finite position and a
 * positive radius.
 * @param {unknown} value - Value to check.
 * @returns {value is Dot} False for `null`, a value that is not an object, and a dot with a
 * missing or invalid coordinate or radius.
 */
const isDot = value => {
  const isObject = typeof value === 'object' && value !== null;
  if (!isObject) return false;

  const { x, y, size } = /** @type {Record<string, unknown>} */ (value);
  const hasPosition = Number.isFinite(x) && Number.isFinite(y);
  return hasPosition && typeof size === 'number' && size > 0;
};

/**
 * Keeps the drawable dots of a list.
 * @param {unknown} dots - List of dots. A value that is not an array counts as no dots.
 * @returns {Dot[]} The entries that are drawable dots, in order.
 */
const toDrawableDots = dots => (Array.isArray(dots) ? dots.filter(isDot) : []);

/**
 * Tells whether a value is a link that can be drawn: an object between two drawable dots, with a
 * strength above 0 and at most 1.
 * @param {unknown} value - Value to check.
 * @returns {value is DotLink} False for `null`, a value that is not an object, a link to an
 * invalid dot, and a missing or out-of-range strength.
 */
const isDotLink = value => {
  const isObject = typeof value === 'object' && value !== null;
  if (!isObject) return false;

  const { from, to, strength } = /** @type {Record<string, unknown>} */ (value);
  const hasValidStrength = typeof strength === 'number' && strength > 0 && strength <= 1;
  return isDot(from) && isDot(to) && hasValidStrength;
};

/**
 * Parameters of {@link findDotLinks}.
 * @typedef {object} FindDotLinksParams
 * @property {unknown[]} [dots] - Dots of the field. Entries that are not drawable dots are
 * skipped, and a value that is not an array counts as no dots.
 * @property {(params: { from: Dot, to: Dot, maxDistance: number }) => number} getLinkStrength -
 * Strength of the line between two dots, `getLinkStrength` of the home page.
 * @property {number} maxDistance - Distance from which two dots are not linked anymore.
 */

/**
 * Finds the pairs of dots linked by a line, as the particle field of the home page draws them on
 * each frame.
 * @param {FindDotLinksParams} params
 * @returns {DotLink[]} One link per pair of dots with a strength above 0, in drawing order.
 * @example
 * findDotLinks({ dots, getLinkStrength, maxDistance: LINK_DISTANCE_PX });
 */
export const findDotLinks = ({ dots, getLinkStrength, maxDistance }) => {
  const drawableDots = toDrawableDots(dots);

  return drawableDots.flatMap((from, index) =>
    drawableDots
      .slice(index + 1)
      .map(to => ({ from, to, strength: getLinkStrength({ from, to, maxDistance }) }))
      .filter(({ strength }) => strength > 0),
  );
};

/**
 * Parameters of {@link renderParticlesSvg}.
 * @typedef {object} RenderParticlesSvgParams
 * @property {number} width - Width of the drawing, in pixels.
 * @property {number} height - Height of the drawing, in pixels.
 * @property {unknown[]} [dots] - Dots to draw. Entries that are not drawable dots are skipped.
 * @property {unknown[]} [links] - Lines to draw under the dots, from {@link findDotLinks}. Entries
 * that are not drawable links are skipped.
 * @property {string} dotColor - Fill color of the dots.
 * @property {string} linkRgb - RGB channels of the line color, e.g. `'139, 49, 104'`, to which
 * each line adds its opacity.
 * @property {number} linkMaxOpacity - Opacity of a full-strength line.
 * @property {number} linkMaxWidth - Width of a full-strength line, in pixels.
 */

/**
 * Draws a still of the particle field of the home page as an SVG: the lines between close dots,
 * fading and thinning with distance, under the dots themselves.
 * @param {RenderParticlesSvgParams} params
 * @returns {string} The `<svg>` element, sized to the drawing.
 * @example
 * renderParticlesSvg({
 *   width: 1200,
 *   height: 630,
 *   dots: [{ x: 10, y: 20, size: 1 }],
 *   links: [],
 *   dotColor: 'rgba(255, 255, 255, 0.65)',
 *   linkRgb: '139, 49, 104',
 *   linkMaxOpacity: 0.4,
 *   linkMaxWidth: 0.8,
 * }); // '<svg …><circle cx="10" cy="20" r="1" fill="rgba(255, 255, 255, 0.65)"/></svg>'
 */
export const renderParticlesSvg = ({
  width,
  height,
  dots,
  links,
  dotColor,
  linkRgb,
  linkMaxOpacity,
  linkMaxWidth,
}) => {
  const lines = (Array.isArray(links) ? links.filter(isDotLink) : []).map(
    ({ from, to, strength }) => {
      const stroke = `rgba(${linkRgb}, ${formatNumber(strength * linkMaxOpacity)})`;
      const coordinates = `x1="${formatNumber(from.x)}" y1="${formatNumber(from.y)}" x2="${formatNumber(to.x)}" y2="${formatNumber(to.y)}"`;
      return `<line ${coordinates} stroke="${stroke}" stroke-width="${formatNumber(strength * linkMaxWidth)}"/>`;
    },
  );
  const circles = toDrawableDots(dots).map(
    ({ x, y, size }) =>
      `<circle cx="${formatNumber(x)}" cy="${formatNumber(y)}" r="${formatNumber(size)}" fill="${dotColor}"/>`,
  );

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${[...lines, ...circles].join('')}</svg>`;
};
