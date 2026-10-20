// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { CV_URLS } from '../../src/App/Header/NavMenu/CvLink/constants.ts';
import { theme } from '../../src/theme/theme.ts';
import { PUBLIC_DIR } from '../utils/constants.mjs';
import { getFirstFontFamily } from '../utils/fonts.mjs';
import { CV_FINGERPRINTS_FILE, CV_MAX_BYTES, CV_MAX_PAGES } from './constants.mjs';
import { CV_SOURCES } from './testUtils.js';
import { getCvFingerprint } from './utils/fingerprint.mjs';
import { buildCvContents } from './utils/languages.mjs';
import { listCvPdfInfo } from './utils/metadata.mjs';
import { findPdfProblems, readPdf } from './utils/pdf.mjs';
import { listCvLinks, listCvTexts } from './utils/texts.mjs';

const contents = await buildCvContents(CV_SOURCES);

/** Fingerprint of the content of each CV of public/, written by `pnpm cv`. */
const fingerprints = JSON.parse(readFileSync(CV_FINGERPRINTS_FILE, 'utf-8'));

// The CVs are generated on demand by `pnpm cv`, which needs Chromium and the network: these checks
// read the committed PDFs, so a change of the site that the CVs no longer follow fails here
describe.each(contents.map(content => [content.language, content]))(
  'the %s CV of public/',
  (language, content) => {
    it('was generated from the current content of the site', () => {
      expect(
        fingerprints[language],
        'the content of the CV changed: run `pnpm cv`, then commit the PDFs and the fingerprints',
      ).toBe(getCvFingerprint(content));
    });

    it('holds every text and link of the site, in the font of the site, without Type 3 font', async () => {
      const file = readFileSync(join(PUBLIC_DIR, CV_URLS[language]));

      const problems = findPdfProblems({
        pdf: await readPdf(file),
        byteCount: file.length,
        maxBytes: CV_MAX_BYTES,
        maxPages: CV_MAX_PAGES,
        texts: listCvTexts(content),
        links: listCvLinks(content),
        fontFamily: getFirstFontFamily(theme.fonts.body),
        info: listCvPdfInfo(content),
      });

      expect(problems, 'problems of the CV: run `pnpm cv`, then commit the PDFs').toEqual([]);
    });
  },
);

describe('CV_URLS', () => {
  it('names a CV for every language of the site', () => {
    expect(contents.map(({ language }) => CV_URLS[language])).toEqual(Object.values(CV_URLS));
  });
});
