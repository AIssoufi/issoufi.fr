import { formatPdfText, renderPdfPages, toPageImageName } from './audit.mjs';
import { buildPdf } from './pdfTestUtils.js';

/** First bytes of every PNG file. */
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

/** Width and height of each page of a PDF of `buildPdf`, in points. */
const PAGE_SIZE = { width: 300, height: 200 };

/**
 * Reads the size of a PNG image from its header chunk, which follows its signature.
 * @param {Buffer} png - PNG file.
 * @returns {{ width: number, height: number }} Its size, in pixels.
 */
const readPngSize = png => ({ width: png.readUInt32BE(16), height: png.readUInt32BE(20) });

/** What a CV of two pages holds, as `readPdf` reads it. */
const PDF = {
  pageCount: 2,
  text: 'ADAM Issoufi Paris Expériences',
  pages: ['ADAM Issoufi\nParis', 'Expériences'],
  links: [],
  fonts: [],
  info: {
    PDFFormatVersion: '1.4',
    Title: 'CV - ADAM Issoufi',
    Creator: 'Chromium',
    Keywords: 'React, TypeScript',
    CreationDate: "D:20261020100244+00'00'",
    Author: 'ADAM Issoufi',
  },
};

describe('formatPdfText', () => {
  it('writes the descriptive information, then the lines of each page under its number', () => {
    expect(formatPdfText({ fileName: 'public/CV.pdf', pdf: PDF })).toBe(
      [
        '# public/CV.pdf',
        'Title: CV - ADAM Issoufi\nAuthor: ADAM Issoufi\nKeywords: React, TypeScript',
        '## Page 1',
        'ADAM Issoufi\nParis',
        '## Page 2',
        'Expériences',
      ].join('\n\n'),
    );
  });

  it('writes the pages alone for a PDF without descriptive information', () => {
    const pdf = { ...PDF, info: { PDFFormatVersion: '1.4' } };

    expect(formatPdfText({ fileName: 'CV.pdf', pdf })).toBe(
      '# CV.pdf\n\n## Page 1\n\nADAM Issoufi\nParis\n\n## Page 2\n\nExpériences',
    );
  });

  it('keeps an empty entry, which a reader shows as empty', () => {
    const pdf = { ...PDF, pages: [], info: { Subject: '' } };

    expect(formatPdfText({ fileName: 'CV.pdf', pdf })).toBe('# CV.pdf\n\nSubject: ');
  });

  it('writes the heading alone for a PDF without page', () => {
    const pdf = { ...PDF, pages: [], info: {} };

    expect(formatPdfText({ fileName: 'CV.pdf', pdf })).toBe('# CV.pdf');
  });
});

describe('renderPdfPages', () => {
  it('draws each page as a PNG image of its size times the scale', async () => {
    const data = buildPdf({ pages: [{ text: 'ADAM Issoufi' }, { text: 'Experiences' }] });

    const images = await renderPdfPages({ data, scale: 2 });

    expect(images).toHaveLength(2);
    images.forEach(image => {
      expect(image.subarray(0, PNG_SIGNATURE.length)).toEqual(PNG_SIGNATURE);
      expect(readPngSize(image)).toEqual({
        width: PAGE_SIZE.width * 2,
        height: PAGE_SIZE.height * 2,
      });
    });
  });

  it('draws the pages at their size in points at a scale of 1', async () => {
    const [image] = await renderPdfPages({ data: buildPdf({ pages: [{ text: 'CV' }] }), scale: 1 });

    expect(readPngSize(image)).toEqual(PAGE_SIZE);
  });

  it('draws the text of the page, not a blank image', async () => {
    const buildPage = text => buildPdf({ pages: [{ text }] });

    const [withText] = await renderPdfPages({ data: buildPage('ADAM Issoufi'), scale: 1 });
    const [blank] = await renderPdfPages({ data: buildPage(''), scale: 1 });

    expect(withText).not.toEqual(blank);
  });

  it('refuses data that is not a PDF', async () => {
    await expect(renderPdfPages({ data: Buffer.from('not a PDF'), scale: 1 })).rejects.toThrow();
  });
});

describe('toPageImageName', () => {
  it.each([
    ['fr', 1, 'cv-fr-page-1.png'],
    ['en', 2, 'cv-en-page-2.png'],
  ])('names the image of the %s CV, page %i', (language, pageNumber, name) => {
    expect(toPageImageName({ language, pageNumber })).toBe(name);
  });
});
