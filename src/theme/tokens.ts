/**
 * Primitive design tokens: raw scales named by value, never by use. Components do not read them
 * directly; they go through the semantic tokens of `theme.ts`.
 */

/**
 * Builds translucent variants of a color, named the xstyled way: `<name>-a<opacity in percent>`.
 *
 * @example
 * alphaVariants({ name: 'accent', rgb: '139, 49, 104', opacities: [55] });
 * // { 'accent-a55': 'rgba(139, 49, 104, 0.55)' }
 */
export function alphaVariants<N extends string, P extends number>({
  name,
  rgb,
  opacities,
}: {
  /** Color name used as the prefix of each variant. */
  name: N;
  /** RGB channels of the color, e.g. `'255, 255, 255'`. */
  rgb: string;
  /** Opacities to generate, in percent. */
  opacities: readonly P[];
}): Record<`${N}-a${P}`, string> {
  return Object.fromEntries(
    opacities.map(percent => [`${name}-a${percent}`, `rgba(${rgb}, ${percent / 100})`]),
  ) as Record<`${N}-a${P}`, string>;
}

/** RGB channels of the base hues, for building translucent variants. */
export const rgb = {
  white: '255, 255, 255',
  black: '0, 0, 0',
  plum: '139, 49, 104',
  pink: '212, 160, 192',
  green: '50, 180, 100',
} as const;

/** Solid colors of the palette. */
export const palette = {
  white: '#ffffff',
  gray200: '#e5e5e5',
  gray400: '#c4c4c4',
  black: '#000000',
  plum: '#8b3168',
  pink: '#d4a0c0',
  lavenderGray60: 'rgba(210, 208, 220, 0.6)',
  mint85: 'rgba(130, 210, 150, 0.85)',
  deepViolet92: 'rgba(10, 6, 18, 0.92)',
} as const;

/** Spacing scale; keys are pixel values. */
export const spacing = {
  0: '0',
  1: '1px',
  2: '2px',
  3: '3px',
  4: '4px',
  5: '5px',
  6: '6px',
  7: '7px',
  8: '8px',
  9: '9px',
  10: '10px',
  11: '11px',
  12: '12px',
  13: '13px',
  14: '14px',
  16: '16px',
  18: '18px',
  20: '20px',
  22: '22px',
  24: '24px',
  28: '28px',
  30: '30px',
  32: '32px',
  36: '36px',
  48: '48px',
  56: '56px',
  80: '80px',
} as const;

/** Spacing that follows the font size of the element; keys are hundredths of an em. */
export const relativeSpacing = {
  70: '0.7em',
} as const;

/**
 * Spacing that grows with the height of the screen, between a smallest and a largest space; keys
 * are `<smallest>-<largest>` in pixels. `16-80` is 6 % of the height: 19 px on a phone held
 * sideways, 54 px on a 900 px high laptop screen.
 */
export const fluidSpacing = {
  '16-80': 'clamp(16px, 6vh, 80px)',
} as const;

/** Widths and heights of elements, from hairlines to the app container; keys are pixel values. */
export const sizes = {
  1: '1px',
  2: '2px',
  3: '3px',
  12: '12px',
  15: '15px',
  16: '16px',
  30: '30px',
  32: '32px',
  36: '36px',
  44: '44px',
  48: '48px',
  50: '50px',
  54: '54px',
  90: '90px',
  94: '94px',
  222: '222px',
  240: '240px',
  640: '640px',
  1440: '1440px',
} as const;

/** Widths and heights that follow the font size of the element; keys are hundredths of an em. */
export const relativeSizes = {
  1525: '15.25em',
} as const;

/** Line lengths of text blocks; keys are numbers of characters. */
export const measures = {
  40: '40ch',
} as const;

/** Corner radii; keys are pixel values, except `half`, which rounds a square into a circle. */
export const radii = {
  0: '0',
  1: '1px',
  2: '2px',
  8: '8px',
  12: '12px',
  20: '20px',
  24: '24px',
  30: '30px',
  60: '60px',
  half: '50%',
} as const;

/**
 * Offsets and blur radii of box shadows, without their color; keys are `<vertical offset>-<blur
 * radius>` in pixels, and the horizontal offset is always zero.
 */
