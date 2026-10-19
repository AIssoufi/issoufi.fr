// @ts-check

/**
 * Largest size of each CV, in bytes. In October 2026, the French CV weighed 76.2 kB and the
 * English one 75.4 kB, down from 274.9 kB for the CV exported from Figma.
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
  cvLink: '/src/App/Header/NavMenu/CvLink/constants.ts',
  profileLinks: '/src/App/Header/NavMenu/ProfileLinks/constants.ts',
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
 * Folder of the font files of the CV, relative to the project root: static instances of the body
 * font of the site, with their license and their source in its README. They are outside
 * `public/`, so the site does not serve them.
 */
export const CV_FONTS_DIR = 'scripts/cv/fonts';

/**
 * File of each weight of the body font that the CV uses, in {@link CV_FONTS_DIR}, by the name of
 * the weight in the theme: regular for the texts, medium for the dates and bold for the titles.
 * They are static TrueType files, which Chromium embeds in the PDF as TrueType fonts, whose text
 * every reader can select and search: it would turn the variable font of the site into Type 3
 * fonts, which Preview and Safari cannot.
 */
export const CV_FONT_FILES = {
  regular: 'Montserrat-Regular.ttf',
  medium: 'Montserrat-Medium.ttf',
  bold: 'Montserrat-Bold.ttf',
};

/** Format of the font files of {@link CV_FONT_FILES}, in the `src` of their `@font-face` rules. */
export const FONT_FORMAT = 'truetype';

/** Font of the theme that the CV uses, in each weight of {@link CV_FONT_FILES}. */
export const FONTS_IN_USE = [{ font: 'body', weights: Object.keys(CV_FONT_FILES) }];

/** Type that pdf.js gives a Type 3 font, whose glyphs are drawings rather than a font file. */
export const TYPE3_FONT_TYPE = 'Type3';

/**
 * Prefix of six capital letters and a plus sign that a PDF writes before the name of a subset of
 * a font, e.g. `AAAAAA+Montserrat-Regular`.
 */
export const FONT_SUBSET_PREFIX_PATTERN = /^[A-Z]{6}\+/;

/**
 * Creation and modification dates of a PDF, with the key that names each one in its information
 * dictionary, e.g. `/CreationDate (D:20261019034028+00'00')`: Chromium writes the time of the
 * print, the only bytes that change when it prints the same page again.
 */
export const PDF_DATE_PATTERN = /(\/(?:CreationDate|ModDate)\s*)\((?:[^()\\]|\\.)*\)/g;

/** Argument of `pnpm cv` that prints and checks the CVs without writing any file. */
export const CHECK_ONLY_FLAG = '--check';

/** Spaces of any kind, which the text of a PDF breaks, joins or drops at the end of the lines. */
export const WHITESPACE_PATTERN = /\s+/g;

/** Length of the start of a missing text quoted in a problem of the PDF. */
export const QUOTED_TEXT_LENGTH = 60;

/** Separator of the company details and of the technologies, as on the Experiences page. */
export const DETAILS_SEPARATOR = ' · ';

/** Separator of the start and the end of a period, as on the Experiences page. */
export const PERIOD_SEPARATOR = ' — ';

/**
 * Mark before each bullet point, as on the Experiences page (`BulletItem`, in
 * `src/pages/Experiences/CompanyEntry/RoleDescription/BulletPoints/BulletPoints.styled.ts`).
 */
export const BULLET_MARK = '›';

/** Prefix of the URL of an email address. */
export const MAILTO_PREFIX = 'mailto:';

/** Prefix of the URL of a phone number. */
export const TEL_PREFIX = 'tel:';

/** An email address: a name and a domain around a single `@`, without spaces. */
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+$/;

/** Schemes of the web addresses, which the CV writes without them, e.g. `github.com/AIssoufi`. */
export const WEB_PROTOCOLS = new Set(['https:', 'http:']);

/** Schemes of the URLs that the CV writes as links: web addresses, email and phone. */
export const LINK_PROTOCOLS = new Set([...WEB_PROTOCOLS, MAILTO_PREFIX, TEL_PREFIX]);

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
  /** Indent of a bullet point, past its mark. */
  bulletIndent: '3mm',
  /** Space between two contact details. */
  contactGap: '3.5mm',
  /** Space between two columns. */
  columnGap: '6mm',
  /** Space between two projects of the Projects page. */
  entryGap: '0.6mm',
};
