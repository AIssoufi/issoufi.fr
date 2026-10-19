import { readFileSync, statSync } from 'node:fs';

import { LANGUAGES } from '../i18n/constants.ts';
import { en } from '../i18n/en.ts';
import { fr } from '../i18n/fr.ts';
import { addModulePreload, renderNotFoundHtml, renderPageHtml } from './pageHtml.ts';
import { OG_IMAGE_PATHS, PAGES, SITE_URL, getNotFoundFiles, getPageFiles } from './pages.ts';
import { getStructuredData } from './structuredData.ts';
import { getWebManifestUrl } from './webManifest.ts';

const [home, projects, experiences] = PAGES;

/** First bytes of every JPEG file: its start of image marker. */
const JPEG_START_OF_IMAGE = Buffer.from([0xff, 0xd8]);
/** Bytes of a marker of a JPEG file, and of the segment length that follows it. */
const JPEG_MARKER_BYTES = 2;
const JPEG_SEGMENT_LENGTH_BYTES = 2;
/** Offsets of the height and width in a frame header, from its marker. */
const JPEG_FRAME_HEIGHT_OFFSET_BYTES = 5;
const JPEG_FRAME_WIDTH_OFFSET_BYTES = 7;
/** Markers of the frame headers of a JPEG file (SOF0 to SOF15, without DHT, JPG and DAC). */
const JPEG_FRAME_MARKERS = new Set([
  0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf,
]);
/** Largest link preview image WhatsApp reliably shows. */
const OG_IMAGE_MAX_BYTES = 300_000;

/** Parameters of {@link getMetaContent}. */
interface GetMetaContentParams {
  /** HTML document to search. */
  html: string;
  /** Open Graph property of the tag, e.g. `og:image`. */
  property: string;
}

/** Reads the `content` of the `<meta property="…">` tag of an HTML document. */
const getMetaContent = ({ html, property }: GetMetaContentParams) =>
  html.match(new RegExp(`property="${property}"\\s+content="([^"]*)"`))?.[1];

/**
 * Reads the width and height of a JPEG file in its frame header, going from segment to segment.
 * Returns `undefined` when the file has no frame header.
 */
const readJpegSize = (jpeg: Buffer) => {
  let offset = JPEG_START_OF_IMAGE.length;
  const hasSegmentAt = (start: number) =>
    start + JPEG_MARKER_BYTES + JPEG_SEGMENT_LENGTH_BYTES <= jpeg.length;

  while (hasSegmentAt(offset)) {
    const isFrameHeader = JPEG_FRAME_MARKERS.has(jpeg[offset + 1]);
    if (isFrameHeader) {
      return {
        width: jpeg.readUInt16BE(offset + JPEG_FRAME_WIDTH_OFFSET_BYTES),
        height: jpeg.readUInt16BE(offset + JPEG_FRAME_HEIGHT_OFFSET_BYTES),
      };
    }
    offset += JPEG_MARKER_BYTES + jpeg.readUInt16BE(offset + JPEG_MARKER_BYTES);
  }
  return undefined;
};

describe('renderPageHtml', () => {
  const template =
    '<title>%PAGE_TITLE%</title><meta content="%PAGE_DESCRIPTION%"><link href="%PAGE_URL%">';

  it('fills the home page metadata with the years of experience', () => {
    expect(renderPageHtml({ template, page: home, years: 8 })).toBe(
      '<title>ADAM Issoufi - Développeur full-stack JavaScript</title>' +
        '<meta content="Développeur full-stack JavaScript avec 8 ans d’expérience, spécialisé React.">' +
        '<link href="https://issoufi.fr/">',
    );
  });

  it('fills the metadata and URL of the other pages', () => {
    expect(renderPageHtml({ template, page: projects, years: 8 })).toBe(
      '<title>Projets - ADAM Issoufi</title>' +
        '<meta content="Projets personnels et freelance d’ADAM Issoufi, développeur full-stack JavaScript.">' +
        '<link href="https://issoufi.fr/projects">',
    );
    expect(renderPageHtml({ template, page: experiences, years: 8 })).toContain(
      '<link href="https://issoufi.fr/experiences">',
    );
  });

  it('fills every placeholder of index.html for every page in every language', () => {
    const html = readFileSync('index.html', 'utf-8');

    expect(html.match(/%PAGE_LANGUAGE%/g)).toHaveLength(1);
    expect(html.match(/%PAGE_LOCALE%/g)).toHaveLength(1);
    expect(html.match(/%PAGE_SITE_NAME%/g)).toHaveLength(1);
    expect(html.match(/%PAGE_TITLE%/g)).toHaveLength(3);
    expect(html.match(/%PAGE_DESCRIPTION%/g)).toHaveLength(3);
    expect(html.match(/%PAGE_URL%/g)).toHaveLength(2);
    expect(html.match(/%PAGE_IMAGE_URL%/g)).toHaveLength(1);
    expect(html.match(/%PAGE_IMAGE_ALT%/g)).toHaveLength(1);
    expect(html.match(/%PAGE_NOSCRIPT%/g)).toHaveLength(1);
    getPageFiles().forEach(({ page, language }) =>
      expect(renderPageHtml({ template: html, page, language, years: 8 })).not.toMatch(
        /%PAGE_\w+%/,
      ),
    );
  });

  it('leaves an unknown placeholder as it is', () => {
    expect(renderPageHtml({ template: '%PAGE_AUTHOR% %PAGE_TITLE%', page: home, years: 8 })).toBe(
      '%PAGE_AUTHOR% ADAM Issoufi - Développeur full-stack JavaScript',
    );
  });
});

