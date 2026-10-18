import {
  alphaVariants,
  blurs,
  breakpoints,
  durations,
  easings,
  fontFamilies,
  fontSizes,
  fontWeights,
  letterSpacings,
  lineHeights,
  measures,
  palette,
  radii,
  relativeSpacing,
  rgb,
  shadowShapes,
  sizes,
  spacing,
  zIndices,
} from './tokens';

/** White translucent fills, borders and glows. */
const foregroundAlphas = alphaVariants({
  name: 'foreground',
  rgb: rgb.white,
  opacities: [4, 5, 6, 8, 9, 10, 15, 18, 20, 25, 35, 40, 50, 55, 65, 70, 72, 80, 85] as const,
});

/** Semantic colors, named by role; the borders and shadows of the theme read them too. */
const colors = {
  /** Text and icons on the dark background. */
  foreground: palette.white,
  'foreground-secondary': palette.gray200,
  'foreground-muted': palette.gray400,
  /** Low-contrast text such as technology chips. */
  'foreground-subtle': palette.lavenderGray60,
  ...foregroundAlphas,
  background: palette.black,
  /** Translucent card and panel fill. */
  surface: foregroundAlphas['foreground-a6'],
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
} as const;

/**
 * Semantic design tokens of the site, following the xstyled theme conventions (`colors`,
 * `space`, `fontSizes`, `radii`, `shadows`…). Styled-components read them with the `th` helpers
 * of `@xstyled/styled-components`, e.g. `th.color('accent')` or `th.space(16)`. Every value comes
 * from the primitive scales of `tokens.ts`, which `theme.spec.jsx` checks; names describe roles.
 */
export const theme = {
  colors,
  /** RGB channels of some colors, for canvas drawings with a computed opacity. */
  colorChannels: {
    accent: rgb.plum,
  },
  space: {
    ...spacing,
    /** Horizontal padding of every page and of the header. */
    page: spacing[24],
    /**
     * Space above the content of every page, under the header. The status pages keep as much under
     * their message, so it sits in the middle of the page.
     */
    'page-top': spacing[16],
    /** Distance between the centers of two bars of the burger icon of the mobile menu. */
    'burger-bar-gap': spacing[9],
    /** Space around each project card, so two cards side by side stand twice as far apart. */
    'project-card-margin': spacing[5],
    /** Gap between an icon and its label, relative to the font size. */
    'icon-gap': relativeSpacing[70],
  },
  sizes: {
    ...sizes,
    /** Largest width of the app container. */
    container: sizes[1440],
    /**
     * Height of the site header: the logo, 54 px high, with 20 px above and below. Its blurred
     * band, fixed on the screen, has the same height, so it covers the header and nothing else.
     */
    header: sizes[94],
    /**
     * Height of the site header on a short screen (see `screenHeights.short`), as on a phone held
     * sideways: 15 % of a 320 px high screen, so the page keeps most of it. Its band follows.
     */
    'header-compact': sizes[48],
    /** Side of the burger button of the mobile menu. */
    'burger-icon': sizes[50],
    /** Side of the burger icon in the compact header, still the size of a target for a finger. */
    'burger-icon-compact': sizes[44],
    /** Length of each of the three bars of the burger icon, their round ends included. */
    'burger-bar': sizes[30],
    /** Thickness of each bar of the burger icon. */
    'burger-bar-thickness': sizes[3],
    /**
     * Smallest side of a target that a finger taps, such as the CV link of the mobile menu: 44 px,
     * the size that the Web Content Accessibility Guidelines recommend.
     */
    'finger-target': sizes[44],
    /** Largest width of the text of a status message, short enough to read at a glance. */
    message: measures[40],
  },
  fonts: {
    body: fontFamilies.montserrat,
    display: fontFamilies.sairaStencilOne,
    code: fontFamilies.sourceCodePro,
  },
  fontSizes,
  fontWeights,
  letterSpacings,
  lineHeights,
  radii: {
    0: radii[0],
    1: radii[1],
    2: radii[2],
    sm: radii[8],
    md: radii[12],
    20: radii[20],
    24: radii[24],
    30: radii[30],
    /** Fully rounded ends for buttons and badges. */
    pill: radii[60],
    circle: radii.half,
  },
  borderWidths: { thin: sizes[1], thick: sizes[2] },
  borders: {
    /** Hairline border of cards and panels. */
    card: `${sizes[1]} solid ${colors['foreground-a10']}`,
  },
  shadows: {
    card: `${shadowShapes['4-24']} ${colors['shade-a30']}`,
    cardHover: `${shadowShapes['8-32']} ${colors['shade-a40']}`,
    accentGlow: `${shadowShapes['0-10']} ${colors['accent-a55']}`,
    accentGlowFaint: `${shadowShapes['0-10']} ${colors['accent-a25']}`,
    accentGlowStrong: `${shadowShapes['0-28']} ${colors['accent-a65']}`,
    accentHalo: `${shadowShapes['4-28']} ${colors['accent-a20']}`,
    lightGlow: `${shadowShapes['0-16']} ${colors['foreground-a15']}`,
  },
  /** Background blurs for frosted-glass panels. Not an xstyled namespace: use `th('blurs.8')`. */
  blurs,
  durations: {
    ...durations,
    base: durations[250],
    /**
     * Near zero: what the reduced motion rule of `GlobalStyle` gives every animation and
     * transition, so they jump to their end, and a transition still sends its `transitionend`
     * event, which a zero duration would not start.
     */
    instant: durations[0.01],
  },
  timingFunctions: {
    standard: easings.ease,
    linear: easings.linear,
    inOut: easings.easeInOut,
    /** Overshooting ease for playful pops. */
    spring: easings.easeOutBack,
    /** Fast start, long gentle stop, for elements coming back to rest. */
    out: easings.easeOutQuint,
  },
  zIndices: {
    /** Background photo of a page. */
    pageBackground: zIndices[-2],
    /** Darkening layer over the page background, and decorations behind their parent. */
    behind: zIndices[-1],
    base: zIndices[0],
    /** Local stacking inside a component. */
    raised: zIndices[1],
    raisedMore: zIndices[2],
    raisedMost: zIndices[3],
    /** Full-screen mobile menu, and the language toggle floating on desktop. */
    overlay: zIndices[9],
    /** Header and burger icon, above the mobile menu. */
    header: zIndices[11],
    /** Cursor glow, above everything. */
    cursor: zIndices[9999],
  },
  /** Breakpoints, in `em` so they follow the browser's font size. */
  screens: {
    /**
     * From this width, the project sections show two columns of cards instead of one: 600 px, past
     * the 578 px where two cards with their margins fit between the page gutters without getting
     * narrower than 260 px.
     */
    'two-project-columns': breakpoints[37.5],
    /** From this width, the desktop layout is used. */
    tablet: breakpoints[50],
    /**
     * From this width, the project sections show three columns of cards instead of two: 858 px,
     * where three cards with their margins fit between the page gutters without getting narrower
     * than 260 px.
     */
    'three-project-columns': breakpoints['53.625'],
    /** Wide screens. */
    wide: breakpoints[100],
  },
  /**
   * Screen heights where the layout changes, in `em` like `screens`, kept apart from them since
   * xstyled reads `screens` as widths. Not an xstyled namespace: use `th('screenHeights.short')`.
   */
  screenHeights: {
    /**
     * Up to this height, 500 px at the default font size, as on a phone held sideways, the header
     * and the open mobile menu are compact.
     */
    short: breakpoints[31.25],
  },
} as const;
