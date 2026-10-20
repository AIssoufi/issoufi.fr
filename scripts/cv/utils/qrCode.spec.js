import { encode } from 'uqr';

import { QR_CODE_OPTIONS } from '../constants.mjs';
import { renderQrCode } from './qrCode.mjs';

const SITE_URL = 'https://issoufi.fr/';

/** Number of dark modules of the QR code of a URL, as `uqr` encodes it. */
const countDarkModules = url =>
  encode(url, QR_CODE_OPTIONS)
    .data.flat()
    .filter(isDark => isDark).length;

describe('renderQrCode', () => {
  it('draws the QR code of the URL with the class of the CV, hidden from screen readers', () => {
    const svg = renderQrCode(SITE_URL);

    expect(svg).toMatch(/^<svg class="qr-code" aria-hidden="true" xmlns="[^"]+" viewBox="/);
    expect(svg).toMatch(/<\/svg>$/);
  });

  it('draws one square per dark module of the URL, in the color of the text, on nothing', () => {
    const svg = renderQrCode(SITE_URL);
    const squareCount = svg.match(/h10v10h-10z/g).length;

    expect(squareCount).toBe(countDarkModules(SITE_URL));
    expect(svg).toContain('<path fill="currentColor" ');
    expect(svg).toContain('<rect fill="none" ');
    expect(svg).not.toMatch(/white|black/);
  });

  it('draws another QR code for another URL', () => {
    expect(renderQrCode('https://issoufi.fr/en/')).not.toBe(renderQrCode(SITE_URL));
  });

  it.each([undefined, null, 42, {}, ['https://issoufi.fr/'], '', '   '])(
    'draws nothing for %j',
    url => {
      expect(renderQrCode(url)).toBe('');
    },
  );
});