describe('message shown without JavaScript', () => {
  const html = readFileSync('index.html', 'utf-8');

  it('is in French on the French pages', () => {
    const page = renderPageHtml({ template: html, page: projects, years: 8 });

    expect(page).toContain('<noscript>Activez JavaScript pour afficher ce site.</noscript>');
  });

  it('is in English on the English pages', () => {
    const page = renderPageHtml({ template: html, page: projects, language: 'en', years: 8 });

    expect(page).toContain('<noscript>Enable JavaScript to view this site.</noscript>');
  });

  it.each(['fr', 'en'] as const)('is in the language of the %s not found page', language => {
    const page = renderNotFoundHtml({ template: html, language, years: 8 });

    expect(page).toContain(`<noscript>${{ fr, en }[language].meta.noScript}</noscript>`);
  });
});

describe('renderPageHtml in English', () => {
  const html = readFileSync('index.html', 'utf-8');
  const page = renderPageHtml({ template: html, page: projects, language: 'en', years: 8 });

  it('fills the English metadata, language and locale', () => {
    expect(page).toContain('<html lang="en">');
    expect(page).toContain('<title>Projects - ADAM Issoufi</title>');
    expect(getMetaContent({ html: page, property: 'og:title' })).toBe('Projects - ADAM Issoufi');
    expect(getMetaContent({ html: page, property: 'og:locale' })).toBe('en_US');
    expect(getMetaContent({ html: page, property: 'og:image' })).toBe(
      'https://issoufi.fr/og-image-en.jpg',
    );
    expect(getMetaContent({ html: page, property: 'og:image:alt' })).toBe(en.meta.ogImageAlt);
  });

  it('gives the English URL as the canonical URL and og:url', () => {
    expect(page).toMatch(/rel="canonical"\s+href="https:\/\/issoufi\.fr\/en\/projects"/);
    expect(getMetaContent({ html: page, property: 'og:url' })).toBe(
      'https://issoufi.fr/en/projects',
    );
  });

  it('fills the years of experience in the English description', () => {
    expect(
      renderPageHtml({ template: '%PAGE_DESCRIPTION%', page: home, language: 'en', years: 9 }),
    ).toBe('Full-stack JavaScript developer with 9 years of experience, specializing in React.');
  });
});

