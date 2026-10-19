// @vitest-environment node
import { removeManifestLinks } from './manifest';

describe('removeManifestLinks', () => {
  it('removes the link to the manifest, with its line', () => {
    const html =
      '<head>\n    <title>A</title>\n    <link rel="manifest" href="/manifest.webmanifest" />\n  </head>';

    expect(removeManifestLinks(html)).toBe('<head>\n    <title>A</title>\n  </head>');
  });

  it('removes a link written on several lines, whatever the order of its attributes', () => {
    const html = '<head>\n  <link\n    href="./manifest.json"\n    rel="manifest"\n  />\n</head>';

    expect(removeManifestLinks(html)).toBe('<head>\n</head>');
  });

  it.each([
    ['an icon', '<link rel="icon" href="./favicon.svg" type="image/svg+xml" />'],
    ['an Apple touch icon', '<link rel="apple-touch-icon" href="./apple-touch-icon.png" />'],
    ['a translation', '<link rel="alternate" hreflang="en" href="https://issoufi.fr/en/" />'],
    ['a link whose URL names a manifest', '<link rel="prefetch" href="/manifest.webmanifest" />'],
  ])('keeps %s', (_, link) => {
    const html = `<head>\n  ${link}\n</head>`;

    expect(removeManifestLinks(html)).toBe(html);
  });

  describe('edge cases', () => {
    it.each([undefined, null, 42, {}])('gives an empty page for %j', html => {
      expect(removeManifestLinks(html)).toBe('');
    });

    it('leaves a page without links as it is', () => {
      expect(removeManifestLinks('<html><head></head></html>')).toBe('<html><head></head></html>');
    });
  });
});
