/** Object number of the first page of a PDF of {@link buildPdf}, after its catalog, pages, font. */
const FIRST_PAGE_ID = 4;

/** Objects of each page of a PDF of {@link buildPdf}: the page, its content and its link. */
const OBJECTS_PER_PAGE = 3;

/**
 * Writes a small PDF file, as Chromium does with a classic cross-reference table: one page per
 * entry of `pages`, each with its text in Helvetica and, when it has a URL, a link, and, when
 * `info` is given, an information dictionary holding these entries, which the trailer names.
 *
 * @param {object} params
 * @param {{ text: string, url?: string }[]} params.pages - Text and link of each page.
 * @param {string} [params.info] - Entries of the information dictionary, e.g. `/Title (CV)`.
 * @returns {Uint8Array} The PDF file.
 */
export const buildPdf = ({ pages, info }) => {
  const pageIds = pages.map((_page, index) => FIRST_PAGE_ID + index * OBJECTS_PER_PAGE);
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    `<< /Type /Pages /Kids [${pageIds.map(id => `${id} 0 R`).join(' ')}] /Count ${pages.length} >>`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    ...pages.flatMap(({ text, url }, index) => {
      const pageId = pageIds[index];
      const stream = `BT /F1 12 Tf 20 100 Td (${text}) Tj ET`;
      const annotations = url ? `/Annots [${pageId + 2} 0 R]` : '';
      return [
        `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 200] /Contents ${pageId + 1} 0 R /Resources << /Font << /F1 3 0 R >> >> ${annotations} >>`,
        `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
        `<< /Type /Annot /Subtype /Link /Rect [20 90 200 120] /A << /S /URI /URI (${url}) >> >>`,
      ];
    }),
    ...(info === undefined ? [] : [`<<${info}>>`]),
  ];
  const infoEntry = info === undefined ? '' : `\n/Info ${objects.length} 0 R`;

  let pdf = '%PDF-1.4\n';
  const offsets = objects.map((body, index) => {
    const offset = pdf.length;
    pdf += `${index + 1} 0 obj\n${body}\nendobj\n`;
    return offset;
  });
  const xrefOffset = pdf.length;
  const entries = offsets.map(offset => `${String(offset).padStart(10, '0')} 00000 n \n`);
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${entries.join('')}`;
  pdf += `trailer\n<</Size ${objects.length + 1}\n/Root 1 0 R${infoEntry}>>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  return new TextEncoder().encode(pdf);
};