describe('links between the translations of a page', () => {
  const html = readFileSync('index.html', 'utf-8');

  /** Lists the `hreflang` and URL of each alternate link of a page. */
  const getAlternates = (page: string) =>
    [...page.matchAll(/<link rel="alternate" hreflang="([^"]*)" href="([^"]*)" \/>/g)].map(
      ([, hreflang, href]) => [hreflang, href],
    );

  it.each(['fr', 'en'] as const)('links the %s home page to every home page', language => {
    const page = renderPageHtml({ template: html, page: home, language, years: 8 });

    expect(getAlternates(page)).toEqual([
      ['fr', 'https://issoufi.fr/'],
      ['en', 'https://issoufi.fr/en/'],
      ['x-default', 'https://issoufi.fr/'],
    ]);
  });

  it.each(['fr', 'en'] as const)('links the %s experiences page to its translations', language => {
    const page = renderPageHtml({ template: html, page: experiences, language, years: 8 });

    expect(getAlternates(page)).toEqual([
      ['fr', 'https://issoufi.fr/experiences'],
      ['en', 'https://issoufi.fr/en/experiences'],
      ['x-default', 'https://issoufi.fr/experiences'],
    ]);
  });

  it('names the locale of the other languages for link previews', () => {
    const frenchPage = renderPageHtml({ template: html, page: home, language: 'fr', years: 8 });
    const englishPage = renderPageHtml({ template: html, page: home, language: 'en', years: 8 });

    expect(frenchPage).toContain('<meta property="og:locale:alternate" content="en_US" />');
    expect(frenchPage).not.toContain('content="fr_FR" />');
    expect(englishPage).toContain('<meta property="og:locale:alternate" content="fr_FR" />');
  });

  it('puts the links in the head, indented as its other tags', () => {
    const page = renderPageHtml({ template: html, page: projects, years: 8 });

    expect(page).toContain(
      '\n    <link rel="alternate" hreflang="fr" href="https://issoufi.fr/projects" />' +
        '\n    <link rel="alternate" hreflang="en" href="https://issoufi.fr/en/projects" />',
    );
    expect(page.indexOf('hreflang="x-default"')).toBeLessThan(page.indexOf('</head>'));
  });

  it('adds no link to a template without a head', () => {
    expect(renderPageHtml({ template: '<p>%PAGE_TITLE%</p>', page: home, years: 8 })).toBe(
      '<p>ADAM Issoufi - Développeur full-stack JavaScript</p>',
    );
  });
});

describe('link to the web app manifest', () => {
  const html = readFileSync('index.html', 'utf-8');

  /** Lists the URL of each manifest link of a page. */
  const getManifestUrls = (page: string) =>
    [...page.matchAll(/<link rel="manifest" href="([^"]*)" \/>/g)].map(([, href]) => href);

  it('is not in index.html, whose pages each link the manifest of their language', () => {
    expect(html).not.toContain('rel="manifest"');
  });

  it.each([
    { language: 'fr', manifestUrl: '/manifest.webmanifest' },
    { language: 'en', manifestUrl: '/en/manifest.webmanifest' },
  ] as const)('links $manifestUrl from each $language page', ({ language, manifestUrl }) => {
    PAGES.forEach(page => {
      expect(getManifestUrls(renderPageHtml({ template: html, page, language, years: 8 }))).toEqual(
        [manifestUrl],
      );
    });
  });

  it.each(LANGUAGES)('links the manifest of %s from its not found page', language => {
    const page = renderNotFoundHtml({ template: html, language, years: 8 });

    expect(getManifestUrls(page)).toEqual([getWebManifestUrl(language)]);
  });

  it('puts the link in the head, after the links to the translations', () => {
    const page = renderPageHtml({ template: html, page: projects, language: 'en', years: 8 });

    expect(page).toContain(
      '\n    <meta property="og:locale:alternate" content="fr_FR" />' +
        '\n    <link rel="manifest" href="/en/manifest.webmanifest" />\n    <script type="application/ld+json">',
    );
  });

  it('adds no link to a template without a head', () => {
    expect(renderNotFoundHtml({ template: '<p>%PAGE_TITLE%</p>', years: 8 })).toBe(
      '<p>Page introuvable - ADAM Issoufi</p>',
    );
  });
});

describe('structured data', () => {
  const html = readFileSync('index.html', 'utf-8');

  /** Reads the structured data that the script elements of a page declare. */
  const getStructuredDataScripts = (page: string) =>
    [...page.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g)].map(([, json]) =>
      JSON.parse(json),
    );

  it.each(getPageFiles())(
    'declares the structured data of $fileName in its language, in its head',
    ({ page, language }) => {
      const pageHtml = renderPageHtml({ template: html, page, language, years: 8 });

      expect(getStructuredDataScripts(pageHtml)).toEqual([getStructuredData({ page, language })]);
      expect(pageHtml.indexOf('application/ld+json')).toBeLessThan(pageHtml.indexOf('</head>'));
    },
  );

  it.each(LANGUAGES)('declares none on the %s not found page, which has no address', language => {
    const page = renderNotFoundHtml({ template: html, language, years: 8 });

    expect(getStructuredDataScripts(page)).toEqual([]);
  });

  it('is not in index.html, whose pages each declare their own', () => {
    expect(html).not.toContain('application/ld+json');
  });
});

