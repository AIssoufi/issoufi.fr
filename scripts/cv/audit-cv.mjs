// @ts-check
// Writes what applicant tracking systems, AI screening agents and recruiters receive of each CV
// of public/, the input of the audit of docs/cv-audit.md, which scores the CVs before and after a
// change: `pnpm cv:audit <folder>` writes in that folder the entries of the document information
// that describe each CV and the text of its pages, in the order a parser reads them (cv-text.md),
// and an image of each page (cv-fr-page-1.png…).
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { PUBLIC_DIR } from '../utils/constants.mjs';
import { loadSiteModules } from '../utils/site-modules.mjs';
import { AUDIT_PAGE_SCALE, AUDIT_TEXT_FILE, SOURCE_MODULES } from './constants.mjs';
import { formatPdfText, renderPdfPages, toPageImageName } from './utils/audit.mjs';
import { readPdf } from './utils/pdf.mjs';

const [folder] = process.argv.slice(2);
if (!folder) throw new Error('Name the folder of the audit: pnpm cv:audit <folder>');

const { sources } = await loadSiteModules({ sources: { cvLink: SOURCE_MODULES.cvLink } });
/** @type {Record<string, string>} */
const cvUrls = sources.cvLink.CV_URLS;

mkdirSync(folder, { recursive: true });
const texts = [];
for (const [language, url] of Object.entries(cvUrls)) {
  const fileName = join(PUBLIC_DIR, url);
  const data = readFileSync(fileName);
  texts.push(formatPdfText({ fileName, pdf: await readPdf(data) }));

  const images = await renderPdfPages({ data, scale: AUDIT_PAGE_SCALE });
  images.forEach((image, index) => {
    writeFileSync(join(folder, toPageImageName({ language, pageNumber: index + 1 })), image);
  });
}
writeFileSync(join(folder, AUDIT_TEXT_FILE), `${texts.join('\n\n')}\n`);
console.log(`Wrote the text and the pages of the CVs in ${folder}`);
