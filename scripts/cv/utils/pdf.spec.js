// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';

import { CV_URLS } from '../../../src/App/Header/NavMenu/CvLink/constants.ts';
import { PUBLIC_DIR } from '../../utils/constants.mjs';
import { EM_DASH } from '../constants.mjs';
import { findPdfProblems, isSamePdfApartFromDates, readPdf } from './pdf.mjs';

/**
 * Writes a small PDF file, one page per entry, each with its text in Helvetica and, when it has a
 * URL, a link.
 */
const buildPdf = pages => {
  const firstPageId = 4;
  const objectsPerPage = 3;
  const pageIds = pages.map((_page, index) => firstPageId + index * objectsPerPage);
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
  ];

  let pdf = '%PDF-1.4\n';
  const offsets = objects.map((body, index) => {
    const offset = pdf.length;
    pdf += `${index + 1} 0 obj\n${body}\nendobj\n`;
    return offset;
  });
  const xrefOffset = pdf.length;
  const entries = offsets.map(offset => `${String(offset).padStart(10, '0')} 00000 n \n`);
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${entries.join('')}`;
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  return new TextEncoder().encode(pdf);
};

describe('readPdf', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('reads the text, the links and the fonts of each page', async () => {
    const pdf = await readPdf(
      buildPdf([
        { text: 'ADAM Issoufi', url: 'mailto:adam@example.com' },
        { text: 'Experiences', url: 'https://issoufi.fr/' },
      ]),
    );

    expect(pdf).toEqual({
      pageCount: 2,
      text: 'ADAM Issoufi Experiences',
      links: ['mailto:adam@example.com', 'https://issoufi.fr/'],
      fonts: [{ name: 'Helvetica', type: 'Type1' }],
    });
  });

  it('finds no link on a page without one', async () => {
    const pdf = await readPdf(buildPdf([{ text: 'CV' }]));

    expect(pdf.links).toEqual([]);
  });

  it('leaves the data it reads untouched', async () => {
    const data = buildPdf([{ text: 'CV' }]);
    const copy = data.slice();

    await readPdf(data);

    expect(data).toEqual(copy);
  });

  it('leaves out the marked-content items of the text, which hold none', async () => {
    // pdf.js lists them only with `includeMarkedContent`: a spy on its page prototype adds them
    const loadingTask = getDocument({ data: buildPdf([{ text: 'CV' }]) });
    const pagePrototype = Object.getPrototypeOf(await (await loadingTask.promise).getPage(1));
    await loadingTask.destroy();
    const { getTextContent } = pagePrototype;
    vi.spyOn(pagePrototype, 'getTextContent').mockImplementation(async function (...args) {
      const content = await getTextContent.apply(this, args);
      const items = [
        { type: 'beginMarkedContentProps', tag: 'P', id: 'p1' },
        ...content.items,
        { type: 'endMarkedContent' },
      ];
      return { ...content, items };
    });

    const pdf = await readPdf(buildPdf([{ text: 'ADAM Issoufi' }, { text: 'Experiences' }]));

    expect(pdf.text).toBe('ADAM Issoufi Experiences');
  });

  it('fails on data that is not a PDF', async () => {
    await expect(readPdf(new TextEncoder().encode('not a PDF'))).rejects.toThrow();
  });
});

describe('findPdfProblems', () => {
  /** A right CV: one page, its texts and links, in Montserrat. */
  const PDF = {
    pageCount: 1,
    text: 'ADAM Issoufi Développeur full- stack JavaScript EXPÉRIENCES Mail',
    links: ['mailto:adam@example.com'],
    fonts: [
      { name: 'AAAAAA+Montserrat-Regular', type: 'CIDFontType2' },
      { name: 'BAAAAA+Montserrat-Bold', type: 'CIDFontType2' },
    ],
  };

  /** Parameters of a right CV. */
  const PARAMS = {
    pdf: PDF,
    byteCount: 100_000,
    maxBytes: 500_000,
    maxPages: 2,
    texts: ['ADAM Issoufi', 'Développeur full-stack JavaScript', 'Expériences'],
    links: ['mailto:adam@example.com'],
    fontFamily: 'Montserrat',
  };

  it('finds none in a right CV', () => {
    expect(findPdfProblems(PARAMS)).toEqual([]);
  });

  it('finds a text whatever the spaces, the line breaks and the case of the PDF', () => {
    const pdf = { ...PDF, text: 'ADAM Issoufi\nDéveloppeur  full-\nstack JavaScript expériences' };

    expect(findPdfProblems({ ...PARAMS, pdf })).toEqual([]);
  });

  it('finds a text that the PDF writes with a ligature', () => {
    const pdf = { ...PDF, text: 'ﬁchier' };

    expect(findPdfProblems({ ...PARAMS, pdf, texts: ['fichier'] })).toEqual([]);
  });

  it('reports a CV over the size limit, but not at it', () => {
    expect(findPdfProblems({ ...PARAMS, byteCount: 500_000 })).toEqual([]);
    expect(findPdfProblems({ ...PARAMS, byteCount: 500_001 })).toEqual([
      'it weighs 500001 bytes, over 500000',
    ]);
  });

  it.each([0, 3])('reports a CV of %i pages', pageCount => {
    expect(findPdfProblems({ ...PARAMS, pdf: { ...PDF, pageCount } })).toEqual([
      `it has ${pageCount} pages, out of 1 to 2`,
    ]);
  });

  it('accepts a CV of as many pages as allowed', () => {
    expect(findPdfProblems({ ...PARAMS, pdf: { ...PDF, pageCount: 2 } })).toEqual([]);
  });

  it('reports a Type 3 font, whose text Preview cannot select', () => {
    const fonts = [{ name: 'AAAAAA+Montserrat-Regular', type: 'Type3' }];

    expect(findPdfProblems({ ...PARAMS, pdf: { ...PDF, fonts } })).toEqual([
      'the font AAAAAA+Montserrat-Regular is a Type 3 font, whose text Preview cannot select',
    ]);
  });

  it('reports a font of another family, in which the browser drew missing characters', () => {
    const fonts = [...PDF.fonts, { name: 'CAAAAA+LucidaGrande', type: 'CIDFontType2' }];

    expect(findPdfProblems({ ...PARAMS, pdf: { ...PDF, fonts } })).toEqual([
      'the font CAAAAA+LucidaGrande is not Montserrat, the font of the site',
    ]);
  });

  it('accepts the font of the site with a family name of several words, and without subset', () => {
    const fonts = [{ name: 'SairaStencilOne-Regular', type: 'TrueType' }];

    expect(
      findPdfProblems({ ...PARAMS, pdf: { ...PDF, fonts }, fontFamily: 'Saira Stencil One' }),
    ).toEqual([]);
  });

  it('reports a PDF without font, which holds no text', () => {
    expect(findPdfProblems({ ...PARAMS, pdf: { ...PDF, fonts: [] } })).toContain(
      'it has no font, so no text',
    );
  });

  it('reports an em dash in the text', () => {
    const pdf = { ...PDF, text: `${PDF.text} oct. 2025 ${EM_DASH} sept. 2026` };

    expect(findPdfProblems({ ...PARAMS, pdf })).toEqual([
      'its text holds an em dash, which the site keeps out of its texts',
    ]);
  });

  it('accepts an en dash and a hyphen', () => {
    const pdf = { ...PDF, text: `${PDF.text} oct. 2025 – sept. 2026 full-stack` };

    expect(findPdfProblems({ ...PARAMS, pdf })).toEqual([]);
  });

  it('reports each missing text, quoting the start of a long one', () => {
    const longText =
      'Conception et évolution d’API de composants React robustes, documentées sous Storybook';

    expect(findPdfProblems({ ...PARAMS, texts: ['Sewan Groupe', longText] })).toEqual([
      'the text "Sewan Groupe" is missing',
      'the text "Conception et évolution d’API de composants React robustes, …" is missing',
    ]);
  });

  it('reports a text that the PDF reads before the one that precedes it on the page', () => {
    const pdf = { ...PDF, text: 'ADAM Issoufi EXPÉRIENCES Développeur full-stack JavaScript' };

    expect(findPdfProblems({ ...PARAMS, pdf })).toEqual([
      'the text "Expériences" comes before "Développeur full-stack JavaScript", not after it',
    ]);
  });

  it('reports a text that the PDF reads twice only once in its place', () => {
    const texts = ['React.js', 'Sewan Groupe', 'React.js', 'Vite'];
    const pdf = { ...PDF, text: 'React.js Sewan Groupe React.js · Vitest' };

    expect(findPdfProblems({ ...PARAMS, pdf, texts })).toEqual([]);
    expect(findPdfProblems({ ...PARAMS, pdf, texts: [...texts, 'React.js'] })).toEqual([
      'the text "React.js" comes before "Vite", not after it',
    ]);
  });

  it('reports a missing text as missing, not out of its place', () => {
    const texts = ['ADAM Issoufi', 'Sewan Groupe', 'Expériences'];

    expect(findPdfProblems({ ...PARAMS, texts })).toEqual(['the text "Sewan Groupe" is missing']);
  });

  it('skips a blank text, which every place of the PDF holds', () => {
    expect(findPdfProblems({ ...PARAMS, texts: ['ADAM Issoufi', ' ', 'Expériences'] })).toEqual([]);
    expect(findPdfProblems({ ...PARAMS, texts: ['Expériences', '', 'ADAM Issoufi'] })).toEqual([
      'the text "ADAM Issoufi" comes before "Expériences", not after it',
    ]);
  });

  it('reports each missing link', () => {
    expect(findPdfProblems({ ...PARAMS, links: ['https://github.com/AIssoufi'] })).toEqual([
      'the link https://github.com/AIssoufi is missing',
    ]);
  });

  it('finds every problem at once', () => {
    const pdf = { ...PDF, pageCount: 3, links: [] };

    expect(findPdfProblems({ ...PARAMS, pdf, byteCount: 600_000 })).toEqual([
      'it weighs 600000 bytes, over 500000',
      'it has 3 pages, out of 1 to 2',
      'the link mailto:adam@example.com is missing',
    ]);
  });
});

describe('isSamePdfApartFromDates', () => {
  /** Writes the bytes of a PDF whose information dictionary holds these entries. */
  const encodeInfo = info => new TextEncoder().encode(`%PDF-1.4\n1 0 obj\n<< ${info} >>\nendobj\n`);
  const INFO =
    "/Creator (Chromium) /CreationDate (D:20261018172454+00'00') /ModDate (D:20261018172454+00'00')";
  const PDF = encodeInfo(INFO);

  it('finds a PDF the same as itself', () => {
    expect(isSamePdfApartFromDates({ pdf: PDF, otherPdf: PDF.slice() })).toBe(true);
  });

  // A real PDF whose date changes length also moves the offsets of its cross-reference table,
  // which then differ: that file is written again
  it('ignores the creation and the modification dates', () => {
    const otherPdf = encodeInfo(
      "/Creator (Chromium) /CreationDate (D:20261018234147+00'00') /ModDate (D:20261019034028Z)",
    );

    expect(isSamePdfApartFromDates({ pdf: PDF, otherPdf })).toBe(true);
  });

  it('ignores a date written right after its key', () => {
    const pdf = encodeInfo("/CreationDate(D:20261018172454+00'00')/ModDate(D:20261018172454Z)");
    const otherPdf = encodeInfo(
      "/CreationDate(D:20261019034028+00'00')/ModDate(D:20261019034028Z)",
    );

    expect(isSamePdfApartFromDates({ pdf, otherPdf })).toBe(true);
  });

  it('ignores a date that holds an escaped parenthesis', () => {
    const otherPdf = encodeInfo(
      "/Creator (Chromium) /CreationDate (D:2026\\)1018) /ModDate (D:20261018172454+00'00')",
    );

    expect(isSamePdfApartFromDates({ pdf: PDF, otherPdf })).toBe(true);
  });

  it('finds a PDF with another byte than its dates different', () => {
    const otherPdf = encodeInfo(INFO.replace('Chromium', 'Chromiun'));

    expect(isSamePdfApartFromDates({ pdf: PDF, otherPdf })).toBe(false);
  });

  it('finds a PDF without its dates different from one with them', () => {
    const otherPdf = encodeInfo('/Creator (Chromium)');

    expect(isSamePdfApartFromDates({ pdf: PDF, otherPdf })).toBe(false);
  });

  it('compares PDFs without dates byte for byte', () => {
    const pdf = encodeInfo('/Creator (Chromium)');

    expect(isSamePdfApartFromDates({ pdf, otherPdf: pdf.slice() })).toBe(true);
    expect(isSamePdfApartFromDates({ pdf, otherPdf: encodeInfo('/Creator (Skia)') })).toBe(false);
  });

  it('compares empty files', () => {
    expect(isSamePdfApartFromDates({ pdf: new Uint8Array(), otherPdf: new Uint8Array() })).toBe(
      true,
    );
    expect(isSamePdfApartFromDates({ pdf: PDF, otherPdf: new Uint8Array() })).toBe(false);
  });

  it('finds no file the same as a PDF', () => {
    expect(isSamePdfApartFromDates({ pdf: PDF })).toBe(false);
    expect(isSamePdfApartFromDates({ pdf: PDF, otherPdf: undefined })).toBe(false);
  });

  it.each(Object.values(CV_URLS))('ignores the dates of %s only', url => {
    const pdf = readFileSync(join(PUBLIC_DIR, url));
    const redatedText = pdf
      .toString('latin1')
      .replace(/(\/(?:CreationDate|ModDate) \(D:)\d{14}/g, '$119700101000000');
    const redatedPdf = Buffer.from(redatedText, 'latin1');
    // The last byte of the file, a line feed, written as another one
    const changedPdf = Buffer.concat([pdf.subarray(0, -1), Buffer.from(' ')]);

    expect(redatedPdf.equals(pdf)).toBe(false);
    expect(isSamePdfApartFromDates({ pdf, otherPdf: redatedPdf })).toBe(true);
    expect(isSamePdfApartFromDates({ pdf, otherPdf: changedPdf })).toBe(false);
  });
});