describe.each(LANGUAGES)('name of the site on the %s pages', language => {
  const html = readFileSync('index.html', 'utf-8');
  const siteName = { fr, en }[language].meta.siteName;

  it('names the site for link previews, on every page', () => {
    PAGES.forEach(page => {
      const pageHtml = renderPageHtml({ template: html, page, language, years: 8 });

      expect(getMetaContent({ html: pageHtml, property: 'og:site_name' })).toBe(siteName);
    });
  });

  it('names the site on the not found page', () => {
    const page = renderNotFoundHtml({ template: html, language, years: 8 });

    expect(getMetaContent({ html: page, property: 'og:site_name' })).toBe(siteName);
  });
});

describe.each(LANGUAGES)('Open Graph image of the %s pages', language => {
  const html = renderPageHtml({
    template: readFileSync('index.html', 'utf-8'),
    page: home,
    language,
    years: 8,
  });
  const imageUrl = getMetaContent({ html, property: 'og:image' }) ?? '';
  const imageFile = `public${imageUrl.replace(SITE_URL, '')}`;

  it('points to the image of the language, a file of public/ served by the site', () => {
    expect(imageUrl).toBe(`${SITE_URL}${OG_IMAGE_PATHS[language]}`);
    expect(statSync(imageFile).isFile()).toBe(true);
  });

  it('is a JPEG of the declared type, width and height', () => {
    const jpeg = readFileSync(imageFile);

    expect(jpeg.subarray(0, JPEG_START_OF_IMAGE.length)).toEqual(JPEG_START_OF_IMAGE);
    expect(getMetaContent({ html, property: 'og:image:type' })).toBe('image/jpeg');
    expect(readJpegSize(jpeg)).toEqual({
      width: Number(getMetaContent({ html, property: 'og:image:width' })),
      height: Number(getMetaContent({ html, property: 'og:image:height' })),
    });
  });

  it('is light enough for every link preview', () => {
    expect(statSync(imageFile).size).toBeLessThan(OG_IMAGE_MAX_BYTES);
  });
});

describe('Open Graph image of index.html', () => {
  const html = readFileSync('index.html', 'utf-8');

  it('draws each language in its own image', () => {
    const images = LANGUAGES.map(language =>
      readFileSync(`public${OG_IMAGE_PATHS[language]}`).toString('base64'),
    );

    expect(new Set(images).size).toBe(LANGUAGES.length);
  });

  it('describes the image with the French translation, for screen readers', () => {
    const page = renderPageHtml({ template: html, page: home, years: 8 });

    expect(getMetaContent({ html: page, property: 'og:image:alt' })).toBe(
      'ADAM Issoufi, développeur full-stack JavaScript passionné par l’UX et l’UI Design',
    );
  });

  it('names the image of its language, with its description, in every generated page', () => {
    const translations = { fr, en };
    const generatedPages = [
      ...getPageFiles().map(({ page, language }) => ({
        language,
        page: renderPageHtml({ template: html, page, language, years: 8 }),
      })),
      ...getNotFoundFiles().map(({ language }) => ({
        language,
        page: renderNotFoundHtml({ template: html, language, years: 8 }),
      })),
    ];

    generatedPages.forEach(({ language, page }) => {
      expect(getMetaContent({ html: page, property: 'og:image' })).toBe(
        `${SITE_URL}${OG_IMAGE_PATHS[language]}`,
      );
      expect(getMetaContent({ html: page, property: 'og:image:type' })).toBe('image/jpeg');
      expect(getMetaContent({ html: page, property: 'og:image:alt' })).toBe(
        translations[language].meta.ogImageAlt,
      );
    });
  });
});

