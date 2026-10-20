import { readFileSync } from 'node:fs';

import { CV_ICON_FILES } from '../constants.mjs';
import { toInlineIcon } from './icons.mjs';

/** Values that an attribute of an icon may give its color, so it draws in that of its text. */
const MONOCHROME_PAINTS = ['none', 'currentColor'];

describe('toInlineIcon', () => {
  it('gives the root its class and hides it from screen readers, its drawing unchanged', () => {
    expect(toInlineIcon('<svg viewBox="0 0 16 16"><path d="M1 1H15"/></svg>')).toBe(
      '<svg class="icon" aria-hidden="true" viewBox="0 0 16 16"><path d="M1 1H15"/></svg>',
    );
  });

  it('gives the attributes to a root that has none', () => {
    expect(toInlineIcon('<svg><circle r="1"/></svg>')).toBe(
      '<svg class="icon" aria-hidden="true"><circle r="1"/></svg>',
    );
  });

  it('leaves out the XML declaration, the comments and the spaces around the drawing', () => {
    const svg = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<!-- LinkedIn logo,',
      '     on two lines -->',
      '<svg viewBox="0 0 48 48"><!-- Its square --><path d="M0 0"/></svg>',
      '',
    ].join('\n');

    expect(toInlineIcon(svg)).toBe(
      '<svg class="icon" aria-hidden="true" viewBox="0 0 48 48"><path d="M0 0"/></svg>',
    );
  });

  it.each([
    ['an empty file', ''],
    ['a file of comments only', '<!-- <svg></svg> -->'],
    ['another element', '<svgx viewBox="0 0 16 16"></svgx>'],
    ['an unclosed drawing', '<svg viewBox="0 0 16 16"><path d="M0 0"/>'],
    ['HTML', '<p>Mail</p>'],
  ])('writes nothing for %s', (_case, svg) => {
    expect(toInlineIcon(svg)).toBe('');
  });

  it.each([undefined, null, 42, {}, ['<svg></svg>']])('writes nothing for %j', svg => {
    expect(toInlineIcon(svg)).toBe('');
  });

  it.each(Object.entries(CV_ICON_FILES))(
    'reads the %s icon as a drawing in the color of its text',
    (_name, file) => {
      const icon = toInlineIcon(readFileSync(file, 'utf8'));
      const paints = [...icon.matchAll(/\b(?:fill|stroke)="([^"]*)"/g)].map(([, paint]) => paint);

      expect(icon).toMatch(/^<svg class="icon" aria-hidden="true" /);
      expect(paints.length).toBeGreaterThan(0);
      paints.forEach(paint => expect(MONOCHROME_PAINTS).toContain(paint));
    },
  );
});
