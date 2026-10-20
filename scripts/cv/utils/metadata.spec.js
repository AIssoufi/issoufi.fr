import { addPdfInfo, buildPdfInfo } from './metadata.mjs';
import { readPdf } from './pdf.mjs';
import { buildPdf } from './pdfTestUtils.js';

const PAGES = [{ text: 'CV' }];
const TITLE = '/Title (CV - ADAM Issoufi)';
const INFO = { Subject: 'Développeur front-end senior', Keywords: 'React, TypeScript' };

/**
 * Decodes a PDF file as the text of its bytes, which every structure of a PDF writes in.
 * @param {Uint8Array} pdf - PDF file.
 * @returns {string} Its bytes, one character each.
 */
const toLatin1 = pdf => Buffer.from(pdf).toString('latin1');

describe('buildPdfInfo', () => {
  it('names the author, the subject and the keywords of the CV', () => {
    const content = { name: 'ADAM Issoufi', subject: 'CV', keywords: ['React', 'TypeScript'] };

    expect(buildPdfInfo(content)).toEqual({
      Author: 'ADAM Issoufi',
      Subject: 'CV',
      Keywords: 'React, TypeScript',
    });
  });

  it('writes no keyword for a CV without any', () => {
    const content = { name: 'ADAM Issoufi', subject: '', keywords: [] };

    expect(buildPdfInfo(content)).toEqual({ Author: 'ADAM Issoufi', Subject: '', Keywords: '' });
  });
});

describe('addPdfInfo', () => {
  it('adds the entries to the information that readers find, with its accents', async () => {
    const pdf = addPdfInfo({ pdf: buildPdf({ pages: PAGES, info: TITLE }), info: INFO });

    expect((await readPdf(pdf)).info).toEqual({
      PDFFormatVersion: '1.4',
      Title: 'CV - ADAM Issoufi',
      ...INFO,
    });
  });

  it('keeps the bytes of the PDF and adds an update after them', () => {
    const original = buildPdf({ pages: PAGES, info: TITLE });
    const previousXrefOffset = toLatin1(original).match(/startxref\n(\d+)/)[1];
    const object = '7 0 obj\n<</Title (CV - ADAM Issoufi)\n/Subject <FEFF00E9>\n>>\nendobj\n';

    const pdf = addPdfInfo({ pdf: original, info: { Subject: 'é' } });

    expect(pdf.subarray(0, original.length)).toEqual(Buffer.from(original));
    expect(toLatin1(pdf.subarray(original.length))).toBe(
      [
        object,
        `xref\n7 1\n${String(original.length).padStart(10, '0')} 00000 n \n`,
        `trailer\n<</Size 8\n/Root 1 0 R\n/Info 7 0 R\n/Prev ${previousXrefOffset}>>\n`,
        `startxref\n${original.length + object.length}\n%%EOF\n`,
      ].join(''),
    );
  });

  it('writes a character outside the Latin alphabet as two bytes of UTF-16', async () => {
    const pdf = addPdfInfo({
      pdf: buildPdf({ pages: PAGES, info: TITLE }),
      info: { Subject: '’' },
    });

    expect(toLatin1(pdf)).toContain('/Subject <FEFF2019>');
    expect((await readPdf(pdf)).info.Subject).toBe('’');
  });

  it('starts the update on a line of its own after a PDF that ends without a line break', async () => {
    const original = buildPdf({ pages: PAGES, info: TITLE }).subarray(0, -1);

    const pdf = addPdfInfo({ pdf: original, info: INFO });

    expect(toLatin1(pdf.subarray(original.length - 5, original.length + 8))).toBe('%%EOF\n7 0 obj');
    expect((await readPdf(pdf)).info).toMatchObject(INFO);
  });

  it('adds to the last version of the information of a PDF already updated', async () => {
    const once = addPdfInfo({
      pdf: buildPdf({ pages: PAGES, info: TITLE }),
      info: { Subject: 'CV' },
    });

    const pdf = addPdfInfo({ pdf: once, info: { Keywords: 'React' } });

    expect((await readPdf(pdf)).info).toEqual({
      PDFFormatVersion: '1.4',
      Title: 'CV - ADAM Issoufi',
      Subject: 'CV',
      Keywords: 'React',
    });
  });

  it.each([
    ['no entry', {}],
    ['empty entries only', { Subject: '', Keywords: '' }],
  ])('returns the same bytes for %s', (_case, info) => {
    const original = buildPdf({ pages: PAGES, info: TITLE });

    expect(addPdfInfo({ pdf: original, info })).toEqual(Buffer.from(original));
  });

  it('leaves out an empty entry and adds the others', async () => {
    const pdf = addPdfInfo({
      pdf: buildPdf({ pages: PAGES, info: TITLE }),
      info: { Subject: '', Keywords: 'React' },
    });

    expect(toLatin1(pdf)).not.toContain('/Subject');
    expect((await readPdf(pdf)).info.Keywords).toBe('React');
  });

  it('refuses a PDF whose trailer names no information dictionary', () => {
    expect(() => addPdfInfo({ pdf: buildPdf({ pages: PAGES }), info: INFO })).toThrow(
      'The PDF has no classic trailer that names its root and its information',
    );
  });

  it.each([
    ['without a trailer', '%PDF-1.4\n%%EOF\n'],
    ['with a cross-reference stream', '%PDF-1.5\nstartxref\n9\n%%EOF\n'],
    ['without the end of its trailer', 'trailer\n<</Size 2 /Root 1 0 R /Info 1 0 R>>\n'],
    ['without the root in its trailer', 'trailer\n<</Size 2 /Info 1 0 R>>\nstartxref\n9\n%%EOF\n'],
    [
      'without the size in its trailer',
      'trailer\n<</Root 1 0 R /Info 1 0 R>>\nstartxref\n9\n%%EOF\n',
    ],
    ['that is empty', ''],
  ])('refuses a PDF %s', (_case, text) => {
    expect(() => addPdfInfo({ pdf: Buffer.from(text, 'latin1'), info: INFO })).toThrow(
      'The PDF has no classic trailer that names its root and its information',
    );
  });

  it('refuses a PDF that lacks the information dictionary its trailer names', () => {
    const text = toLatin1(buildPdf({ pages: PAGES, info: TITLE })).replace('7 0 obj', '8 0 obj');

    expect(() => addPdfInfo({ pdf: Buffer.from(text, 'latin1'), info: INFO })).toThrow(
      'The PDF lacks its information dictionary, 7 0 obj',
    );
  });

  it('reads the information dictionary of its number, not one whose number ends with it', () => {
    const text = toLatin1(buildPdf({ pages: PAGES, info: TITLE })).replace('7 0 obj', '17 0 obj');

    expect(() => addPdfInfo({ pdf: Buffer.from(text, 'latin1'), info: INFO })).toThrow(
      'The PDF lacks its information dictionary, 7 0 obj',
    );
  });

  it('refuses entries that the information already holds, rather than writing them twice', () => {
    const pdf = buildPdf({ pages: PAGES, info: `${TITLE} /Subject (CV) /Keywords (React)` });

    expect(() => addPdfInfo({ pdf, info: { Title: 'CV', ...INFO } })).toThrow(
      'The information of the PDF already holds Title, Subject, Keywords',
    );
  });

  it('adds an entry whose key starts like one that the information holds', async () => {
    const pdf = addPdfInfo({
      pdf: buildPdf({ pages: PAGES, info: '/Titles (CV)' }),
      info: { Title: 'CV' },
    });

    expect((await readPdf(pdf)).info.Title).toBe('CV');
  });
});
