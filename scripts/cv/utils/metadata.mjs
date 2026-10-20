// @ts-check
import {
  PDF_INFO_REFERENCE_PATTERN,
  PDF_KEYWORDS_SEPARATOR,
  PDF_ROOT_PATTERN,
  PDF_SIZE_PATTERN,
  PDF_TRAILER_KEYWORD,
  PDF_TRAILER_PATTERN,
  UTF16_BYTE_ORDER_MARK,
  XREF_GENERATION_DIGITS,
  XREF_OFFSET_DIGITS,
} from '../constants.mjs';

/** @typedef {import('./types.mjs').CvContent} CvContent */

/**
 * Writes a text as a text string of a PDF: in UTF-16BE after its byte order mark, in
 * hexadecimal, which every reader decodes whatever its characters, and which needs no escape.
 * @param {string} text - Text to write.
 * @returns {string} The string, e.g. `<FEFF00E9>` for `é`.
 */
const toPdfTextString = text => {
  const bytes = Buffer.from(text, 'utf16le').swap16();
  return `<${UTF16_BYTE_ORDER_MARK}${bytes.toString('hex').toUpperCase()}>`;
};

/**
 * Parameters of {@link padNumber}.
 * @typedef {object} PadNumberParams
 * @property {number | string} value - Number to write.
 * @property {number} digits - Digits to write.
 */

/**
 * Writes a number with zeros before it, as a cross-reference table of a PDF does.
 * @param {PadNumberParams} params
 * @returns {string} The number, e.g. `0000075353` for 75353 on 10 digits.
 */
const padNumber = ({ value, digits }) => String(value).padStart(digits, '0');

/**
 * Lists the document information of the CV that Chromium does not write, which PDF readers show
 * and recruiting tools index: its author, its subject and its keywords. Chromium writes its title,
 * from the `<title>` of the page.
 * @param {CvContent} content - Content of the CV, from `buildCvContent`.
 * @returns {Record<string, string>} The entries, by their key in the PDF.
 * @example
 * buildPdfInfo(content);
 * // { Author: 'ADAM Issoufi', Subject: 'CV of a senior frontend engineer…', Keywords: 'React, …' }
 */
export const buildPdfInfo = content => ({
  Author: content.name,
  Subject: content.subject,
  Keywords: content.keywords.join(PDF_KEYWORDS_SEPARATOR),
});

/**
 * Lists the document information that the PDF of the CV holds once printed and completed by
 * {@link addPdfInfo}: the title that Chromium writes from the `<title>` of the page, then the
 * entries of {@link buildPdfInfo}, so that a check can find each one in the PDF.
 * @param {CvContent} content - Content of the CV, from `buildCvContent`.
 * @returns {Record<string, string>} The entries, by their key in the PDF.
 * @example
 * listCvPdfInfo(content).Title; // 'CV - ADAM Issoufi - Développeur full-stack JavaScript'
 */
export const listCvPdfInfo = content => ({ Title: content.title, ...buildPdfInfo(content) });

/**
 * What the last trailer of a PDF names, as written in the PDF.
 * @typedef {object} PdfTrailer
 * @property {string} size - Number of entries of the cross-reference of the PDF, e.g. `15`.
 * @property {string} root - Reference of its catalog, e.g. `1 0 R`.
 * @property {string} objectNumber - Number of the object of its information dictionary.
 * @property {string} generation - Generation of that object, e.g. `0`.
 * @property {string} previousXrefOffset - Offset of the cross-reference table that the trailer
 * closes, which an incremental update points back to.
 */

/**
 * Reads the last trailer of a PDF, the one that readers follow.
 * @param {string} text - Content of the PDF, read as latin1.
 * @returns {PdfTrailer} What the trailer names.
 * @throws {Error} When the PDF has no classic trailer that names its root and its information
 * dictionary, as one with a cross-reference stream.
 */
const readPdfTrailer = text => {
  // Without a trailer, the slice holds the last character alone, which the pattern never matches
  const lastTrailer = text.slice(text.lastIndexOf(PDF_TRAILER_KEYWORD));
  const [, trailer = '', previousXrefOffset = ''] = lastTrailer.match(PDF_TRAILER_PATTERN) ?? [];
  const size = trailer.match(PDF_SIZE_PATTERN)?.[1];
  const root = trailer.match(PDF_ROOT_PATTERN)?.[1];
  const [, objectNumber, generation] = trailer.match(PDF_INFO_REFERENCE_PATTERN) ?? [];
  const isTrailerComplete = !!size && !!root && !!objectNumber && !!generation;
  if (!isTrailerComplete) {
    throw new Error('The PDF has no classic trailer that names its root and its information');
  }

  return { size, root, objectNumber, generation, previousXrefOffset };
};

