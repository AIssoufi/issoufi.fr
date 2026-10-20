// @ts-check
// Lays out the "AI" logo from the outlines of its glyphs, and draws each icon of the site around
// it as an SVG: the favicon as it is, the other icons as the page that Chromium saves as a PNG.

/** @typedef {import('./glyf.mjs').OutlinePoint} OutlinePoint */
/** @typedef {import('./woff2.mjs').FontOutlines} FontOutlines */

/** Decimals of the coordinates of the paths: a hundredth of a unit of the icon. */
const PATH_DECIMALS = 2;

/** Decimals of the sizes of the logo of the header, in ems: a thousandth of a pixel at 100 px. */
const EM_DECIMALS = 5;

/** Transform that leaves the logo in font units, its baseline at y = 0. */
const FONT_UNITS_TRANSFORM = { scale: 1, translateX: 0, translateY: 0 };

/** Namespace of the SVG elements. */
const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';

/** A CSS length in ems, such as a letter spacing of the theme. Its group captures the number. */
const EM_LENGTH_PATTERN = /^(-?\d*\.?\d+)em$/;

/**
 * Reads a CSS length in ems, as the letter spacings of the theme are written.
 * @param {unknown} length - Length, e.g. `0.02em`.
 * @returns {number} Its number of ems, e.g. `0.02`, or `NaN` for a value that is not a length in
 * ems.
 * @example
 * parseEmLength('-0.01em'); // -0.01
 * parseEmLength('2px'); // NaN
 */
export const parseEmLength = length => {
  const match = typeof length === 'string' ? length.trim().match(EM_LENGTH_PATTERN) : null;
  return match ? Number(match[1]) : Number.NaN;
};

/**
 * Pixels counted when the outline of the logo is drawn over its text in its font.
 * @typedef {object} InkComparison
 * @property {number} inkedCount - Pixels inked by the outline, the text or both.
 * @property {number} mismatchCount - Pixels inked by only one of them.
 */

/**
 * Gives the share of the inked pixels where the outline of the logo and its text in the font
 * differ: a few edge pixels when the outline is read right.
 * @param {InkComparison} comparison - Pixels counted in the browser.
 * @returns {number} The share, from 0 to 1, and 1 when nothing was inked or the counts are not
 * numbers, so that a check that drew nothing fails.
 * @example
 * getMismatchRatio({ inkedCount: 1000, mismatchCount: 12 }); // 0.012
 */
export const getMismatchRatio = ({ inkedCount, mismatchCount }) => {
  const isValid = inkedCount > 0 && mismatchCount >= 0 && mismatchCount <= inkedCount;
  return isValid ? mismatchCount / inkedCount : 1;
};

/**
 * Box around the points of the logo, with the y axis pointing down, as in SVG.
 * @typedef {object} Box
 * @property {number} minX - Left edge.
 * @property {number} minY - Top edge.
 * @property {number} maxX - Right edge.
 * @property {number} maxY - Bottom edge.
 */

/**
 * Logo laid out on its baseline, in font units, with the y axis pointing down, as in SVG.
 * @typedef {object} LogoOutline
 * @property {OutlinePoint[][]} contours - Contours of all its glyphs, each glyph after the
 * previous one.
 * @property {Box} box - Box around their points, all zeros for a logo without contours.
 * @property {number} advance - Width of its text, from its origin to the origin of a glyph that
 * would follow it, the letter spacing after each glyph included, as a browser lays out the text.
 */

/**
 * Finds the box around points.
 * @param {OutlinePoint[]} points - Points to enclose.
 * @returns {Box} Their box, all zeros without points.
 */
const getBox = points => {
  if (points.length === 0) return { minX: 0, minY: 0, maxX: 0, maxY: 0 };

  const xs = points.map(({ x }) => x);
  const ys = points.map(({ y }) => y);
  return {
    minX: Math.min(...xs),
    minY: Math.min(...ys),
    maxX: Math.max(...xs),
    maxY: Math.max(...ys),
  };
};

