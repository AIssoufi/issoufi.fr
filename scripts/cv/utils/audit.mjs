// @ts-check
import { getDocument, VerbosityLevel } from 'pdfjs-dist/legacy/build/pdf.mjs';

import { DESCRIPTIVE_INFO_KEYS } from './constants.mjs';

/** @typedef {import('./pdf.mjs').PdfSummary} PdfSummary */

/**
 * Parameters of {@link formatPdfText}.
 * @typedef {object} FormatPdfTextParams
 * @property {string} fileName - Path of the PDF, which heads its text.
 * @property {PdfSummary} pdf - What the PDF holds, from `readPdf`.
 */

/**
 * Writes what an applicant tracking system or an AI screening agent reads of a PDF, the input of
 * the audit of `docs/cv-audit.md`: the entries of its document information that describe it, then
 * the text of each page, line by line, under its number.
 * @param {FormatPdfTextParams} params
 * @returns {string} The text, in Markdown.
 * @example
 * formatPdfText({ fileName: 'public/CV.pdf', pdf: await readPdf(file) });
 * // '# public/CV.pdf\n\nTitle: CV - ADAM Issoufi - …\n…\n\n## Page 1\n\nADAM Issoufi\n…'
 */
export const formatPdfText = ({ fileName, pdf }) => {
  const info = DESCRIPTIVE_INFO_KEYS.filter(key => key in pdf.info).map(
    key => `${key}: ${pdf.info[key]}`,
  );
  const pages = pdf.pages.map((text, index) => `## Page ${index + 1}\n\n${text}`);

  return [`# ${fileName}`, ...(info.length > 0 ? [info.join('\n')] : []), ...pages].join('\n\n');
};

/**
 * Parameters of {@link renderPdfPages}.
 * @typedef {object} RenderPdfPagesParams
 * @property {Uint8Array} data - Content of the PDF file.
 * @property {number} scale - Size of the images, to the size of the pages in CSS pixels.
 */

/**
 * A canvas of `@napi-rs/canvas`, which pdf.js draws in under Node.js.
 * @typedef {HTMLCanvasElement & { toBuffer: (type: 'image/png') => Buffer }} NodeCanvas
 */

/**
 * The canvas factory of a document of pdf.js, which its types leave untyped.
 * @typedef {object} CanvasFactory
 * @property {(width: number, height: number) => { canvas: NodeCanvas }} create - Creates a
 * canvas of this size, in pixels.
 */

/**
 * Draws each page of a PDF as a PNG image with pdf.js, as a reader shows it, for the part of the
 * audit of `docs/cv-audit.md` that judges the design.
 * @param {RenderPdfPagesParams} params
 * @returns {Promise<Buffer[]>} The image of each page, in their order.
 * @throws {Error} When the data is not a PDF.
 * @example
 * const [firstPage] = await renderPdfPages({ data: readFileSync(file), scale: 2 });
 */
export const renderPdfPages = async ({ data, scale }) => {
  // pdf.js takes the buffer it reads: a copy leaves the caller's one untouched
  const loadingTask = getDocument({ data: new Uint8Array(data), verbosity: VerbosityLevel.ERRORS });

  try {
    const document = await loadingTask.promise;
    const images = [];
    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      const page = await document.getPage(pageNumber);
      const viewport = page.getViewport({ scale });
      const canvasFactory = /** @type {CanvasFactory} */ (document.canvasFactory);
      const { canvas } = canvasFactory.create(viewport.width, viewport.height);
      await page.render({ canvas, viewport }).promise;
      images.push(canvas.toBuffer('image/png'));
    }
    return images;
  } finally {
    // Stops the worker of pdf.js, which would keep Node.js running
    await loadingTask.destroy();
  }
};

/**
 * Parameters of {@link toPageImageName}.
 * @typedef {object} ToPageImageNameParams
 * @property {string} language - Language of the CV, e.g. `fr`.
 * @property {number} pageNumber - Number of the page, from 1.
 */

/**
 * Names the image of a page of a CV in the folder of an audit.
 * @param {ToPageImageNameParams} params
 * @returns {string} The file name, e.g. `cv-fr-page-1.png`.
 */
export const toPageImageName = ({ language, pageNumber }) =>
  `cv-${language}-page-${pageNumber}.png`;
