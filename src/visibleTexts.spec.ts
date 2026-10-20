import { readdirSync, readFileSync } from 'node:fs';
import { join, sep } from 'node:path';

import { en } from './i18n/en.ts';
import { fr } from './i18n/fr.ts';
import { getEntries } from './i18n/testUtils.ts';

/**
 * The em dash, which the site owner keeps out of every text that a visitor reads, the CV
 * included: it makes a text look written by an AI. A period takes an en dash, a pause a comma.
 */
const EM_DASH = '\u2014';

/** Folder of the code of the site. */
const SOURCE_DIR = 'src';

/** Folder of the JSON data of a page, e.g. `src/pages/Experiences/.data`. */
const DATA_DIR_NAME = '.data';

/** Extension of the data files. */
const DATA_FILE_EXTENSION = '.json';

/** Files of JSON data of the site, whose texts the pages show, such as the experiences. */
const DATA_FILES = readdirSync(SOURCE_DIR, { recursive: true, encoding: 'utf8' })
  .filter(file => file.endsWith(DATA_FILE_EXTENSION) && file.split(sep).includes(DATA_DIR_NAME))
  .map(file => join(SOURCE_DIR, file));

describe('the visible texts of the site', () => {
  it.each([
    ['fr', fr],
    ['en', en],
  ])('hold no em dash in the %s translations', (_language, translations) => {
    const keysWithEmDash = getEntries({ value: translations })
      .filter(([, text]) => text.includes(EM_DASH))
      .map(([key]) => key);

    expect(keysWithEmDash).toEqual([]);
  });

  it('hold no em dash in the data files', () => {
    const filesWithEmDash = DATA_FILES.filter(file => readFileSync(file, 'utf8').includes(EM_DASH));

    expect(DATA_FILES).toContain(
      join(SOURCE_DIR, 'pages', 'Experiences', '.data', 'experiences.json'),
    );
    expect(filesWithEmDash).toEqual([]);
  });
});
