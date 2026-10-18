// @ts-check

/**
 * Largest size of each CV, in bytes. In October 2026, the French CV weighed 85.0 kB and the
 * English one 83.9 kB, down from 274.9 kB for the CV exported from Figma.
 */
export const CV_MAX_BYTES = 500_000;

/** Most pages of each CV: recruiters read one or two. */
export const CV_MAX_PAGES = 2;

/** Paper format of the CV, as Playwright's `page.pdf()` names it. */
export const CV_PAPER_FORMAT = 'A4';

/**
 * Data of the CV that the site does not show: the contact details, the skills and the education,
 * relative to the project root. The site owner keeps it up to date.
 */
export const CV_DATA_MODULE = '/scripts/cv/.data/cv.json';

/**
 * Fingerprint of the content of the CV of each language, which `pnpm cv` writes with the PDFs,
 * relative to the project root: `scripts/cv/cvs.spec.js` fails once the content of the site no
 * longer gives the same one, as when an experience changes, until the CVs are generated again.
 */
export const CV_FINGERPRINTS_FILE = 'scripts/cv/fingerprints.json';

/** Hash function of the fingerprints, as `node:crypto` names it. */
export const FINGERPRINT_ALGORITHM = 'sha256';

/**
 * Modules of the site read by the script through Vite (`loadSiteModules`), with the translations
 * of `TRANSLATION_MODULES` (`scripts/utils/constants.mjs`): the design tokens, the origin and the
 * URLs of the site, the default language, the helpers that translate the JSON data, the URL of
 * the CV of each language and the GitHub profile. Paths are relative to the project root.
 */
export const SOURCE_MODULES = {
  theme: '/src/theme/theme.ts',
  pages: '/src/utils/pages.ts',
  i18nConstants: '/src/i18n/constants.ts',
  i18nUtils: '/src/i18n/utils.ts',
  projectUtils: '/src/pages/Projects/utils.ts',
  cvLink: '/src/App/Header/CvLink/constants.ts',
  gitHubLink: '/src/App/Header/GitHubLink/constants.ts',
};

/**
 * JSON data read through Vite like {@link SOURCE_MODULES}: the experiences of the Experiences
 * page, the projects of the Projects page, and the data of the CV ({@link CV_DATA_MODULE}).
 */
export const DATA_MODULES = {
  experiences: '/src/pages/Experiences/.data/experiences.json',
  personalProjects: '/src/pages/Projects/.data/personal-projects.json',
  freelanceProjects: '/src/pages/Projects/.data/freelance-projects.json',
  cv: CV_DATA_MODULE,
};

/**
 * Fonts of the theme that the CV uses, with their weights: the body font, in regular for the
 * texts, medium for the dates and bold for the titles.
 */
export const FONTS_IN_USE = [{ font: 'body', weights: ['regular', 'medium', 'bold'] }];

/**
 * Format of the font files that Google Fonts sends to a client it does not know as a browser,
 * such as Node.js: static TrueType files, one per weight. Chromium embeds them in the PDF as
 * TrueType fonts, whose text every reader can select and search, whereas it turns the variable
 * font that Google Fonts sends to browsers into Type 3 fonts, which Preview and Safari cannot.
 */
export const STATIC_FONT_FORMAT = 'truetype';

/** `src` descriptors of a CSS `@font-face` rule: its first group captures the format. */
export const FONT_FORMAT_PATTERN = /format\(['"]?([^'")]+)['"]?\)/g;

/** Type that pdf.js gives a Type 3 font, whose glyphs are drawings rather than a font file. */
export const TYPE3_FONT_TYPE = 'Type3';

/**
 * Prefix of six capital letters and a plus sign that a PDF writes before the name of a subset of
 * a font, e.g. `AAAAAA+Montserrat-Regular`.
 */
export const FONT_SUBSET_PREFIX_PATTERN = /^[A-Z]{6}\+/;

/** Spaces of any kind, which the text of a PDF breaks, joins or drops at the end of the lines. */
export const WHITESPACE_PATTERN = /\s+/g;

/** Length of the start of a missing text quoted in a problem of the PDF. */
export const QUOTED_TEXT_LENGTH = 60;

/** Separator of the company details and of the technologies, as on the Experiences page. */
export const DETAILS_SEPARATOR = ' · ';

/** Separator of the start and the end of a period, as on the Experiences page. */
export const PERIOD_SEPARATOR = ' — ';

/** Prefix of the URL of an email address. */
export const MAILTO_PREFIX = 'mailto:';

/** An email address: a name and a domain around a single `@`, without spaces. */
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+$/;

/** Schemes of the URLs that the CV writes as links. */
export const LINK_PROTOCOLS = new Set(['https:', 'http:', 'mailto:', 'tel:']);

/** Schemes of the web addresses, which the CV writes without them, e.g. `github.com/AIssoufi`. */
export const WEB_PROTOCOLS = new Set(['https:', 'http:']);

/** Start of the host of a URL that the CV leaves out of the text of a link. */
export const WWW_PREFIX = 'www.';

/** Slashes that end the path of a URL, which the CV leaves out of the text of a link. */
export const TRAILING_SLASHES_PATTERN = /\/+$/;

/**
 * Sizes and spacing of the printed CV. They are drawn for an A4 page read on paper, so they are
 * not tokens of the site, which sizes its screens in pixels: the colors, fonts, weights, line
 * heights and letter spacings come from the theme.
 */
export const CV_LAYOUT = {
  /** Margin of every page. */
  pageMargin: '13mm',
  /** Font size of the texts. */
  bodyFontSize: '8.6pt',
  /** Font size of the author's name. */
  nameFontSize: '22pt',
  /** Font size of the job title. */
  jobTitleFontSize: '12.5pt',
  /** Font size of the line about design and of the subtitle. */
  taglineFontSize: '9.5pt',
  /** Font size of the contact details. */
  contactFontSize: '8.4pt',
  /** Font size of the title of each section. */
  sectionTitleFontSize: '10pt',
  /** Font size of the name of a company and of the title of a role. */
  companyFontSize: '10pt',
  /** Font size of the dates, the technologies and the details. */
  detailsFontSize: '7.8pt',
  /** Space between the header and the first section. */
  headerMarginBottom: '4.5mm',
  /** Space above each section. */
  sectionMarginTop: '4mm',
  /** Space under the title of each section. */
  sectionTitleMarginBottom: '2.2mm',
  /** Thickness of the line under the header and under each section title. */
  ruleWidth: '0.6pt',
  /** Space between two companies. */
  companyGap: '3.2mm',
  /** Space between two roles, two projects or two entries. */
  itemGap: '1.8mm',
  /** Space between the title of a block and its text. */
  blockGap: '0.8mm',
  /** Indent of a project under its role, past its line. */
  projectIndent: '3mm',
  /** Thickness of the line on the left of a project. */
  projectRuleWidth: '1.2pt',
  /** Indent of a bullet point, past its bullet. */
  bulletIndent: '3.2mm',
  /** Space between two contact details. */
  contactGap: '3.5mm',
  /** Space between two columns. */
  columnGap: '6mm',
  /** Space between two projects of the Projects page. */
  entryGap: '0.6mm',
};