/**
 * Parameters of {@link findInfoDictionary}.
 * @typedef {object} FindInfoDictionaryParams
 * @property {string} text - Content of the PDF, read as latin1.
 * @property {string} objectNumber - Number of the object of the dictionary, from its trailer.
 * @property {string} generation - Generation of that object, from its trailer.
 */

/**
 * Finds the entries of the information dictionary of a PDF, in the last version of its object,
 * should the PDF already have an incremental update.
 * @param {FindInfoDictionaryParams} params
 * @returns {string} The entries, between the `<<` and the `>>` of the dictionary.
 * @throws {Error} When the PDF lacks that object.
 */
const findInfoDictionary = ({ text, objectNumber, generation }) => {
  const objectPattern = new RegExp(
    `(?<!\\d)${objectNumber} ${generation} obj\\s*<<([\\s\\S]*?)>>\\s*endobj`,
    'g',
  );
  const dictionary = [...text.matchAll(objectPattern)].at(-1)?.[1];
  if (dictionary === undefined) {
    throw new Error(`The PDF lacks its information dictionary, ${objectNumber} ${generation} obj`);
  }

  return dictionary;
};

/**
 * Parameters of {@link addPdfInfo}.
 * @typedef {object} AddPdfInfoParams
 * @property {Uint8Array} pdf - Content of a PDF file with a classic cross-reference table, as
 * Chromium prints it.
 * @property {Record<string, string>} info - Entries to add to its document information, by their
 * key, from {@link buildPdfInfo}. An empty text adds nothing.
 */

/**
 * Adds entries to the document information of a PDF, as a PDF editor saves a change: the bytes of
 * the PDF stay, and an incremental update after them gives a new version of its information
 * dictionary, the entries it held then the new ones, with the cross-reference and the trailer that
 * point readers to it.
 * @param {AddPdfInfoParams} params
 * @returns {Buffer} The PDF with the entries, or the same bytes when there is none to add.
 * @throws {Error} When the PDF has no classic trailer that names its root and its information
 * dictionary, as one with a cross-reference stream, when it lacks that dictionary, or when the
 * dictionary already holds one of the entries.
 * @example
 * const pdf = addPdfInfo({ pdf: await page.pdf(), info: buildPdfInfo(content) });
 */
export const addPdfInfo = ({ pdf, info }) => {
  const entries = Object.entries(info).filter(([, value]) => value !== '');
  if (entries.length === 0) return Buffer.from(pdf);

  const text = Buffer.from(pdf).toString('latin1');
  const { size, root, objectNumber, generation, previousXrefOffset } = readPdfTrailer(text);
  const dictionary = findInfoDictionary({ text, objectNumber, generation });
  /** @param {[string, string]} entry */
  const isAlreadyHeld = ([key]) => new RegExp(`/${key}(?![A-Za-z])`).test(dictionary);
  const heldKeys = entries.filter(isAlreadyHeld).map(([key]) => key);
  if (heldKeys.length > 0) {
    throw new Error(`The information of the PDF already holds ${heldKeys.join(', ')}`);
  }

  const newEntries = entries.map(([key, value]) => `/${key} ${toPdfTextString(value)}`);
  const separator = text.endsWith('\n') ? '' : '\n';
  const objectOffset = text.length + separator.length;
  const object = [
    `${objectNumber} ${generation} obj\n`,
    `<<${dictionary}\n${newEntries.join('\n')}\n>>\n`,
    'endobj\n',
  ].join('');
  const xrefOffset = objectOffset + object.length;
  const paddedOffset = padNumber({ value: objectOffset, digits: XREF_OFFSET_DIGITS });
  const paddedGeneration = padNumber({ value: generation, digits: XREF_GENERATION_DIGITS });
  const update = [
    separator,
    object,
    `xref\n${objectNumber} 1\n${paddedOffset} ${paddedGeneration} n \n`,
    `trailer\n<</Size ${size}\n/Root ${root}\n/Info ${objectNumber} ${generation} R\n`,
    `/Prev ${previousXrefOffset}>>\nstartxref\n${xrefOffset}\n%%EOF\n`,
  ].join('');

  return Buffer.concat([Buffer.from(pdf), Buffer.from(update, 'latin1')]);
};
