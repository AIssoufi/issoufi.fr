import { readFileSync, statSync } from 'node:fs';

import { LANGUAGES } from '../i18n/constants';
import { en } from '../i18n/en';
import { fr } from '../i18n/fr';
import {
  addModulePreload,
  DEFAULT_BASE,
  renderNotFoundHtml,
  renderPageHtml,
  toBaseUrl,
} from './pageHtml';
import {
  OG_IMAGE_PATHS,
  PAGES,
  PORTRAIT_PHOTO_MEDIA_QUERY,
  SITE_URL,
  STATUS_PAGE_BACKGROUND_PHOTO,
  getNotFoundFiles,
  getPageFiles,
} from './pages';

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

describe('preload of the background photo', () => {
  const html = readFileSync('index.html', 'utf-8');

  /** `media` of the link that preloads the portrait version, as written in the HTML. */
  const PORTRAIT_MEDIA = PORTRAIT_PHOTO_MEDIA_QUERY.replace('<', '&lt;');

  /** Lists the URL and the media query of each link of a page that preloads an image. */
  const getImagePreloads = (page: string) =>
    [...page.matchAll(/<link rel="preload" as="image" href="([^"]*)" media="([^"]*)" \/>/g)].map(
      ([, href, media]) => [href, media],
    );

  it.each(getPageFiles().map(({ page, language, fileName }) => ({ page, language, fileName })))(
    'preloads the photo of $fileName, the portrait version on narrow portrait screens only',
    ({ page, language }) => {
      const { url, portraitUrl } = page.backgroundPhoto;

      expect(
        getImagePreloads(renderPageHtml({ template: html, page, language, years: 8 })),
      ).toEqual([
        [portraitUrl, PORTRAIT_MEDIA],
        [url, `not all and ${PORTRAIT_MEDIA}`],
      ]);
    },
  );

  it('escapes the media queries for their attribute, as the browser reads them back', () => {
    const page = renderPageHtml({ template: html, page: home, years: 8 });

    expect(PORTRAIT_PHOTO_MEDIA_QUERY).toContain('<');
    expect(page).not.toContain(`media="${PORTRAIT_PHOTO_MEDIA_QUERY}"`);
  });

  it('puts the links at the end of the head, after the links to the translations', () => {
    const page = renderPageHtml({ template: html, page: projects, years: 8 });
    const preloadPosition = page.indexOf('as="image" href="/projects-portrait.webp"');

    expect(preloadPosition).toBeGreaterThan(page.indexOf('hreflang="x-default"'));
    expect(preloadPosition).toBeLessThan(page.indexOf('</head>'));
    expect(page).toContain('\n    <link rel="preload" as="image" href="/projects.webp"');
  });

  it('preloads the photo relative to the page under the base of the standalone build', () => {
    const page = renderPageHtml({ template: html, page: home, years: 8, base: './' });

    expect(getImagePreloads(page).map(([href]) => href)).toEqual([
      './home-portrait.webp',
      './home.webp',
    ]);
  });

  it('preloads the photo from the root of the site without a base', () => {
    const page = renderPageHtml({ template: html, page: experiences, years: 8 });

    expect(getImagePreloads(page).map(([href]) => href)).toEqual([
      '/experiences-portrait.webp',
      '/experiences.webp',
    ]);
  });

  it.each(getNotFoundFiles())(
    'preloads the photo of the status pages in the not found page $fileName',
    ({ language }) => {
      const { url, portraitUrl } = STATUS_PAGE_BACKGROUND_PHOTO;

      expect(getImagePreloads(renderNotFoundHtml({ template: html, language, years: 8 }))).toEqual([
        [portraitUrl, PORTRAIT_MEDIA],
        [url, `not all and ${PORTRAIT_MEDIA}`],
      ]);
    },
  );

  it('preloads the photo of the status pages under the base of the standalone build', () => {
    const page = renderNotFoundHtml({ template: html, years: 8, base: './' });

    expect(getImagePreloads(page).map(([href]) => href)).toEqual([
      './home-portrait.webp',
      './home.webp',
    ]);
  });

  describe('edge cases', () => {
    it('preloads only the version of the photo that has a URL', () => {
      const page = { ...home, backgroundPhoto: { url: '/home.webp', portraitUrl: ' ' } };

      expect(
        getImagePreloads(renderPageHtml({ template: html, page: page as never, years: 8 })),
      ).toEqual([['/home.webp', `not all and ${PORTRAIT_MEDIA}`]]);
    });

    it.each([
      ['no photo', undefined],
      ['a photo without URLs', {}],
    ])('preloads no image for a page with %s', (_, backgroundPhoto) => {
      const page = { ...home, backgroundPhoto };

      expect(
        getImagePreloads(renderPageHtml({ template: html, page: page as never, years: 8 })),
      ).toEqual([]);
    });
  });
});

describe('toBaseUrl', () => {
  it('keeps an absolute URL under the root base', () => {
    expect(toBaseUrl({ url: '/home.webp', base: '/' })).toBe('/home.webp');
  });

  it('makes the URL relative to the page under the base of the standalone build', () => {
    expect(toBaseUrl({ url: '/home.webp', base: './' })).toBe('./home.webp');
  });

  it('puts the URL under a base path in a folder', () => {
    expect(toBaseUrl({ url: '/fonts/a.woff2', base: '/site/' })).toBe('/site/fonts/a.woff2');
  });

  it('writes the URL once under the base, whatever its leading slashes and spaces', () => {
    expect(toBaseUrl({ url: ' //home.webp ', base: './' })).toBe('./home.webp');
    expect(toBaseUrl({ url: 'home.webp', base: './' })).toBe('./home.webp');
  });

  describe('edge cases', () => {
    it.each([
      ['no base', undefined],
      ['an empty base', ''],
      ['a base without a trailing slash', '/site'],
      ['a base that is not a string', 42 as never],
    ])('uses the root of the site for %s', (_, base) => {
      expect(toBaseUrl({ url: '/home.webp', base })).toBe(`${DEFAULT_BASE}home.webp`);
    });

    it.each([
      ['no URL', undefined],
      ['an empty URL', ''],
      ['a blank URL', ' \t'],
      ['a URL that is not a string', 42 as never],
    ])('returns an empty string for %s', (_, url) => {
      expect(toBaseUrl({ url, base: '/' })).toBe('');
    });

    it('returns an empty string without parameters', () => {
      expect(toBaseUrl()).toBe('');
    });
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
