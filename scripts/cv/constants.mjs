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
const CV_DATA_MODULE = '/scripts/cv/.data/cv.json';

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
 * URLs of the site, the default language, the helper that translates the keys of the JSON data,
 * the URL of the CV of each language and the LinkedIn profile. Paths are relative to the project
 * root.
 */
export const SOURCE_MODULES = {
  theme: '/src/theme/theme.ts',
  pages: '/src/utils/pages.ts',
  i18nConstants: '/src/i18n/constants.ts',
  i18nUtils: '/src/i18n/utils.ts',
  cvLink: '/src/App/Header/NavMenu/CvLink/constants.ts',
  profiles: '/src/constants/profiles.ts',
};

/**
 * JSON data read through Vite like {@link SOURCE_MODULES}: the experiences of the Experiences
 * page and the data of the CV ({@link CV_DATA_MODULE}).
 */
export const DATA_MODULES = {
  experiences: '/src/pages/Experiences/.data/experiences.json',
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

/**
 * File of each icon of the contact details, relative to the project root, by its name: a
 * monochrome drawing in the color of its text, drawn for the CV, but the LinkedIn logo, which the
 * menu of the site shows too.
 */
export const CV_ICON_FILES = {
  email: 'scripts/cv/icons/email.svg',
  phone: 'scripts/cv/icons/phone.svg',
  location: 'scripts/cv/icons/location.svg',
  site: 'scripts/cv/icons/site.svg',
  linkedin: 'src/App/Header/NavMenu/ProfileLinks/icons/linkedin.svg',
};

/** Format of the font files of {@link CV_FONT_FILES}, in the `src` of their `@font-face` rules. */
export const FONT_FORMAT = 'truetype';

/** Font of the theme that the CV uses, in each weight of {@link CV_FONT_FILES}. */
export const FONTS_IN_USE = [{ font: 'body', weights: Object.keys(CV_FONT_FILES) }];

/**
 * Scale of the images of the pages that `pnpm cv:audit` draws, to the size of the page in CSS
 * pixels: an A4 page gives 1,191 by 1,684 pixels, sharp enough to read its smallest text.
 */
export const AUDIT_PAGE_SCALE = 2;

/** Name of the file of the text of the CVs that `pnpm cv:audit` writes in its folder. */
export const AUDIT_TEXT_FILE = 'cv-text.md';

/** Argument of `pnpm cv` that prints and checks the CVs without writing any file. */
export const CHECK_ONLY_FLAG = '--check';

/** Spaces of any kind, which the text of a PDF breaks, joins or drops at the end of the lines. */
export const WHITESPACE_PATTERN = /\s+/g;

/**
 * Characters other than letters and digits, which a search for a keyword reads as the spaces
 * between words, e.g. the dot of `Node.js`.
 */
export const NON_WORD_CHARACTERS_PATTERN = /[^\p{L}\p{N}]+/gu;

/** Length of the start of a missing text quoted in a problem of the PDF. */
export const QUOTED_TEXT_LENGTH = 60;

/**
 * Separator of the company details, of the technologies and of the names of the projects, the dot
 * of the Experiences page. Its no-break space keeps the dot at the end of a line, never at the
 * start of the next.
 */
export const DETAILS_SEPARATOR = '\u00a0· ';

/**
 * Separator of the skills of a category, a comma as a sentence lists terms, which a screening tool
 * reads as separate terms.
 */
export const SKILLS_SEPARATOR = ', ';

/**
 * Separator of the start and the end of a period, an en dash as on the Experiences page
 * (`INLINE_PERIOD_MARK`) and in the years of the education.
 */
export const PERIOD_SEPARATOR = ' – ';

/**
 * The em dash, which no text of the CV may hold: the site owner keeps it out of every text that
 * a visitor reads, since it makes a text look written by an AI.
 */
export const EM_DASH = '\u2014';

/**
 * Sizes and spacing of the printed CV. They are drawn for an A4 page read on paper, so they are
 * not tokens of the site, which sizes its screens in pixels: the colors, fonts, weights, line
 * heights and letter spacings come from the theme.
 */
export const CV_LAYOUT = {
  /** Margin of every page. */
  pageMargin: '10mm',
  /** Font size of the texts. */
  bodyFontSize: '9.5pt',
  /** Font size of the author's name. */
  nameFontSize: '22pt',
  /** Font size of the job title and of the line about design that follows it. */
  jobTitleFontSize: '13pt',
  /** Font size of the contact details. */
  contactFontSize: '9pt',
  /** Font size of the title of each section. */
  sectionTitleFontSize: '10.5pt',
  /** Font size of the name of a company. */
  companyFontSize: '11pt',
  /** Font size of the title of a role, and of a degree. */
  roleFontSize: '10pt',
  /** Font size of the dates, the technologies and the details. */
  detailsFontSize: '8.5pt',
  /** Space between the header and the first section. */
  headerMarginBottom: '3.5mm',
  /** Space above each section. */
  sectionMarginTop: '3.5mm',
  /** Space under the title of each section. */
  sectionTitleMarginBottom: '2mm',
  /** Thickness of the line under the header and under each section title. */
  ruleWidth: '0.6pt',
  /** Space between two companies. */
  companyGap: '3mm',
  /** Space between two roles, two projects or two degrees. */
  itemGap: '1.5mm',
  /** Space between the title of a block and its text. */
  blockGap: '0.6mm',
  /** Indent of a project under its role, past its line. */
  projectIndent: '3mm',
  /** Thickness of the line on the left of a project. */
  projectRuleWidth: '1.2pt',
  /** Indent of a bullet point, past its mark. */
  bulletIndent: '3mm',
  /**
   * Side of the square whose two borders draw the mark of a bullet point, a chevron like the "›"
   * of the Experiences page (`BulletItem`, in
   * `src/pages/Experiences/CompanyEntry/RoleDescription/BulletPoints/BulletPoints.styled.ts`).
   */
  bulletMarkSize: '1.2mm',
  /** Thickness of the strokes of the mark of a bullet point. */
  bulletMarkWidth: '0.9pt',
  /** Height of the bottom of the mark of a bullet point above the baseline of its text. */
  bulletMarkRaise: '0.12em',
  /** Space between two contact details. */
  contactGap: '3.5mm',
  /** Side of the icon before a contact detail. */
  contactIconSize: '1.1em',
  /** Space between the icon of a contact detail and its text. */
  contactIconGap: '1.2mm',
};