/**
 * Parameters of {@link layoutLogo}.
 * @typedef {object} LayoutLogoParams
 * @property {FontOutlines} outlines - Glyphs of the logo, from `readGlyphOutlines`.
 * @property {number} letterSpacingEm - Space added after each glyph, in ems, as the
 * `letter-spacing` of the logo in the header.
 */

/**
 * Lays out the glyphs of the logo on their baseline, as a browser draws its text without kerning:
 * each glyph starts at the advance of the previous one, plus the letter spacing. The y axis is
 * flipped, from the font, where it points up, to SVG, where it points down.
 * @param {LayoutLogoParams} params
 * @returns {LogoOutline} The contours of the logo, their box and its advance, in font units.
 * @example
 * layoutLogo({ outlines: readGlyphOutlines({ file, text: 'AI' }), letterSpacingEm: 0.02 });
 */
export const layoutLogo = ({ outlines, letterSpacingEm }) => {
  const spacing = letterSpacingEm * outlines.unitsPerEm;
  // The origin of each glyph, then the one of a glyph that would follow the last one
  const origins = outlines.glyphs.reduce(
    (originXs, { advanceWidth }) => [
      ...originXs,
      originXs[originXs.length - 1] + advanceWidth + spacing,
    ],
    [0],
  );
  const contours = outlines.glyphs.flatMap(({ contours: glyphContours }, index) =>
    glyphContours.map(contour =>
      // 0 - y rather than -y, which gives -0 for a point on the baseline
      contour.map(({ x, y, onCurve }) => ({ x: x + origins[index], y: 0 - y, onCurve })),
    ),
  );
  return { contours, box: getBox(contours.flat()), advance: origins[origins.length - 1] };
};

/**
 * Layout of an icon around the logo.
 * @typedef {object} IconLayout
 * @property {'tile' | 'square'} shape - Background: a tile with rounded corners, transparent
 * around them, or a square that fills the icon, for the systems that crop it to their own shape.
 * @property {number} logoWidthRatio - Width of the logo, as a share of the width of the icon.
 * @property {number} [safeZoneRadiusRatio] - Radius of the circle at the center of the icon that
 * the logo stays in, as a share of its width, for an icon that Android crops to the shape of its
 * home screen. Without it, the logo only keeps its width.
 */

/**
 * Scale and offset that place the logo in an icon, from font units to the units of the icon.
 * @typedef {object} LogoTransform
 * @property {number} scale - Units of the icon per font unit.
 * @property {number} translateX - Horizontal offset of the origin of the logo, in units of the
 * icon.
 * @property {number} translateY - Vertical offset of its baseline, in units of the icon.
 */

/**
 * Parameters of {@link getLogoTransform}.
 * @typedef {object} GetLogoTransformParams
 * @property {Box} box - Box of the logo, in font units.
 * @property {number} size - Width and height of the icon.
 * @property {IconLayout} layout - Layout of the icon.
 */

/**
 * Sizes the logo to the width of the layout, or smaller when the corners of its box would leave
 * the safe zone of the layout, and centers its box in the icon.
 * @param {GetLogoTransformParams} params
 * @returns {LogoTransform} The transform, with a scale of 0 for a logo whose box has no width or
 * no height, which nothing can center.
 * @example
 * const layout = { shape: 'square', logoWidthRatio: 0.5 };
 * getLogoTransform({ box: { minX: 0, minY: -50, maxX: 100, maxY: 0 }, size: 200, layout });
 * // { scale: 1, translateX: 50, translateY: 125 }
 */
export const getLogoTransform = ({ box, size, layout }) => {
  const width = box.maxX - box.minX;
  const height = box.maxY - box.minY;
  const hasArea = width > 0 && height > 0;
  if (!hasArea) return { scale: 0, translateX: size / 2, translateY: size / 2 };

  const widthScale = (layout.logoWidthRatio * size) / width;
  const safeZoneScale =
    layout.safeZoneRadiusRatio === undefined
      ? Infinity
      : (layout.safeZoneRadiusRatio * size) / (Math.hypot(width, height) / 2);
  const scale = Math.min(widthScale, safeZoneScale);
  return {
    scale,
    translateX: size / 2 - ((box.minX + box.maxX) / 2) * scale,
    translateY: size / 2 - ((box.minY + box.maxY) / 2) * scale,
  };
};