describe('renderNotFoundHtml', () => {
  const html = readFileSync('index.html', 'utf-8');

  it('uses the not found title and description', () => {
    const page = renderNotFoundHtml({ template: html, years: 8 });

    expect(page).toContain('<title>Page introuvable - ADAM Issoufi</title>');
    expect(page).toContain('content="Cette page n’existe pas."');
    expect(page).not.toMatch(/%PAGE_\w+%/);
  });

  it('is not indexed and has no canonical URL or og:url', () => {
    const page = renderNotFoundHtml({ template: html, years: 8 });

    expect(page).toContain('<meta name="robots" content="noindex" />');
    expect(page).not.toContain('rel="canonical"');
    expect(page).not.toContain('og:url');
    expect(page.indexOf('noindex')).toBeLessThan(page.indexOf('</head>'));
  });

  it('uses the English title, description and language for the English not found page', () => {
    const page = renderNotFoundHtml({ template: html, language: 'en', years: 8 });

    expect(page).toContain('<html lang="en">');
    expect(page).toContain('<title>Page not found - ADAM Issoufi</title>');
    expect(page).toContain('content="This page does not exist."');
    expect(getMetaContent({ html: page, property: 'og:locale' })).toBe('en_US');
  });

  it('links to no translation, as it has no address of its own', () => {
    expect(renderNotFoundHtml({ template: html, years: 8 })).not.toContain('rel="alternate"');
    expect(renderNotFoundHtml({ template: html, language: 'en', years: 8 })).not.toContain(
      'hreflang',
    );
  });

  it('keeps the rest of the template, such as the app script', () => {
    const page = renderNotFoundHtml({ template: html, years: 8 });

    expect(page).toContain('src="/src/index.tsx"');
    expect(page).toContain('property="og:image"');
  });

  describe('edge cases', () => {
    it('does not fail on a template without canonical, og:url or head', () => {
      expect(renderNotFoundHtml({ template: '<p>%PAGE_TITLE%</p>', years: 8 })).toBe(
        '<p>Page introuvable - ADAM Issoufi</p>',
      );
    });

    it('returns an empty string for an empty template', () => {
      expect(renderNotFoundHtml({ template: '', years: 8 })).toBe('');
    });
  });
});

describe('renderPageHtml edge cases', () => {
  it('keeps apostrophes as they are, since attributes use double quotes', () => {
    const page = renderPageHtml({ template: '%PAGE_DESCRIPTION%', page: PAGES[1], years: 8 });

    expect(page).toBe(
      'Projets personnels et freelance d’ADAM Issoufi, développeur full-stack JavaScript.',
    );
  });

  it('leaves a template without placeholders unchanged', () => {
    expect(renderPageHtml({ template: '<p>static</p>', page: PAGES[0], years: 8 })).toBe(
      '<p>static</p>',
    );
  });
});

describe('background photo', () => {
  const html = readFileSync('index.html', 'utf-8');

  it.each([
    ...getPageFiles().map(({ page, language, fileName }) => ({
      fileName,
      render: () => renderPageHtml({ template: html, page, language, years: 8 }),
    })),
    ...getNotFoundFiles().map(({ language, fileName }) => ({
      fileName,
      render: () => renderNotFoundHtml({ template: html, language, years: 8 }),
    })),
  ])('is not preloaded by $fileName, so that it never delays the text', ({ render }) => {
    expect(render()).not.toMatch(/<link[^>]*\sas="image"/);
  });
});

describe('addModulePreload', () => {
  const href = '/assets/Projects-1a2b3c.js';
  const link = `<link rel="modulepreload" crossorigin href="${href}" />`;

  it('adds the link just before the end of the head', () => {
    expect(addModulePreload({ html: '<head>\n  </head>\n<body></body>', href })).toBe(
      `<head>\n    ${link}\n  </head>\n<body></body>`,
    );
  });

  it('keeps the rest of a generated page, in its head', () => {
    const template = readFileSync('index.html', 'utf-8');
    const page = renderPageHtml({ template, page: projects, years: 8 });
    const preloadedPage = addModulePreload({ html: page, href });

    expect(preloadedPage.replace(`    ${link}\n`, '')).toBe(page);
    expect(preloadedPage.indexOf(link)).toBeLessThan(preloadedPage.indexOf('</head>'));
  });

  it('escapes the URL for the attribute', () => {
    expect(addModulePreload({ html: '</head>', href: '/a"b&c.js' })).toContain(
      'href="/a&quot;b&amp;c.js"',
    );
  });

  describe('edge cases', () => {
    it.each([
      ['no URL', undefined],
      ['an empty URL', ''],
      ['a blank URL', ' \t\n'],
      ['a URL that is not a string', 42 as never],
    ])('leaves the page unchanged for %s', (_, missingHref) => {
      expect(addModulePreload({ html: '<head></head>', href: missingHref })).toBe('<head></head>');
    });

    it('leaves a page without a head unchanged', () => {
      expect(addModulePreload({ html: '<p>static</p>', href })).toBe('<p>static</p>');
    });

    it.each([
      ['no parameters', undefined],
      ['no HTML', { href }],
      ['HTML that is not a string', { html: null as never, href }],
    ])('returns an empty string for %s', (_, params) => {
      expect(addModulePreload(params)).toBe('');
    });
  });
});
