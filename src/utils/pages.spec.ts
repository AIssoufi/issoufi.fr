import { readFileSync, statSync } from 'node:fs';

import { PAGES, SITE_URL, getPage, renderNotFoundHtml, renderPageHtml } from './pages';

const [home, projects, experiences] = PAGES;

/** First bytes of every PNG file. */
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
/** Offsets of the width and height in a PNG file, inside its IHDR chunk. */
const PNG_WIDTH_OFFSET_BYTES = 16;
const PNG_HEIGHT_OFFSET_BYTES = 20;
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

describe('getPage', () => {
  it('finds the page matching the path', () => {
    expect(getPage('/')).toBe(home);
    expect(getPage('/projects')).toBe(projects);
    expect(getPage('/experiences')).toBe(experiences);
  });

  it('ignores a trailing slash', () => {
    expect(getPage('/projects/')).toBe(projects);
  });

  it('returns undefined for unknown paths', () => {
    expect(getPage('/skills')).toBeUndefined();
    expect(getPage('/projects/inconnu')).toBeUndefined();
  });
});

describe('renderPageHtml', () => {
  const template =
    '<title>%PAGE_TITLE%</title><meta content="%PAGE_DESCRIPTION%"><link href="%PAGE_URL%">';

  it('fills the home page metadata with the years of experience', () => {
    expect(renderPageHtml({ template, page: home, years: 8 })).toBe(
      '<title>ADAM Issoufi - Développeur full-stack JavaScript</title>' +
        '<meta content="Développeur full-stack JavaScript avec 8 ans d\'expérience, spécialisé React.">' +
        '<link href="https://issoufi.fr/">',
    );
  });

  it('fills the metadata and URL of the other pages', () => {
    expect(renderPageHtml({ template, page: projects, years: 8 })).toBe(
      '<title>Projets - ADAM Issoufi</title>' +
        '<meta content="Projets personnels et freelance d\'ADAM Issoufi, développeur full-stack JavaScript.">' +
        '<link href="https://issoufi.fr/projects">',
    );
    expect(renderPageHtml({ template, page: experiences, years: 8 })).toContain(
      '<link href="https://issoufi.fr/experiences">',
    );
  });

  it('fills every placeholder of index.html for every page', () => {
    const html = readFileSync('index.html', 'utf-8');

    expect(html.match(/%PAGE_TITLE%/g)).toHaveLength(3);
    expect(html.match(/%PAGE_DESCRIPTION%/g)).toHaveLength(3);
    expect(html.match(/%PAGE_URL%/g)).toHaveLength(2);
    PAGES.forEach(page =>
      expect(renderPageHtml({ template: html, page, years: 8 })).not.toMatch(/%PAGE_\w+%/),
    );
  });
});

describe('Open Graph image of index.html', () => {
  const html = readFileSync('index.html', 'utf-8');
  const imageUrl = getMetaContent({ html, property: 'og:image' }) ?? '';
  const imageFile = `public${imageUrl.replace(SITE_URL, '')}`;

  it('points to a file of public/ served by the site', () => {
    expect(imageUrl.startsWith(`${SITE_URL}/`)).toBe(true);
    expect(statSync(imageFile).isFile()).toBe(true);
  });

  it('is a PNG of the declared width and height', () => {
    const png = readFileSync(imageFile);

    expect(png.subarray(0, PNG_SIGNATURE.length)).toEqual(PNG_SIGNATURE);
    expect(png.readUInt32BE(PNG_WIDTH_OFFSET_BYTES)).toBe(
      Number(getMetaContent({ html, property: 'og:image:width' })),
    );
    expect(png.readUInt32BE(PNG_HEIGHT_OFFSET_BYTES)).toBe(
      Number(getMetaContent({ html, property: 'og:image:height' })),
    );
  });

  it('is light enough for every link preview', () => {
    expect(statSync(imageFile).size).toBeLessThan(OG_IMAGE_MAX_BYTES);
  });

  it('describes the image for screen readers', () => {
    expect(getMetaContent({ html, property: 'og:image:alt' })).toMatch(/ADAM Issoufi/);
  });

  it('is kept, with its description, in every generated page', () => {
    const generatedPages = [
      ...PAGES.map(page => renderPageHtml({ template: html, page, years: 8 })),
      renderNotFoundHtml({ template: html, years: 8 }),
    ];

    generatedPages.forEach(page => {
      expect(getMetaContent({ html: page, property: 'og:image' })).toBe(imageUrl);
      expect(getMetaContent({ html: page, property: 'og:image:alt' })).toMatch(/ADAM Issoufi/);
    });
  });
});

describe('renderNotFoundHtml', () => {
  const html = readFileSync('index.html', 'utf-8');

  it('uses the not found title and description', () => {
    const page = renderNotFoundHtml({ template: html, years: 8 });

    expect(page).toContain('<title>Page introuvable - ADAM Issoufi</title>');
    expect(page).toContain('content="Cette page n\'existe pas."');
    expect(page).not.toMatch(/%PAGE_\w+%/);
  });

  it('is not indexed and has no canonical URL or og:url', () => {
    const page = renderNotFoundHtml({ template: html, years: 8 });

    expect(page).toContain('<meta name="robots" content="noindex" />');
    expect(page).not.toContain('rel="canonical"');
    expect(page).not.toContain('og:url');
    expect(page.indexOf('noindex')).toBeLessThan(page.indexOf('</head>'));
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
      "Projets personnels et freelance d'ADAM Issoufi, développeur full-stack JavaScript.",
    );
  });

  it('leaves a template without placeholders unchanged', () => {
    expect(renderPageHtml({ template: '<p>static</p>', page: PAGES[0], years: 8 })).toBe(
      '<p>static</p>',
    );
  });
});