/**
 * Writes a coordinate of a path, rounded to {@link PATH_DECIMALS} decimals, without trailing
 * zeros.
 * @param {number} value - Coordinate.
 * @returns {string} The coordinate, e.g. `12.5`, `0` for a negative zero.
 */
export const formatCoordinate = value => {
  const rounded = Number(value.toFixed(PATH_DECIMALS));
  return String(Object.is(rounded, -0) ? 0 : rounded);
};

/**
 * Writes a point of a path, as `x y`.
 * @param {OutlinePoint} point - Point to write.
 * @returns {string} The point, e.g. `12.5 40`.
 */
const formatPoint = ({ x, y }) => `${formatCoordinate(x)} ${formatCoordinate(y)}`;

/**
 * Adds the on-curve points that TrueType implies between two off-curve points in a row, halfway
 * between them, the last point being followed by the first one.
 * @param {OutlinePoint[]} contour - Points of a closed contour.
 * @returns {OutlinePoint[]} The points, with the implied ones.
 */
const addImpliedPoints = contour =>
  contour.flatMap((point, index) => {
    const next = contour[(index + 1) % contour.length];
    const isBeforeOffCurvePoint = !point.onCurve && !next.onCurve;
    if (!isBeforeOffCurvePoint) return [point];

    return [point, { x: (point.x + next.x) / 2, y: (point.y + next.y) / 2, onCurve: true }];
  });

/**
 * Writes the path data of a closed TrueType contour: a line to each on-curve point, a quadratic
 * curve through each off-curve one, starting from an on-curve point.
 * @param {OutlinePoint[]} contour - Points of the contour, in the units of the path.
 * @returns {string} The path data, e.g. `M0 0L10 0Q10 10 0 10Z`, empty for a contour without
 * points.
 */
export const contourToPathData = contour => {
  if (contour.length === 0) return '';

  const points = addImpliedPoints(contour);
  const start = points.findIndex(({ onCurve }) => onCurve);
  const ordered = [...points.slice(start), ...points.slice(0, start)];
  const commands = [`M${formatPoint(ordered[0])}`];
  for (let index = 1; index < ordered.length; index += 1) {
    const point = ordered[index];
    if (point.onCurve) {
      commands.push(`L${formatPoint(point)}`);
    } else {
      // An off-curve point always comes before an on-curve one, or the start of the contour
      const end = ordered[(index + 1) % ordered.length];
      commands.push(`Q${formatPoint(point)} ${formatPoint(end)}`);
      index += 1;
    }
  }
  return `${commands.join('')}Z`;
};

/**
 * Parameters of {@link toLogoPathData}.
 * @typedef {object} ToLogoPathDataParams
 * @property {OutlinePoint[][]} contours - Contours of the logo, in font units.
 * @property {LogoTransform} transform - Transform that places them in the icon.
 */

/**
 * Writes the path data of the logo in the units of an icon.
 * @param {ToLogoPathDataParams} params
 * @returns {string} The path data of every contour, one after the other.
 */
export const toLogoPathData = ({ contours, transform: { scale, translateX, translateY } }) =>
  contours
    .map(contour =>
      contourToPathData(
        contour.map(({ x, y, onCurve }) => ({
          x: translateX + x * scale,
          y: translateY + y * scale,
          onCurve,
        })),
      ),
    )
    .join('');

/**
 * Logo of the header, drawn as an inline SVG of its outline in the place of its text, so that no
 * page loads its font for two letters: the JSON file that `pnpm icons` writes for the `Logo` of
 * the header (`src/App/Header/Logo/`). The SVG covers the line of text it replaces, from the top
 * to the bottom of the line, as wide as the text, and its sizes are in ems of the font size, so
 * that it takes the size of the text at any font size.
 * @typedef {object} HeaderLogo
 * @property {string} viewBox - View box of the SVG, in font units, its baseline at y = 0: from
 * the origin of the text and the top of the line, over the advance of the text and the height
 * of the line.
 * @property {number} widthEm - Width of the SVG, the advance of the text, in ems.
 * @property {number} heightEm - Height of the SVG, the height of a line of text in the font,
 * line gap included, in ems.
 * @property {number} descentEm - Distance from the baseline down to the bottom of the SVG, in
 * ems, by which the SVG goes below the baseline of the line, as the text did.
 * @property {string} pathData - Outline of the logo, in font units.
 */

