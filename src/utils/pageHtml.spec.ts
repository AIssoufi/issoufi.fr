import { readFileSync, statSync } from 'node:fs';

import { LANGUAGES } from '../i18n/constants.ts';
import { en } from '../i18n/en.ts';
import { fr } from '../i18n/fr.ts';
import {
  addModulePreload,
  addPrerenderedPage,
  renderNotFoundHtml,
  renderPageHtml,
} from './pageHtml.ts';
import {
  LANDSCAPE_PHOTO_MEDIA_QUERY,
  OG_IMAGE_PATHS,
  PAGES,
  PORTRAIT_PHOTO_MEDIA_QUERY,
  SITE_URL,
  getNotFoundFiles,
  getPageFiles,
} from './pages.ts';
import { getStructuredData } from './structuredData.ts';
import { APP_CONTAINER_ID, PRERENDERED_PATH_ATTRIBUTE } from './prerender.ts';
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
  it('is not in index.html, since every page holds its content (see addPrerenderedPage)', () => {
    expect(readFileSync('index.html', 'utf-8')).not.toContain('<noscript>');
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
  ])('is left by the metadata of $fileName to the page rendered at build time', ({ render }) => {
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

describe('addPrerenderedPage', () => {
  const html = '<head>\n  </head>\n<body>\n  <div id="welcome"></div>\n</body>';
  const page = {
    html: '<main><h1>Projets</h1></main>',
    styleTags: '<style data-styled="true">.a{color:red;}</style>',
  };

  it('puts the page in the container, which names the path to hydrate', () => {
    expect(addPrerenderedPage({ html, page, hydrationPath: '/en/projects' })).toContain(
      `<div id="welcome" ${PRERENDERED_PATH_ATTRIBUTE}="/en/projects"><main><h1>Projets</h1></main></div>`,
    );
  });

  it('adds the styles of the page at the end of the head', () => {
    expect(addPrerenderedPage({ html, page, hydrationPath: '/' })).toMatch(
      /^<head>\n {4}<style data-styled="true">\.a\{color:red;\}<\/style>\n {2}<\/head>/,
    );
  });

  it('fills the container of index.html, the one that the app renders in', () => {
    const template = readFileSync('index.html', 'utf-8');

    expect(template).toContain(`<div id="${APP_CONTAINER_ID}"></div>`);
    expect(addPrerenderedPage({ html: template, page, hydrationPath: '/' })).toContain(
      '<main><h1>Projets</h1></main>',
    );
  });

  it.each([
    ['no path', undefined],
    ['an empty path', ''],
    ['a blank path', ' \t'],
  ])('names no path to hydrate with %s, as for a not found page', (_, hydrationPath) => {
    expect(addPrerenderedPage({ html, page, hydrationPath })).toContain(
      '<div id="welcome"><main><h1>Projets</h1></main></div>',
    );
  });

  it('escapes the path for the attribute', () => {
    expect(addPrerenderedPage({ html, page, hydrationPath: '/a"b&c' })).toContain(
      `${PRERENDERED_PATH_ATTRIBUTE}="/a&quot;b&amp;c"`,
    );
  });

  it.each(['$&', "$'", '$`', '$$', '$1'])(
    'inserts the page and its styles as they are, even with %s, a pattern of replace',
    pattern => {
      const result = addPrerenderedPage({
        html,
        page: { html: `<p>${pattern}</p>`, styleTags: `<style>/*${pattern}*/</style>` },
      });

      expect(result).toContain(`<div id="welcome"><p>${pattern}</p></div>`);
      expect(result).toContain(`<style>/*${pattern}*/</style>\n  </head>`);
    },
  );

  it.each([
    ['no styles', ''],
    ['blank styles', ' '],
  ])('adds nothing to the head with %s', (_, styleTags) => {
    expect(addPrerenderedPage({ html, page: { html: '<main></main>', styleTags } })).toBe(
      '<head>\n  </head>\n<body>\n  <div id="welcome"><main></main></div>\n</body>',
    );
  });

  describe('downloads of the first paint', () => {
    const scriptTags = [
      '<script type="module" crossorigin src="/assets/index-1a2b.js"></script>',
      '<link rel="modulepreload" crossorigin href="/assets/vendor-1a2b.js">',
      '<link rel="modulepreload" crossorigin href="/assets/Projects-1a2b.js" />',
    ];
    const lowScriptTags = [
      '<script type="module" fetchpriority="low" crossorigin src="/assets/index-1a2b.js"></script>',
      '<link rel="modulepreload" fetchpriority="low" crossorigin href="/assets/vendor-1a2b.js">',
      '<link rel="modulepreload" fetchpriority="low" crossorigin href="/assets/Projects-1a2b.js" />',
    ];
    const otherTags = [
      '<script type="application/ld+json">{"@context":"https://schema.org"}</script>',
      '<link rel="preload" href="/fonts/a.woff2" as="font" type="font/woff2" crossorigin>',
      '<link rel="manifest" href="/manifest.webmanifest" />',
    ];
    const photo = {
      url: '/projects.webp',
      portraitUrl: '/projects-portrait.webp',
      placeholderUrl: 'data:image/webp;base64,UklGR',
    };
    const portraitPreload = `<link rel="preload" as="image" href="/projects-portrait.webp" media="${PORTRAIT_PHOTO_MEDIA_QUERY.replaceAll('<', '&lt;')}" fetchpriority="low" />`;
    const landscapePreload = `<link rel="preload" as="image" href="/projects.webp" media="${LANDSCAPE_PHOTO_MEDIA_QUERY.replaceAll('<', '&lt;')}" fetchpriority="low" />`;

    /** Lists the links of a page that preload an image. */
    const getImagePreloads = (result: string) =>
      result.match(/<link rel="preload" as="image"[^>]*>/g) ?? [];

    it('downloads the scripts of the app at a low priority, since they only hydrate the page', () => {
      const result = addPrerenderedPage({
        html: `<head>\n${[...scriptTags, ...otherTags].join('\n')}\n  </head>\n<body>\n  <div id="welcome"></div>\n</body>`,
        page,
      });

      [...lowScriptTags, ...otherTags].forEach(tag => expect(result).toContain(tag));
      scriptTags.forEach(tag => expect(result).not.toContain(tag));
    });

    it('preloads each version of the photo at a low priority, for the screens that show it', () => {
      expect(getImagePreloads(addPrerenderedPage({ html, page, backgroundPhoto: photo }))).toEqual([
        portraitPreload,
        landscapePreload,
      ]);
    });

    it('preloads the photo at the end of the head, before the styles that request it', () => {
      expect(addPrerenderedPage({ html, page, backgroundPhoto: photo })).toMatch(
        /^<head>\n {4}<link rel="preload" as="image" href="\/projects-portrait\.webp"[^\n]*\n {4}<link rel="preload" as="image" href="\/projects\.webp"[^\n]*\n {4}<style data-styled="true">/,
      );
    });

    it('preloads the photo of a page without styles', () => {
      const result = addPrerenderedPage({
        html,
        page: { html: '<main></main>', styleTags: '' },
        backgroundPhoto: photo,
      });

      expect(getImagePreloads(result)).toEqual([portraitPreload, landscapePreload]);
    });

    it('escapes the URLs of the photo for the attribute', () => {
      const result = addPrerenderedPage({
        html,
        page,
        backgroundPhoto: { url: '/a"b&c.webp', portraitUrl: '/d.webp' },
      });

      expect(result).toContain('href="/a&quot;b&amp;c.webp"');
    });

    describe('edge cases', () => {
      it.each([
        ['no URL of its portrait version', { url: '/projects.webp' }, '/projects.webp'],
        ['a blank URL of its portrait version', { url: '/a.webp', portraitUrl: ' ' }, '/a.webp'],
        ['no URL of its whole version', { portraitUrl: '/a-portrait.webp' }, '/a-portrait.webp'],
        ['the same file twice', { url: '/a.webp', portraitUrl: '/a.webp' }, '/a.webp'],
        ['URLs around white space', { url: ' /a.webp ', portraitUrl: '/a.webp\n' }, '/a.webp'],
      ])(
        'preloads a single file on every screen, for a photo with %s',
        (_, backgroundPhoto, href) => {
          expect(getImagePreloads(addPrerenderedPage({ html, page, backgroundPhoto }))).toEqual([
            `<link rel="preload" as="image" href="${href}" fetchpriority="low" />`,
          ]);
        },
      );

      it.each([
        ['no photo', undefined],
        ['a photo without URLs', {}],
        ['a photo of blank URLs', { url: '', portraitUrl: ' \t' }],
        ['a photo of URLs that are not strings', { url: 42, portraitUrl: null } as never],
        ['a photo that is null', null as never],
      ])('preloads no image for %s', (_, backgroundPhoto) => {
        expect(getImagePreloads(addPrerenderedPage({ html, page, backgroundPhoto }))).toEqual([]);
      });

      it('changes no script and preloads no photo without a page, as in the standalone build', () => {
        const template = `<head>\n${scriptTags.join('\n')}\n  </head>\n<body>\n  <div id="welcome"></div>\n</body>`;

        expect(addPrerenderedPage({ html: template, backgroundPhoto: photo })).toBe(template);
      });
    });
  });

  describe('edge cases', () => {
    it('leaves the HTML unchanged without a page, as in the standalone build', () => {
      expect(addPrerenderedPage({ html, hydrationPath: '/' })).toBe(html);
    });

    it('leaves the HTML unchanged without an empty container, as when it is already filled', () => {
      const filled = addPrerenderedPage({ html, page });

      expect(addPrerenderedPage({ html: filled, page })).toBe(filled);
      expect(addPrerenderedPage({ html: '<head></head>', page })).toBe('<head></head>');
    });

    it.each([
      ['no parameters', undefined],
      ['no HTML', { page }],
      ['HTML that is not a string', { html: 42 as never, page }],
    ])('returns an empty string for %s', (_, params) => {
      expect(addPrerenderedPage(params)).toBe('');
    });
  });
});
