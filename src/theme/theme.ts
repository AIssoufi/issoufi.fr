import {
  alphaVariants,
  blurs,
  durations,
  fontSizes,
  letterSpacings,
  lineHeights,
  palette,
  rgb,
  spacing,
} from './tokens';

/**
 * Semantic design tokens of the site, following the xstyled theme conventions (`colors`,
 * `space`, `fontSizes`, `radii`, `shadows`…). Styled-components read them with the `th` helpers
 * of `@xstyled/styled-components`, e.g. `th.color('accent')` or `th.space(16)`. Values come from
 * the primitive scales of `tokens.ts`; names describe roles.
 */
export const theme = {
  colors: {
    /** Text and icons on the dark background. */
    foreground: palette.white,
    'foreground-secondary': palette.gray200,
    'foreground-muted': palette.gray400,
    /** Low-contrast text such as technology chips. */
    'foreground-subtle': palette.lavenderGray60,
    /** White translucent fills, borders and glows. */
    ...alphaVariants({
      name: 'foreground',
      rgb: rgb.white,
      opacities: [4, 5, 6, 8, 9, 10, 15, 18, 20, 25, 35, 40, 50, 55, 65, 70, 72, 80, 85] as const,
    }),
    background: palette.black,
    /** Translucent card and panel fill. */
    surface: `rgba(${rgb.white}, 0.06)`,
    /** Brand plum: active states, highlights, glows. */
    accent: palette.plum,
    ...alphaVariants({
      name: 'accent',
      rgb: rgb.plum,
      opacities: [10, 15, 20, 25, 30, 35, 40, 55, 60, 65, 70, 85, 90] as const,
    }),
    /** Light pink companion of the accent: gradients, timeline dots, soft glows. */
    'accent-soft': palette.pink,
    ...alphaVariants({ name: 'accent-soft', rgb: rgb.pink, opacities: [65, 85, 95] as const }),
    /** Black translucent layers: shadows, scrims, button backgrounds over images. */
    ...alphaVariants({
      name: 'shade',
      rgb: rgb.black,
      opacities: [0, 30, 35, 40, 45, 50, 55, 80] as const,
    }),
    /** Positive status, e.g. the "in production" badge. */
    success: palette.mint85,
    ...alphaVariants({ name: 'success', rgb: rgb.green, opacities: [10, 20] as const }),
    /** Background of the full-screen mobile menu. */
    'overlay-mobile-menu': palette.deepViolet92,
  },
  /** RGB channels of some colors, for canvas drawings with a computed opacity. */
  colorChannels: {
    accent: rgb.plum,
  },
  space: {
    ...spacing,
    /** Horizontal padding of every page and of the header. */
    page: spacing[24],
    /** Gap between an icon and its label, relative to the font size. */
    'icon-gap': '0.7em',
  },
  sizes: {
    /** Largest width of the app container. */
    container: '1440px',
  },
  fonts: {
    body: "'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
    display: "'Saira Stencil One', cursive",
    code: "source-code-pro, Menlo, Monaco, Consolas, 'Courier New', monospace",
  },
  fontSizes,
  fontWeights: { light: 300, regular: 400, medium: 500, semibold: 600, bold: 700, extrabold: 800 },
  letterSpacings,
  lineHeights,
  radii: {
    0: '0',
    1: '1px',
    2: '2px',
    sm: '8px',
    md: '12px',
    20: '20px',
    24: '24px',
    30: '30px',
    /** Fully rounded ends for buttons and badges. */
    pill: '60px',
    circle: '50%',
  },
  borderWidths: { thin: '1px', thick: '2px' },
  borders: {
    /** Hairline border of cards and panels. */
    card: `1px solid rgba(${rgb.white}, 0.1)`,
  },
  shadows: {
    card: `0 4px 24px rgba(${rgb.black}, 0.3)`,
    cardHover: `0 8px 32px rgba(${rgb.black}, 0.4)`,
    accentGlow: `0 0 10px rgba(${rgb.plum}, 0.55)`,
    accentGlowFaint: `0 0 10px rgba(${rgb.plum}, 0.25)`,
    accentGlowWide: `0 0 16px rgba(${rgb.plum}, 0.3)`,
    accentGlowStrong: `0 0 28px rgba(${rgb.plum}, 0.65)`,
    accentHalo: `0 4px 28px rgba(${rgb.plum}, 0.2)`,
    lightGlow: `0 0 16px rgba(${rgb.white}, 0.15)`,
  },
  /** Background blurs for frosted-glass panels. Not an xstyled namespace: use `th('blurs.8')`. */
  blurs,
  durations: { ...durations, base: durations[250] },
  timingFunctions: {
    standard: 'ease',
    linear: 'linear',
    inOut: 'ease-in-out',
    /** Overshooting ease for playful pops. */
    spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    /** Fast start, long gentle stop, for elements coming back to rest. */
    out: 'cubic-bezier(0.23, 1, 0.32, 1)',
  },
  zIndices: {
    /** Background photo of a page. */
    pageBackground: -2,
    /** Darkening layer over the page background, and decorations behind their parent. */
    behind: -1,
    base: 0,
    /** Local stacking inside a component. */
    raised: 1,
    raisedMore: 2,
    raisedMost: 3,
    /** Full-screen mobile menu and floating language toggle. */
    overlay: 9,
    /** Header and burger icon, above the mobile menu. */
    header: 11,
    /** Cursor glow, above everything. */
    cursor: 9999,
  },
  /** Breakpoints, in `em` so they follow the browser's font size. */
  screens: {
    /** From this width, the desktop layout is used. */
    tablet: '50em',
    /** Wide screens. */
    wide: '100em',
  },
} as const;
