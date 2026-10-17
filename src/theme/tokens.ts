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
  100: '0.1s',
  150: '0.15s',
  200: '0.2s',
  250: '0.25s',
  300: '0.3s',
  350: '0.35s',
  400: '0.4s',
  450: '0.45s',
  500: '0.5s',
  700: '0.7s',
  900: '0.9s',
  5000: '5s',
  7000: '7s',
} as const;

/** Background blurs; keys are pixel radii. */
export const blurs = {
  8: 'blur(8px)',
  10: 'blur(10px)',
  12: 'blur(12px)',
  14: 'blur(14px)',
  20: 'blur(20px)',
} as const;
