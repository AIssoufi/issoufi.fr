// @ts-check
import { getDocument, OPS, VerbosityLevel } from 'pdfjs-dist/legacy/build/pdf.mjs';

import {
  FONT_SUBSET_PREFIX_PATTERN,
  QUOTED_TEXT_LENGTH,
  TYPE3_FONT_TYPE,
  WHITESPACE_PATTERN,
} from '../constants.mjs';

/**
 * A font of a PDF, as pdf.js reads it.
 * @typedef {object} PdfFont
 * @property {string} name - Name of the font, e.g. `AAAAAA+Montserrat-Regular`.
 * @property {string} type - Type of the font, e.g. `CIDFontType2` or `Type3`.
 */

/**
 * What a PDF holds, as pdf.js reads it, the library of the PDF reader of Firefox.
 * @typedef {object} PdfSummary
 * @property {number} pageCount - Number of pages.
 * @property {string} text - Text of every page, as a reader extracts it to select or search it.
 * @property {string[]} links - URL of every link, in the order of the pages.
 * @property {PdfFont[]} fonts - Fonts that draw the text, each one once.
 */

/**
 * Reads the text, the links and the fonts of a PDF with pdf.js, as a PDF reader does to select,
 * search and open them.
 * @param {Uint8Array} data - Content of the PDF file.
 * @returns {Promise<PdfSummary>} What the PDF holds.
 * @throws {Error} When the data is not a PDF.
 * @example
 * const { pageCount, text } = await readPdf(readFileSync('public/CV - Adam Issoufi.pdf'));
 */
export const readPdf = async data => {
  const loadingTask = getDocument({
    // pdf.js takes the buffer it reads: a copy leaves the caller's one untouched
    data: new Uint8Array(data),
    // Gives the type of each font, to find the Type 3 ones
    fontExtraProperties: true,
    useSystemFonts: false,
    // Its warnings, such as a standard font it does not draw, say nothing about the text
    verbosity: VerbosityLevel.ERRORS,
  });

  try {
    const document = await loadingTask.promise;
    const texts = [];
    const links = [];
    /** @type {Map<string, PdfFont>} */
    const fonts = new Map();
    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      const page = await document.getPage(pageNumber);
      const { items } = await page.getTextContent();
      texts.push(items.map(item => ('str' in item ? item.str : '')).join(' '));

      const annotations = await page.getAnnotations();
      links.push(...annotations.map(({ url }) => url).filter(url => typeof url === 'string'));

      const { fnArray, argsArray } = await page.getOperatorList();
      fnArray.forEach((operator, index) => {
        if (operator !== OPS.setFont) return;

        const [fontId] = argsArray[index];
        const { name = '', type = '' } = page.commonObjs.get(fontId);
        fonts.set(fontId, { name, type });
      });
    }
    return {
      pageCount: document.numPages,
      text: texts.join(' '),
      links,
      fonts: [...fonts.values()],
    };
  } finally {
    // Stops the worker of pdf.js, which would keep Node.js running
    await loadingTask.destroy();
  }
};

/**
 * Prepares a text for a search in the text of a PDF: a reader joins the lines of a paragraph
 * with a space or with nothing, and writes ligatures and spaces in its own way, and a title
 * written in capitals by its style holds capitals, so the search compares the letters alone.
 * @param {string} text - Text to prepare.
 * @returns {string} The text in the Unicode NFKC form, in lower case, without any space.
 */
const toSearchableText = text =>
  text.normalize('NFKC').toLowerCase().replace(WHITESPACE_PATTERN, '');

/**
 * Writes the start of a text in a problem, so a long paragraph stays readable.
 * @param {string} text - Text to quote.
 * @returns {string} The text, cut after {@link QUOTED_TEXT_LENGTH} characters.
 */
const quote = text =>
  text.length > QUOTED_TEXT_LENGTH ? `${text.slice(0, QUOTED_TEXT_LENGTH)}…` : text;

/**
 * Parameters of {@link findPdfProblems}.
 * @typedef {object} FindPdfProblemsParams
 * @property {PdfSummary} pdf - What the PDF holds, from {@link readPdf}.
 * @property {number} byteCount - Size of the PDF file, in bytes.
 * @property {number} maxBytes - Largest size allowed, in bytes.
 * @property {number} maxPages - Most pages allowed.
 * @property {string[]} texts - Texts the PDF must hold, from `listCvTexts`.
 * @property {string[]} links - URLs the PDF must link to, from `listCvLinks`.
 * @property {string} fontFamily - Family of every font of the PDF, e.g. `Montserrat`: another one
 * means that the browser drew some characters in a fallback font.
 */

/**
 * Lists what is wrong with a generated CV: too heavy or too long, a Type 3 font, whose text
 * Preview and Safari can neither select nor search, a font other than the one of the site, or a
 * text or a link of the site that the PDF lacks.
 * @param {FindPdfProblemsParams} params
 * @returns {string[]} One sentence per problem, none when the PDF is right.
 * @example
 * findPdfProblems({ pdf, byteCount, maxBytes: 500_000, maxPages: 2, texts, links, fontFamily });
 * // ['the font AAAAAA+Montserrat-Regular is a Type 3 font, whose text Preview cannot select']
 */
export const findPdfProblems = ({
  pdf,
  byteCount,
  maxBytes,
  maxPages,
  texts,
  links,
  fontFamily,
}) => {
  const searchableText = toSearchableText(pdf.text);
  const family = toSearchableText(fontFamily);
  const isTooHeavy = byteCount > maxBytes;
  const isPageCountWrong = pdf.pageCount < 1 || pdf.pageCount > maxPages;
  const hasNoFont = pdf.fonts.length === 0;
  /** @param {PdfFont} font */
  const isOtherFamily = ({ name }) =>
    !toSearchableText(name.replace(FONT_SUBSET_PREFIX_PATTERN, '')).startsWith(family);
  /** @param {string} text */
  const isMissingText = text => !searchableText.includes(toSearchableText(text));
  /** @param {string} link */
  const isMissingLink = link => !pdf.links.includes(link);

  return [
    ...(isTooHeavy ? [`it weighs ${byteCount} bytes, over ${maxBytes}`] : []),
    ...(isPageCountWrong ? [`it has ${pdf.pageCount} pages, out of 1 to ${maxPages}`] : []),
    ...(hasNoFont ? ['it has no font, so no text'] : []),
    ...pdf.fonts
      .filter(({ type }) => type === TYPE3_FONT_TYPE)
      .map(({ name }) => `the font ${name} is a Type 3 font, whose text Preview cannot select`),
    ...pdf.fonts
      .filter(isOtherFamily)
      .map(({ name }) => `the font ${name} is not ${fontFamily}, the font of the site`),
    ...texts.filter(isMissingText).map(text => `the text "${quote(text)}" is missing`),
    ...links.filter(isMissingLink).map(link => `the link ${link} is missing`),
  ];
};