/**
 * Parameters of {@link getHeaderLogo}.
 * @typedef {object} GetHeaderLogoParams
 * @property {FontOutlines} outlines - Glyphs of the logo and vertical metrics of its font, from
 * `readGlyphOutlines`.
 * @property {LogoOutline} logo - Logo laid out by {@link layoutLogo} from these glyphs.
 */

/**
 * Gives the logo of the header, the outline of its text in the box of its line, as a browser
 * lays out a line of text in the font: from the ascender to the descender of the font, plus half
 * the line gap at the top and half at the bottom, its baseline in between.
 * @param {GetHeaderLogoParams} params
 * @returns {HeaderLogo} The logo of the header.
 * @throws {Error} When the font has no units per em, which no em could measure.
 * @example
 * const outlines = readGlyphOutlines({ file, text: 'AI' });
 * getHeaderLogo({ outlines, logo: layoutLogo({ outlines, letterSpacingEm: 0.02 }) });
 * // { viewBox: '0 -1135 1057 1574', widthEm: 1.057, heightEm: 1.574, descentEm: 0.439, … }
 */
export const getHeaderLogo = ({ outlines, logo }) => {
  const { unitsPerEm, ascender, descender, lineGap } = outlines;
  const hasEmSize = unitsPerEm > 0;
  if (!hasEmSize) throw new Error('The font of the logo has no units per em');

  /**
   * Converts a length from font units to ems.
   * @param {number} units - Length in font units.
   */
  const toEm = units => Number((units / unitsPerEm).toFixed(EM_DECIMALS));
  const top = ascender + lineGap / 2;
  const bottom = -descender + lineGap / 2;
  return {
    viewBox: [0, -top, logo.advance, top + bottom].map(formatCoordinate).join(' '),
    widthEm: toEm(logo.advance),
    heightEm: toEm(top + bottom),
    descentEm: toEm(bottom),
    pathData: toLogoPathData({ contours: logo.contours, transform: FONT_UNITS_TRANSFORM }),
  };
};

/**
 * Colors of an icon, from the theme of the site.
 * @typedef {object} IconColors
 * @property {string} background - Color of its background, e.g. `#000000`.
 * @property {string} foreground - Color of the logo, e.g. `#ffffff`.
 */

/**
 * Parameters of {@link renderIconSvg}.
 * @typedef {object} RenderIconSvgParams
 * @property {LogoOutline} logo - Logo laid out by {@link layoutLogo}.
 * @property {number} size - Width and height of the icon, in pixels.
 * @property {IconLayout} layout - Layout of the icon.
 * @property {number} cornerRadiusRatio - Radius of the corners of a tile, as a share of its width.
 * @property {IconColors} colors - Colors of the icon.
 */

/**
 * Draws an icon as an SVG: its background, a tile or a square, then the logo, centered, as
 * vector paths, so that it needs no font.
 * @param {RenderIconSvgParams} params
 * @returns {string} The SVG, ending with a line break.
 */
export const renderIconSvg = ({ logo, size, layout, cornerRadiusRatio, colors }) => {
  const transform = getLogoTransform({ box: logo.box, size, layout });
  const radius = layout.shape === 'tile' ? formatCoordinate(size * cornerRadiusRatio) : '0';
  return [
    `<svg xmlns="${SVG_NAMESPACE}" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">`,
    `<rect width="${size}" height="${size}" rx="${radius}" fill="${colors.background}"/>`,
    `<path d="${toLogoPathData({ contours: logo.contours, transform })}" fill="${colors.foreground}"/>`,
    '</svg>\n',
  ].join('');
};
