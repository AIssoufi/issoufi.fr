// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { theme } from '../../../src/theme/theme';
import { CV_FONT_FILES, CV_FONTS_DIR } from '../constants.mjs';
import { renderFontFaces } from './fonts.mjs';

/** Position of the number of tables in a TrueType file, in bytes. */
const TABLE_COUNT_OFFSET = 4;

/** Position of the first table record, after the header of the file, in bytes. */
const TABLE_RECORDS_OFFSET = 12;

/** Length of a table record, in bytes: it starts with the tag of its table. */
const TABLE_RECORD_LENGTH = 16;

/** Length of the tag of a table, in bytes, e.g. `glyf`. */
const TABLE_TAG_LENGTH = 4;

/** Lists the tags of the tables of a TrueType file, e.g. `glyf`. */
const listTableTags = content =>
  Array.from({ length: content.readUInt16BE(TABLE_COUNT_OFFSET) }, (_table, index) => {
    const start = TABLE_RECORDS_OFFSET + index * TABLE_RECORD_LENGTH;
    return content.toString('latin1', start, start + TABLE_TAG_LENGTH);
  });

describe('renderFontFaces', () => {
  it('writes one rule per weight, in order', () => {
    const css = renderFontFaces({
      family: 'Montserrat',
      faces: [
        { weight: 400, url: 'data:font/ttf;base64,AA==' },
        { weight: 700, url: 'data:font/ttf;base64,BB==' },
      ],
    });

    expect(css).toBe(
      [
        '@font-face { font-family: "Montserrat"; font-style: normal; font-weight: 400; src: url("data:font/ttf;base64,AA==") format("truetype"); }',
        '@font-face { font-family: "Montserrat"; font-style: normal; font-weight: 700; src: url("data:font/ttf;base64,BB==") format("truetype"); }',
      ].join('\n'),
    );
  });

  it('quotes a family name of several words', () => {
    expect(
      renderFontFaces({ family: 'Saira Stencil One', faces: [{ weight: 400, url: 'a.ttf' }] }),
    ).toContain('font-family: "Saira Stencil One";');
  });

  it.each([undefined, null, NaN, '700'])(
    'leaves out a file whose weight is %j, which is not a number',
    weight => {
      expect(renderFontFaces({ family: 'Montserrat', faces: [{ weight, url: 'a.ttf' }] })).toBe('');
    },
  );

  it('leaves out a file without URL', () => {
    expect(renderFontFaces({ family: 'Montserrat', faces: [{ weight: 400, url: '' }] })).toBe('');
  });

  it('writes nothing without files', () => {
    expect(renderFontFaces({ family: 'Montserrat', faces: [] })).toBe('');
  });
});

describe('CV_FONT_FILES', () => {
  it.each(Object.keys(CV_FONT_FILES))('names a weight of the theme: %s', weight => {
    expect(Number.isFinite(theme.fontWeights[weight])).toBe(true);
  });

  it.each(Object.values(CV_FONT_FILES))(
    'names %s, a static TrueType file, without the variation table of a variable font',
    fileName => {
      const content = readFileSync(join(CV_FONTS_DIR, fileName));
      const tableTags = listTableTags(content);

      expect(tableTags).toContain('glyf');
      expect(tableTags).not.toContain('fvar');
    },
  );

  it('keeps the license of the fonts next to them, which redistributing them requires', () => {
    expect(readFileSync(join(CV_FONTS_DIR, 'OFL.txt'), 'utf-8')).toContain(
      'SIL Open Font License, Version 1.1',
    );
  });
});