export const shadowShapes = {
  '0-10': '0 0 10px',
  '0-16': '0 0 16px',
  '0-28': '0 0 28px',
  '4-24': '0 4px 24px',
  '4-28': '0 4px 28px',
  '8-32': '0 8px 32px',
} as const;

/** Font stacks, named after their first font; the next ones are fallbacks. */
export const fontFamilies = {
  montserrat:
    "'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
  sairaStencilOne: "'Saira Stencil One', cursive",
  sourceCodePro: "source-code-pro, Menlo, Monaco, Consolas, 'Courier New', monospace",
} as const;

/** Font sizes; keys are pixel values. */
export const fontSizes = {
  10: '10px',
  11: '11px',
  12: '12px',
  13: '13px',
  14: '14px',
  15: '15px',
  16: '16px',
  17: '17px',
  18: '18px',
  22: '22px',
  26: '26px',
  28: '28px',
  34: '34px',
  36: '36px',
  40: '40px',
  42: '42px',
  72: '72px',
  120: '120px',
} as const;

/**
 * Font sizes that grow with the smaller side of the screen (`vmin`), its width on a phone held
 * upright and its height on a phone held sideways or a laptop, between a smallest and a largest
 * size; keys are `<smallest>-<largest>` in pixels.
 */
export const fluidFontSizes = {
  /** 16 px on a phone, 19 px on a 1440 × 900 screen, 23 px on a 2560 × 1440 one. */
  '16-24': 'clamp(16px, 12px + 0.75vmin, 24px)',
  /** 18 px on a phone, 23 px on a 1440 × 900 screen, 28 px on a 2560 × 1440 one. */
  '18-28': 'clamp(18px, 14px + 1vmin, 28px)',
  /** 25 to 29 px on a phone, 48 px on a 1440 × 900 screen, 70 px on a 2560 × 1440 one. */
  '24-72': 'clamp(24px, 12px + 4vmin, 72px)',
} as const;

/** Font weights, named after their usual names in fonts (`semibold` is 600). */
export const fontWeights = {
  light: 300,
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  extrabold: 800,
} as const;

/** Letter spacings; keys are hundredths of an em (`tight` is negative). */
export const letterSpacings = {
  tight: '-0.01em',
  1: '0.01em',
  2: '0.02em',
  3: '0.03em',
  4: '0.04em',
  5: '0.05em',
  6: '0.06em',
  8: '0.08em',
} as const;

/** Unitless line heights; keys are percentages of the font size. */
export const lineHeights = {
  100: 1,
  120: 1.2,
  140: 1.4,
  145: 1.45,
  150: 1.5,
  155: 1.55,
  160: 1.6,
  170: 1.7,
} as const;

/** Durations; keys are milliseconds. */
export const durations = {
  0.01: '0.01ms',
  100: '0.1s',
  150: '0.15s',
  200: '0.2s',
  250: '0.25s',
  300: '0.3s',
  350: '0.35s',
  400: '0.4s',
  500: '0.5s',
  700: '0.7s',
  900: '0.9s',
  5000: '5s',
  7000: '7s',
} as const;

/**
 * Easing curves: the CSS keywords, and cubic Bézier curves named after the Robert Penner easing
 * they draw.
 */
export const easings = {
  ease: 'ease',
  linear: 'linear',
  easeInOut: 'ease-in-out',
  /** Overshoots its end, then settles back. */
  easeOutBack: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  /** Starts fast, then slows down over most of its duration. */
  easeOutQuint: 'cubic-bezier(0.23, 1, 0.32, 1)',
} as const;

/** Background blurs; keys are pixel radii. */
export const blurs = {
  8: 'blur(8px)',
  10: 'blur(10px)',
  12: 'blur(12px)',
  14: 'blur(14px)',
  20: 'blur(20px)',
} as const;

/** Stacking orders; keys are the values. */
export const zIndices = {
  '-2': -2,
  '-1': -1,
  0: 0,
  1: 1,
  2: 2,
  3: 3,
  9: 9,
  11: 11,
  9999: 9999,
} as const;

/**
 * Viewport widths and heights where the layout changes; keys are em values, which follow the font
 * size.
 */
export const breakpoints = {
  31.25: '31.25em',
  37.5: '37.5em',
  50: '50em',
  53.625: '53.625em',
  100: '100em',
} as const;
