// @ts-check
// Generates the CV of each language, a PDF of public/ (`CV_URLS` of
// src/App/Header/CvLink/constants.ts), from the content of the site in that language: the name and
// the job title of the home page, the experiences of the Experiences page, the projects of the
// Projects page, and the contact details, the skills and the education of scripts/cv/.data/cv.json,
// which the site does not show. Run `pnpm cv` after changing one of them, then commit the PDFs and
// the fingerprints of their content (scripts/cv/fingerprints.json): scripts/cv/cvs.spec.js fails
// while a CV no longer says what the site says. Chromium, from Playwright, prints each CV, in the
// fonts and colors of the site. It needs the network, for the Google Fonts of the site.
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { chromium } from '@playwright/test';

import { checkFontsLoaded } from '../utils/browser.mjs';
import { INDEX_HTML_FILE, PUBLIC_DIR, TRANSLATION_MODULES } from '../utils/constants.mjs';
import { getFirstFontFamily, listFontsInUse } from '../utils/fonts.mjs';
import { findFontStylesheetUrl, hasUnresolvedValue } from '../utils/html.mjs';
import { loadSiteModules } from '../utils/site-modules.mjs';
import {
  CV_FINGERPRINTS_FILE,
  CV_MAX_BYTES,
  CV_MAX_PAGES,
  DATA_MODULES,
  FONTS_IN_USE,
  SOURCE_MODULES,
} from './constants.mjs';
import { getCvFingerprint } from './utils/fingerprint.mjs';
import { hasOnlyStaticFonts } from './utils/fonts.mjs';
import { buildCvContents } from './utils/languages.mjs';
import { findPdfProblems, readPdf } from './utils/pdf.mjs';
import { renderCvHtml, renderCvStyles } from './utils/template.mjs';
import { findMissingCvTexts, listCvLinks, listCvTexts } from './utils/texts.mjs';

/**
 * Downloads the style sheet of the Google Fonts of the site. Google Fonts sends static TrueType
 * files to a client it does not know as a browser, as Node.js, which Chromium embeds in the PDF
 * as TrueType fonts, whose text every reader can select.
 * @param {string} url - Google Fonts style sheet of `index.html`.
 * @returns {Promise<string>} Its `@font-face` rules.
 * @throws {Error} When the network is down, or the style sheet holds other files.
 */
const fetchStaticFontFaces = async url => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Google Fonts answered ${response.status} for ${url}`);

  const css = await response.text();
  if (!hasOnlyStaticFonts(css)) {
    throw new Error(`Google Fonts sent other files than static TrueType ones: ${url}`);
  }
  return css;
};

/**
 * Parameters of {@link printPdf}.
 * @typedef {object} PrintPdfParams
 * @property {string} html - Page to print, from `renderCvHtml`.
 * @property {string[]} fonts - CSS fonts the page must load before it is printed, from
 * `listFontsInUse`.
 */

/**
 * Prints the page in Chromium as an A4 PDF, once its fonts are loaded: tagged, so that screen
 * readers and applicant tracking systems read it in order, with its texts selectable and its
 * links clickable.
 * @param {PrintPdfParams} params
 * @returns {Promise<Buffer>} The PDF file.
 * @throws {Error} When a font did not load, as when the network is down.
 */
const printPdf = async ({ html, fonts }) => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle' });
    await checkFontsLoaded({ page, fonts });

    return await page.pdf({ preferCSSPageSize: true, printBackground: true, tagged: true });
  } finally {
    await browser.close();
  }
};

const { sources, data, translations } = await loadSiteModules({
  sources: SOURCE_MODULES,
  data: DATA_MODULES,
  translations: TRANSLATION_MODULES,
});
const { theme } = sources.theme;
const { LANGUAGES, DEFAULT_LANGUAGE } = sources.i18nConstants;
/** @type {Record<string, string>} */
const cvUrls = sources.cvLink.CV_URLS;

const contents = await buildCvContents({
  languages: LANGUAGES,
  defaultLanguage: DEFAULT_LANGUAGE,
  // Each module of translations exports them under the code of its language
  translations: Object.fromEntries(
    Object.entries(translations).map(([language, module]) => [language, module[language]]),
  ),
  translateKey: sources.i18nUtils.translateKey,
  translateProjects: sources.projectUtils.translateProjects,
  getPageUrl: sources.pages.getPageUrl,
  homePath: sources.pages.HOME_PAGE.path,
  siteUrl: sources.pages.SITE_URL,
  gitHubUrl: sources.gitHubLink.GITHUB_PROFILE_URL,
  cvData: data.cv.default,
  experiences: data.experiences.default,
  personalProjects: data.personalProjects.default,
  freelanceProjects: data.freelanceProjects.default,
});
contents.forEach(content => {
  const missingTexts = findMissingCvTexts(content);
  if (missingTexts.length > 0) {
    throw new Error(`Texts missing from the ${content.language} CV: ${missingTexts.join(', ')}`);
  }
});

const styles = renderCvStyles(theme);
// The theme is read untyped: a renamed token shows as undefined
if (hasUnresolvedValue(styles)) throw new Error('A design token of the CV is missing');

const fontStylesheetUrl = findFontStylesheetUrl(readFileSync(INDEX_HTML_FILE, 'utf-8'));
if (!fontStylesheetUrl) throw new Error(`No Google Fonts style sheet in ${INDEX_HTML_FILE}`);
const fontFaces = await fetchStaticFontFaces(fontStylesheetUrl);
const fonts = listFontsInUse({ theme, fontsInUse: FONTS_IN_USE });

/** @type {{ fileName: string, file: Buffer }[]} */
const files = [];
// One after the other, so that only one Chromium runs at a time
for (const content of contents) {
  const fileName = join(PUBLIC_DIR, cvUrls[content.language]);
  const file = await printPdf({ html: renderCvHtml({ content, styles, fontFaces }), fonts });
  const problems = findPdfProblems({
    pdf: await readPdf(file),
    byteCount: file.length,
    maxBytes: CV_MAX_BYTES,
    maxPages: CV_MAX_PAGES,
    texts: listCvTexts(content),
    links: listCvLinks(content),
    fontFamily: getFirstFontFamily(theme.fonts.body),
  });
  if (problems.length > 0) {
    throw new Error(`${fileName} would be wrong:\n- ${problems.join('\n- ')}`);
  }
  files.push({ fileName, file });
}

// Written once every CV is printed and checked, so a failure leaves none of them changed
files.forEach(({ fileName, file }) => {
  writeFileSync(fileName, file);
  console.log(`Wrote ${fileName}: ${file.length} bytes (limit ${CV_MAX_BYTES})`);
});
const fingerprints = Object.fromEntries(
  contents.map(content => [content.language, getCvFingerprint(content)]),
);
writeFileSync(CV_FINGERPRINTS_FILE, `${JSON.stringify(fingerprints, null, 2)}\n`);
console.log(`Wrote ${CV_FINGERPRINTS_FILE}`);
