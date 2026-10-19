// @vitest-environment node
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { build, normalizePath, type Plugin, resolveConfig, type Rolldown } from 'vite';

import { isGoogleHost } from './e2e/utils';
import { GITHUB_PROFILE_URL, LINKEDIN_PROFILE_URL } from './src/constants/profiles';
import { DEFAULT_LANGUAGE, LANGUAGES } from './src/i18n/constants';
import { en } from './src/i18n/en';
import { fr } from './src/i18n/fr';
import { FONT_FACES } from './src/theme/constants';
import { renderFontFaces } from './src/theme/utils';
import { getYearsOfExperience } from './src/utils/career';
import { APP_ICONS } from './src/utils/icons';
import {
  getNotFoundFiles,
  getOgImageUrl,
  getPageFiles,
  HOME_PAGE,
  NOT_FOUND_FOLDER,
  PAGES,
  SITE_URL,
} from './src/utils/pages';
import { renderSitemap, SITEMAP_FILE_NAME } from './src/utils/sitemap';
import { getWebManifestFiles, getWebManifestUrl, renderWebManifest } from './src/utils/webManifest';
import {
  ASSETS_DIR,
  HEADERS_FILE_NAME,
  NODE_MODULES_PATTERN,
  PAGE_ENTRY_FILE,
  PAGES_DIR,
  PAGES_PROJECT_HOST,
  SECURITY_HEADERS,
  SHARED_CHUNK_NAME,
  VENDOR_CHUNK_NAME,
} from './vite/constants';
import { renderHeaderRules } from './vite/utils';

/** Longest time the production build may take in this test, coverage included. */
const BUILD_TIMEOUT_MS = 60_000;

/** URL of each `modulepreload` link of an HTML page. */
const MODULE_PRELOAD_HREF_PATTERN = /<link rel="modulepreload" crossorigin href="([^"]*)"/g;

/** Host of each URL that a file names with `//`, with or without its scheme. */
const URL_HOST_PATTERN = /\/\/([\w.-]+)/g;

/** Link tag of an HTML page, from `<link` to `>`, its attributes on one or several lines. */
const LINK_TAG_PATTERN = /<link\b[^>]*>/g;

/**
 * Name of a file of the assets folder: a name, then the 8 characters of the hash of its content
 * that Rolldown writes for `[hash]`, then an extension.
 */
const HASHED_FILE_NAME_PATTERN = new RegExp(`^${ASSETS_DIR}/[^/]+-[\\w-]{8}\\.\\w+$`);

/** Module path of a page chunk: the index file of a folder of `src/pages`. */
const PAGE_ENTRY_PATTERN = new RegExp(`/${PAGES_DIR}/[^/]+/${PAGE_ENTRY_FILE}$`);

/** File of the build: a chunk of scripts or an asset, such as an HTML page. */
type OutputFile = Rolldown.OutputChunk | Rolldown.OutputAsset;

/** Files of the build, written in memory only. */
let output: OutputFile[] = [];

/**
 * Output options of the build, as Rolldown normalized them, with the templates of the file names.
 */
let outputOptions: Rolldown.NormalizedOutputOptions | undefined;

/** Records the output options of the build, once Rolldown has normalized them. */
const recordOutputOptions = (): Plugin => ({
  name: 'record-output-options',
  renderStart(options) {
    outputOptions = options;
  },
});

/** Builds the site in memory with the config of the project and extra plugins: lists its files. */
const buildSite = async (plugins: Plugin[]) => {
  const result = await build({
    configFile: 'vite.config.ts',
    // Node.js loads the config, as in the scripts of package.json, and fails on an import that it
    // cannot resolve, such as one without the extension of its file
    configLoader: 'native',
    logLevel: 'silent',
    plugins,
    build: { write: false },
  });
  return (Array.isArray(result) ? result[0] : (result as Rolldown.RolldownOutput)).output;
};

beforeAll(async () => {
  // Vitest sets NODE_ENV to test, which would bundle the development build of React
  vi.stubEnv('NODE_ENV', 'production');
  output = await buildSite([recordOutputOptions()]);
}, BUILD_TIMEOUT_MS);

afterAll(() => {
  vi.unstubAllEnvs();
});

/** Tells whether a file of the build is a chunk of scripts. */
const isChunk = (file: OutputFile): file is Rolldown.OutputChunk => file.type === 'chunk';

/** Tells whether a file of the build is an asset, such as an HTML page. */
const isAsset = (file: OutputFile): file is Rolldown.OutputAsset => file.type === 'asset';

/** Reads a file of the build, such as an HTML page, or an empty string when the build has none. */
const getSource = (fileName: string) =>
  String(output.filter(isAsset).find(file => file.fileName === fileName)?.source ?? '');

/**
 * Reads the template that names a file of the build, such as `assets/[name]-[hash].js`: the one of
 * the assets, of the entry chunks or of the other chunks, written by a function or not.
 */
const getFileNameTemplate = (file: OutputFile) => {
  if (isAsset(file)) {
    const template = outputOptions?.assetFileNames;
    if (typeof template !== 'function') return template;

    // The function reads the asset as Rolldown passes it before naming it
    const { type, names, originalFileNames, source } = file;
    return template({ type, names, originalFileNames, source });
  }

  const template = file.isEntry ? outputOptions?.entryFileNames : outputOptions?.chunkFileNames;
  return typeof template === 'function' ? template(file) : template;
};

/** Lists the URLs of the scripts that an HTML page preloads. */
const getPreloadedUrls = (html: string) =>
  [...html.matchAll(MODULE_PRELOAD_HREF_PATTERN)].map(([, href]) => href);

/** URLs of the chunks built from a page folder. */
const getPageChunkUrls = () =>
  output
    .filter(isChunk)
    .filter(chunk => PAGE_ENTRY_PATTERN.test(chunk.facadeModuleId ?? ''))
    .map(chunk => `/${chunk.fileName}`);

/** URL of the chunk built from the index file of a page folder. */
const getPageChunkUrl = (folder: string) => {
  const entry = normalizePath(resolve(PAGES_DIR, folder, PAGE_ENTRY_FILE));
  const chunk = output.filter(isChunk).find(file => file.facadeModuleId === entry);
  return chunk && `/${chunk.fileName}`;
};

/** Lists the page chunks that an HTML page preloads. */
const getPreloadedPageChunks = (html: string) => {
  const pageChunkUrls = getPageChunkUrls();
  return getPreloadedUrls(html).filter(href => pageChunkUrls.includes(href));
};

/** Parameters of {@link getStaticImportUrls}. */
interface GetStaticImportUrlsParams {
  /** Files of a build. */
  files: OutputFile[];
  /** URL of a chunk of the build, e.g. `/assets/Projects-1a2b3c.js`. */
  url?: string;
}

/** Parameters of {@link walkStaticImports}. */
interface WalkStaticImportsParams {
  /** Chunks of a build, by URL. */
  chunks: Map<string, Rolldown.OutputChunk>;
  /** URLs of the chunks to start from. */
  urls: string[];
  /** URLs to neither list nor walk through. */
  excluded?: Set<string>;
}

/** Lists the URLs of chunks and of every chunk that they import statically, directly or not. */
const walkStaticImports = ({ chunks, urls, excluded = new Set() }: WalkStaticImportsParams) => {
  const found = new Set<string>();
  const pending = [...urls];

  while (pending.length > 0) {
    const current = pending.pop() ?? '';
    const chunk = chunks.get(current);
    const isNewChunk = chunk !== undefined && !found.has(current) && !excluded.has(current);
    if (isNewChunk) {
      found.add(current);
      pending.push(...chunk.imports.map(fileName => `/${fileName}`));
    }
  }

  return found;
};

/**
 * Lists, sorted, the URL of a chunk and of every chunk that it imports statically, directly or
 * not, except the entry chunks and what they import, which the template loads: what a page must
 * preload besides the main chunk.
 */
const getStaticImportUrls = ({ files, url }: GetStaticImportUrlsParams) => {
  const chunks = new Map(files.filter(isChunk).map(chunk => [`/${chunk.fileName}`, chunk]));
  const entryUrls = [...chunks].filter(([, chunk]) => chunk.isEntry).map(([entryUrl]) => entryUrl);
  const templateUrls = walkStaticImports({ chunks, urls: entryUrls });
  const pageUrls = walkStaticImports({ chunks, urls: url ? [url] : [], excluded: templateUrls });
  return [...pageUrls].sort();
};

/** Parameters of {@link getOwnPreloadedUrls}. */
interface GetOwnPreloadedUrlsParams {
  /** HTML of a generated page. */
  html: string;
  /** HTML of the home page of the same language, built from the template of every page. */
  homeHtml: string;
}

/** Lists, sorted, the URLs that a page preloads and the home page does not. */
const getOwnPreloadedUrls = ({ html, homeHtml }: GetOwnPreloadedUrlsParams) => {
  const templateUrls = getPreloadedUrls(homeHtml);
  return getPreloadedUrls(html)
    .filter(href => !templateUrls.includes(href))
    .sort();
};

/** Module that {@link shareModule} adds to some lazy pages, as they import it. */
const SHARED_MODULE_ID = 'virtual:shared-page-module';

/** Path of {@link SHARED_MODULE_ID} once resolved: a virtual module, which no file holds. */
const RESOLVED_SHARED_MODULE_ID = `\0${SHARED_MODULE_ID}`;

/** Folders of the lazy pages that import {@link SHARED_MODULE_ID} in the build of `shareModule`. */
const SHARING_PAGE_FOLDERS = ['Projects', 'Experiences'];

/**
 * Test plugin that makes the pages of {@link SHARING_PAGE_FOLDERS} import one more module, with a
 * side effect so it stays: a module that only lazy pages import becomes a chunk of its own.
 */
const shareModule = (): Plugin => {
  const pageEntries = SHARING_PAGE_FOLDERS.map(folder =>
    normalizePath(resolve(PAGES_DIR, folder, PAGE_ENTRY_FILE)),
  );

  return {
    name: 'share-module',
    resolveId: id => (id === SHARED_MODULE_ID ? RESOLVED_SHARED_MODULE_ID : null),
    load: id => (id === RESOLVED_SHARED_MODULE_ID ? 'globalThis.sharedPageModule = true;' : null),
    transform: (code, id) =>
      pageEntries.includes(id) ? `import '${SHARED_MODULE_ID}';\n${code}` : null,
  };
};

/** Lists the hosts of Google that a file of the build names in a URL. */
const findGoogleHosts = (code: string) =>
  [...code.matchAll(URL_HOST_PATTERN)].map(([, host]) => host).filter(isGoogleHost);

/** Parameters of {@link getPreloads}. */
interface GetPreloadsParams {
  /** HTML of a page, or a part of it such as its head. */
  html: string;
  /** Kind of file that the links preload, their `as` attribute, e.g. `font`. */
  as: string;
}

/** Lists the link tags of an HTML page that preload a kind of file, each on one line. */
const getPreloads = ({ html, as }: GetPreloadsParams) =>
  (html.match(LINK_TAG_PATTERN) ?? [])
    .map(tag => tag.replace(/\s+/g, ' '))
    .filter(tag => tag.includes('rel="preload"') && tag.includes(`as="${as}"`));

/** Lists the link tags of an HTML page that preload a font, each on one line. */
const getFontPreloads = (html: string) => getPreloads({ html, as: 'font' });

/** Parameters of {@link getLinks}. */
interface GetLinksParams {
  /** HTML of a page, or a part of it such as its head. */
  html: string;
  /** Relation of the links, their `rel` attribute, e.g. `icon`. */
  rel: string;
}

/** Lists the link tags of an HTML page of a relation, each on one line. */
const getLinks = ({ html, rel }: GetLinksParams) =>
  (html.match(LINK_TAG_PATTERN) ?? [])
    .map(tag => tag.replace(/\s+/g, ' '))
    .filter(tag => tag.includes(` rel="${rel}"`));

/** Lists the URL of each link of an HTML page of a relation. */
const getLinkUrls = (params: GetLinksParams) =>
  getLinks(params).map(tag => tag.match(/\shref="([^"]*)"/)?.[1]);

/** Translations of each language, to read the titles the pages must have. */
const TRANSLATIONS = { fr, en };

/** Reads the language of an HTML page, in its `<html lang>`. */
const getHtmlLanguage = (html: string) => html.match(/<html lang="([^"]*)">/)?.[1];

/** Reads the title of an HTML page. */
const getTitle = (html: string) => html.match(/<title>([^<]*)<\/title>/)?.[1];

/** Reads the URL of the link preview image of an HTML page, in its `og:image`. */
const getOgImage = (html: string) => html.match(/property="og:image"\s+content="([^"]*)"/)?.[1];

/** Canonical link of an HTML page, on any number of lines. Its first group captures the URL. */
const CANONICAL_URL_PATTERN = /<link\s+rel="canonical"\s+href="([^"]*)"/;

/**
 * Link to a translation, in the head of an HTML page or in a `url` of the sitemap (`xhtml:link`).
 * Its groups capture the `hreflang` and the URL.
 */
const ALTERNATE_LINK_PATTERN =
  /<(?:xhtml:)?link rel="alternate" hreflang="([^"]*)" href="([^"]*)"/g;

/** `url` element of the sitemap, from its opening to its closing tag. */
const SITEMAP_URL_PATTERN = /<url>[\s\S]*?<\/url>/g;

/** Location of a `url` of the sitemap. Its first group captures the URL. */
const SITEMAP_LOCATION_PATTERN = /<loc>([^<]*)<\/loc>/g;

/** Reads the canonical URL of an HTML page. */
const getCanonicalUrl = (html: string) => html.match(CANONICAL_URL_PATTERN)?.[1];

/** Lists the `hreflang` and the URL of each link to a translation, of a page or a sitemap URL. */
const getAlternateLinks = (markup: string) =>
  [...markup.matchAll(ALTERNATE_LINK_PATTERN)].map(([, hreflang, href]) => [hreflang, href]);

/** Lists the locations of the URLs of the sitemap, in its order. */
const getSitemapLocations = (sitemap: string) =>
  [...sitemap.matchAll(SITEMAP_LOCATION_PATTERN)].map(([, location]) => location);

/** Parameters of {@link getSitemapUrlEntry}. */
interface GetSitemapUrlEntryParams {
  /** XML of the sitemap. */
  sitemap: string;
  /** Location of the URL to find, e.g. `https://issoufi.fr/en/projects`. */
  location: string;
}

/** Finds the `url` element of the sitemap for a location, or an empty string without one. */
const getSitemapUrlEntry = ({ sitemap, location }: GetSitemapUrlEntryParams) =>
  sitemap.match(SITEMAP_URL_PATTERN)?.find(url => url.includes(`<loc>${location}</loc>`)) ?? '';

/** Script tag of an HTML page, from `<script` to `>`, its attributes on one or several lines. */
const SCRIPT_TAG_PATTERN = /<script\b[^>]*>/g;

/** `src` attribute of a tag, naming a file. */
const SOURCE_ATTRIBUTE_PATTERN = /\ssrc="[^"]+"/;

/** `type` attribute of a script element of structured data, which browsers do not run. */
const DATA_BLOCK_TYPE_PATTERN = /\stype="application\/ld\+json"/;

/** Tells whether a script tag runs inline code: it has no file to run, and holds no data block. */
const isInlineScriptTag = (tag: string) => {
  const hasSourceFile = SOURCE_ATTRIBUTE_PATTERN.test(tag);
  const isDataBlock = DATA_BLOCK_TYPE_PATTERN.test(tag);
  return !hasSourceFile && !isDataBlock;
};

/** Lists the script tags of an HTML page that run inline code. */
const getInlineScriptTags = (html: string) =>
  (html.match(SCRIPT_TAG_PATTERN) ?? []).filter(isInlineScriptTag);

/** Script element of structured data in an HTML page. Its first group captures its JSON. */
const STRUCTURED_DATA_SCRIPT_PATTERN = /<script type="application\/ld\+json">([^<]*)<\/script>/g;

/** Vocabulary that the structured data of every page must name in its `@context`. */
const SCHEMA_ORG_URL = 'https://schema.org';

/** Types of schema.org of the node that describes a page itself, in its structured data. */
const PAGE_NODE_TYPES = ['ProfilePage', 'WebPage'];

/** A node of the structured data of a page, as parsed from its JSON. */
interface StructuredDataNode {
  '@type'?: string;
  '@id'?: string;
  url?: string;
  name?: string;
  inLanguage?: string;
  jobTitle?: string;
  sameAs?: string[];
  mainEntity?: StructuredDataNode;
}

/** Reads the structured data that each script element of an HTML page declares, parsed. */
const readStructuredData = (html: string) =>
  [...html.matchAll(STRUCTURED_DATA_SCRIPT_PATTERN)].map(
    ([, json]) => JSON.parse(json) as { '@context'?: string; '@graph'?: StructuredDataNode[] },
  );

/** Parameters of {@link findNodes}. */
interface FindNodesParams {
  /** Graph of the structured data of a page. Missing, it counts as empty. */
  nodes?: StructuredDataNode[];
  /** Types of schema.org of the nodes to find, e.g. `WebSite`. */
  types: string[];
}

/** Lists the nodes of some types of schema.org in the graph of structured data. */
const findNodes = ({ nodes = [], types }: FindNodesParams) =>
  nodes.filter(node => types.includes(node['@type'] ?? ''));

/** Content Security Policy line of `_headers`. Its first group captures the policy. */
const CONTENT_SECURITY_POLICY_LINE_PATTERN = /^ {2}Content-Security-Policy: (.*)$/m;

/** Reads the sources of each directive of the Content Security Policy that `_headers` sends. */
const getPolicyDirectives = (headersFile: string) => {
  const policy = headersFile.match(CONTENT_SECURITY_POLICY_LINE_PATTERN)?.[1] ?? '';
  return Object.fromEntries(
    policy.split(';').map(directive => {
      const [name, ...sources] = directive.trim().split(/\s+/);
      return [name, sources];
    }),
  );
};

/** Folder of the modules of the site, as a module path of the build. */
const SITE_SOURCE_DIR = normalizePath(resolve('src'));

/** Module of the `Page` component, which the home page and the lazy pages render. */
const PAGE_COMPONENT_MODULE = normalizePath(resolve('src/components/Page/Page.tsx'));

/** Tells whether a module of the build is part of a library of `node_modules`. */
const isLibraryModule = (moduleId: string) => NODE_MODULES_PATTERN.test(moduleId);

/** Tells whether a module of the build is a module of the site, in `src/`. */
const isSiteModule = (moduleId: string) => moduleId.startsWith(`${SITE_SOURCE_DIR}/`);

/** Finds the chunk of the build that has a name, such as the vendor chunk. */
const findNamedChunk = (name: string) => output.filter(isChunk).find(chunk => chunk.name === name);

/** Finds the entry chunk of the build, the main chunk that every page loads. */
const findEntryChunk = () => output.filter(isChunk).find(chunk => chunk.isEntry);

describe('chunks of the build', () => {
  it(`puts the libraries of the first load in the ${VENDOR_CHUNK_NAME} chunk, apart from the code of the site`, () => {
    const vendorChunk = findNamedChunk(VENDOR_CHUNK_NAME);
    const otherFirstLoadChunks = [findEntryChunk(), findNamedChunk(SHARED_CHUNK_NAME)];

    expect(vendorChunk?.fileName).toMatch(new RegExp(`^${ASSETS_DIR}/${VENDOR_CHUNK_NAME}-`));
    expect(vendorChunk?.moduleIds.some(isLibraryModule)).toBe(true);
    expect(vendorChunk?.moduleIds.filter(isSiteModule)).toEqual([]);
    otherFirstLoadChunks.forEach(chunk => {
      expect(chunk?.moduleIds.filter(isLibraryModule)).toEqual([]);
    });
  });

  it(`puts the modules that the main chunk shares with the lazy pages in the ${SHARED_CHUNK_NAME} chunk`, () => {
    const sharedChunk = findNamedChunk(SHARED_CHUNK_NAME);
    const pageChunksUsingIt = output.filter(isChunk).filter(chunk => {
      const isPageChunk = PAGE_ENTRY_PATTERN.test(chunk.facadeModuleId ?? '');
      return isPageChunk && chunk.imports.includes(sharedChunk?.fileName ?? '');
    });

    expect(sharedChunk?.fileName).toMatch(new RegExp(`^${ASSETS_DIR}/${SHARED_CHUNK_NAME}-`));
    expect(sharedChunk?.moduleIds).toContain(PAGE_COMPONENT_MODULE);
    expect(findEntryChunk()?.imports).toContain(sharedChunk?.fileName);
    expect(pageChunksUsingIt.length).toBeGreaterThan(0);
  });

  it(`preloads the ${VENDOR_CHUNK_NAME} and ${SHARED_CHUNK_NAME} chunks from the home page, so the size report counts them`, () => {
    const preloadedUrls = getPreloadedUrls(getSource(HOME_PAGE.fileName));

    [VENDOR_CHUNK_NAME, SHARED_CHUNK_NAME].forEach(name => {
      expect(preloadedUrls).toContain(`/${findNamedChunk(name)?.fileName}`);
    });
  });
});

describe('pages generated by the build', () => {
  const [homePage] = PAGES;
  const pageFiles = getPageFiles();
  const notFoundFiles = getNotFoundFiles();
  const homePages = pageFiles.filter(({ page }) => page === homePage);
  const generatedPages = [
    ...pageFiles
      .filter(({ page }) => page !== homePage)
      .map(({ fileName, page, language }) => ({ fileName, folder: page.folder, language })),
    ...notFoundFiles.map(({ fileName, language }) => ({
      fileName,
      folder: NOT_FOUND_FOLDER,
      language,
    })),
  ];

  /** Reads the home page of a language, built from the template of every page. */
  const getHomeHtml = (language: string) =>
    getSource(homePages.find(file => file.language === language)?.fileName ?? '');

  it('builds one chunk per page loaded lazily, shared by its languages', () => {
    const lazyFolders = new Set(generatedPages.map(({ folder }) => folder));

    expect(getPageChunkUrls()).toHaveLength(lazyFolders.size);
  });

  it.each(pageFiles.map(({ fileName, page, language }) => ({ fileName, page, language })))(
    'writes $fileName in $language, with its title',
    ({ fileName, page, language }) => {
      const html = getSource(fileName);

      expect(getHtmlLanguage(html)).toBe(language);
      expect(getTitle(html)).toBe(TRANSLATIONS[language].meta[page.meta].title);
      expect(getOgImage(html)).toBe(getOgImageUrl(language));
    },
  );

  it.each(pageFiles.map(({ fileName, language }) => ({ fileName, language })))(
    'declares in $fileName valid structured data of schema.org, at its canonical URL, in $language',
    ({ fileName, language }) => {
      const html = getSource(fileName);
      const structuredData = readStructuredData(html);
      const [{ '@context': context, '@graph': nodes } = {}] = structuredData;

      expect(structuredData).toHaveLength(1);
      expect(context).toBe(SCHEMA_ORG_URL);
      expect(findNodes({ nodes, types: PAGE_NODE_TYPES })).toEqual([
        expect.objectContaining({ url: getCanonicalUrl(html), inLanguage: language }),
      ]);
    },
  );

  it.each(homePages.map(({ fileName, language }) => ({ fileName, language })))(
    'declares in $fileName the site and its owner, in $language',
    ({ fileName, language }) => {
      const html = getSource(fileName);
      const [{ '@graph': nodes } = {}] = readStructuredData(html);
      const [profilePage] = findNodes({ nodes, types: ['ProfilePage'] });

      expect(findNodes({ nodes, types: ['WebSite'] })).toEqual([
        expect.objectContaining({
          url: getCanonicalUrl(html),
          name: TRANSLATIONS[language].meta.siteName,
          inLanguage: language,
        }),
      ]);
      expect(profilePage?.mainEntity).toMatchObject({
        '@type': 'Person',
        name: TRANSLATIONS[language].meta.ownerName,
        jobTitle: TRANSLATIONS[language].home.title1,
        image: getOgImageUrl(language),
        sameAs: [GITHUB_PROFILE_URL, LINKEDIN_PROFILE_URL],
      });
    },
  );

  it.each(notFoundFiles)(
    'declares no structured data in the not found page $fileName, which has no address',
    ({ fileName }) => {
      expect(getSource(fileName)).toContain('</head>');
      expect(readStructuredData(getSource(fileName))).toEqual([]);
    },
  );

  it.each(notFoundFiles)(
    'writes the not found page $fileName in $language',
    ({ fileName, language }) => {
      const html = getSource(fileName);

      expect(getHtmlLanguage(html)).toBe(language);
      expect(getTitle(html)).toBe(TRANSLATIONS[language].meta.notFound.title);
      expect(html).toContain('<meta name="robots" content="noindex" />');
    },
  );

  it.each(generatedPages)(
    '$fileName preloads the chunk of $folder, and no other page chunk',
    ({ fileName, folder }) => {
      const pageChunkUrl = getPageChunkUrl(folder);

      expect(pageChunkUrl).toMatch(new RegExp(`^/${ASSETS_DIR}/${folder}-[\\w-]+\\.js$`));
      expect(getPreloadedPageChunks(getSource(fileName))).toEqual([pageChunkUrl]);
    },
  );

  it.each(generatedPages)(
    '$fileName preloads the chunks that its page chunk imports, and nothing else',
    ({ fileName, folder, language }) => {
      const html = getSource(fileName);
      const expectedUrls = getStaticImportUrls({ files: output, url: getPageChunkUrl(folder) });

      expect(expectedUrls).toContain(getPageChunkUrl(folder));
      expect(getOwnPreloadedUrls({ html, homeHtml: getHomeHtml(language) })).toEqual(expectedUrls);
    },
  );

  it.each(generatedPages)('$fileName preloads its chunk in its head', ({ fileName, folder }) => {
    const html = getSource(fileName);
    const linkPosition = html.indexOf(`href="${getPageChunkUrl(folder)}"`);

    expect(linkPosition).toBeGreaterThan(html.indexOf('<head>'));
    expect(linkPosition).toBeLessThan(html.indexOf('</head>'));
  });

  describe.each(
    [...pageFiles, ...notFoundFiles].map(({ fileName, language }) => ({ fileName, language })),
  )('$fileName', ({ fileName, language }) => {
    const getHead = () => {
      const html = getSource(fileName);
      return html.slice(html.indexOf('<head>'), html.indexOf('</head>'));
    };

    it('preloads each web font of the site, from the site, in its head', () => {
      expect(getFontPreloads(getHead())).toEqual(
        FONT_FACES.map(
          ({ url }) => `<link rel="preload" href="${url}" as="font" type="font/woff2" crossorigin>`,
        ),
      );
    });

    it('preloads no image, whose bytes would delay the scripts and fonts of the text', () => {
      expect(getPreloads({ html: getSource(fileName), as: 'image' })).toEqual([]);
    });

    it('declares the web fonts in a style of its head, which no component changes', () => {
      expect(getHead()).toContain(`<style>${renderFontFaces()}</style>`);
    });

    it('runs no inline script, which its Content Security Policy would block', () => {
      expect(getSource(fileName)).toMatch(SCRIPT_TAG_PATTERN);
      expect(getInlineScriptTags(getSource(fileName))).toEqual([]);
    });

    it('links the SVG favicon, after the ICO one of the older browsers, in its head', () => {
      const { url, sizePx } = APP_ICONS.legacyFavicon;
      expect(getLinks({ html: getHead(), rel: 'icon' })).toEqual([
        `<link rel="icon" href="${url}" sizes="${sizePx}x${sizePx}" />`,
        `<link rel="icon" href="${APP_ICONS.favicon.url}" type="${APP_ICONS.favicon.type}" />`,
      ]);
    });

    it('links the Apple touch icon, which iOS puts on its home screen, in its head', () => {
      expect(getLinkUrls({ html: getHead(), rel: 'apple-touch-icon' })).toEqual([
        APP_ICONS.appleTouch.url,
      ]);
    });

    it(`links the web app manifest of ${language} only, in its head`, () => {
      expect(getLinkUrls({ html: getSource(fileName), rel: 'manifest' })).toEqual([
        getWebManifestUrl(language),
      ]);
      expect(getLinkUrls({ html: getHead(), rel: 'manifest' })).toHaveLength(1);
    });
  });

  it('names no host of Google in a page or a script', () => {
    const files = output.map(file => ({
      fileName: file.fileName,
      code: isChunk(file) ? file.code : String(file.source),
    }));

    expect(files.length).toBeGreaterThan(0);
    files.forEach(({ fileName, code }) => expect(findGoogleHosts(code), fileName).toEqual([]));
  });

  it.each(homePages)(
    'preloads no page chunk in the home page $fileName, which is in the main chunk',
    ({ fileName }) => {
      const html = getSource(fileName);

      expect(html).toContain('<script type="module"');
      expect(getPreloadedPageChunks(html)).toEqual([]);
    },
  );
});

describe('pages generated by a build where two lazy pages share a module', () => {
  /** Files of the build where {@link shareModule} adds a module to two lazy pages. */
  let sharingOutput: OutputFile[] = [];

  beforeAll(async () => {
    sharingOutput = await buildSite([shareModule()]);
  }, BUILD_TIMEOUT_MS);

  const languagePages = getPageFiles().filter(({ language }) => language === DEFAULT_LANGUAGE);
  const homePage = languagePages.find(({ page }) => page === HOME_PAGE);
  const sharingPages = languagePages.filter(({ page }) =>
    SHARING_PAGE_FOLDERS.includes(page.folder),
  );

  /** Reads an HTML page of the build. */
  const getSharingSource = (fileName = '') =>
    String(sharingOutput.filter(isAsset).find(file => file.fileName === fileName)?.source ?? '');

  /** URL of the chunk built from the index file of a page folder. */
  const getSharingPageChunkUrl = (folder: string) => {
    const entry = normalizePath(resolve(PAGES_DIR, folder, PAGE_ENTRY_FILE));
    const chunk = sharingOutput.filter(isChunk).find(file => file.facadeModuleId === entry);
    return chunk && `/${chunk.fileName}`;
  };

  /** URL of the chunk of the shared module. */
  const getSharedChunkUrl = () => {
    const isSharedChunk = (chunk: Rolldown.OutputChunk) =>
      Object.keys(chunk.modules).includes(RESOLVED_SHARED_MODULE_ID);
    const chunk = sharingOutput.filter(isChunk).find(isSharedChunk);
    return chunk && `/${chunk.fileName}`;
  };

  it('puts the shared module in a chunk of its own, which each sharing page chunk imports', () => {
    const sharedChunkUrl = getSharedChunkUrl();

    expect(sharedChunkUrl).toBeDefined();
    SHARING_PAGE_FOLDERS.forEach(folder => {
      const pageChunkUrl = getSharingPageChunkUrl(folder);

      expect(pageChunkUrl).not.toBe(sharedChunkUrl);
      expect(getStaticImportUrls({ files: sharingOutput, url: pageChunkUrl })).toContain(
        sharedChunkUrl,
      );
    });
  });

  it.each(sharingPages.map(({ fileName, page }) => ({ fileName, folder: page.folder })))(
    '$fileName preloads its page chunk and the chunk of the shared module',
    ({ fileName, folder }) => {
      const html = getSharingSource(fileName);
      const homeHtml = getSharingSource(homePage?.fileName);

      expect(getOwnPreloadedUrls({ html, homeHtml })).toEqual(
        [getSharingPageChunkUrl(folder), getSharedChunkUrl()].sort(),
      );
    },
  );
});

describe('sitemap generated by the build', () => {
  const pageFiles = getPageFiles();

  it(`writes ${SITEMAP_FILE_NAME} at the root of the build`, () => {
    expect(getSource(SITEMAP_FILE_NAME)).toBe(renderSitemap());
  });

  it('lists the canonical URL of every page of the build, in every language', () => {
    const canonicalUrls = pageFiles.map(({ fileName }) => getCanonicalUrl(getSource(fileName)));

    expect(canonicalUrls).not.toContain(undefined);
    expect(getSitemapLocations(getSource(SITEMAP_FILE_NAME))).toEqual(canonicalUrls);
  });

  it.each(pageFiles)(
    'links $fileName to the same translations as its HTML file',
    ({ fileName }) => {
      const html = getSource(fileName);
      const sitemapUrl = getSitemapUrlEntry({
        sitemap: getSource(SITEMAP_FILE_NAME),
        location: getCanonicalUrl(html) ?? '',
      });

      expect(getAlternateLinks(html)).toHaveLength(LANGUAGES.length + 1);
      expect(getAlternateLinks(sitemapUrl)).toEqual(getAlternateLinks(html));
    },
  );
});

describe('web app manifests generated by the build', () => {
  it.each(getWebManifestFiles())('writes $fileName in $language', ({ language, fileName }) => {
    expect(getSource(fileName)).toBe(
      renderWebManifest({ language, years: getYearsOfExperience() }),
    );
  });

  it.each(getWebManifestFiles())(
    'lists in $fileName icons that the site serves',
    ({ fileName }) => {
      const { icons } = JSON.parse(getSource(fileName));

      expect(icons.length).toBeGreaterThan(0);
      icons.forEach(({ src }: { src: string }) => {
        expect(existsSync(resolve('public', src.replace(/^\//, ''))), src).toBe(true);
      });
    },
  );

  it('leaves out the former manifest, which named the French site on every page', () => {
    expect(existsSync(resolve('public', 'manifest.json'))).toBe(false);
  });
});

describe('HTTP headers generated by the build', () => {
  it(`writes ${HEADERS_FILE_NAME} at the root of the build`, () => {
    expect(getSource(HEADERS_FILE_NAME)).toBe(renderHeaderRules());
  });

  it('gives every file of the site the security headers', () => {
    const securityLines = Object.entries(SECURITY_HEADERS).map(
      ([name, value]) => `  ${name}: ${value}\n`,
    );

    expect(getSource(HEADERS_FILE_NAME)).toContain(`/*\n${securityLines.join('')}`);
  });

  it('lets a page load files from the site only, and run no inline script nor eval', () => {
    const directives = getPolicyDirectives(getSource(HEADERS_FILE_NAME));

    expect(directives['default-src']).toEqual(["'self'"]);
    expect(directives['script-src']).toEqual(["'self'"]);
    expect(directives['object-src']).toEqual(["'none'"]);
    expect(directives['base-uri']).toEqual(["'self'"]);
  });

  it('lets no other site show a page in a frame', () => {
    expect(getPolicyDirectives(getSource(HEADERS_FILE_NAME))['frame-ancestors']).toEqual([
      "'none'",
    ]);
    expect(SECURITY_HEADERS['X-Frame-Options']).toBe('DENY');
  });

  it(`keeps search engines off ${PAGES_PROJECT_HOST}, and on ${SITE_URL}`, () => {
    const rules = getSource(HEADERS_FILE_NAME).split('\n\n');
    const noIndexRules = rules.filter(rule => rule.includes('X-Robots-Tag'));

    expect(noIndexRules).toEqual([`https://${PAGES_PROJECT_HOST}/*\n  X-Robots-Tag: noindex`]);
    expect(getSource(HEADERS_FILE_NAME)).not.toContain(new URL(SITE_URL).host);
  });

  it('serves the same security headers from vite preview, as the browser tests run', async () => {
    const config = await resolveConfig(
      { configFile: 'vite.config.ts', configLoader: 'native', logLevel: 'silent' },
      'serve',
      'production',
    );

    expect(config.preview.headers).toEqual(SECURITY_HEADERS);
  });

  it(`caches the files of ${ASSETS_DIR}/ for a year, as immutable`, () => {
    expect(getSource(HEADERS_FILE_NAME)).toContain(
      `/${ASSETS_DIR}/*\n  Cache-Control: public, max-age=31536000, immutable\n`,
    );
  });

  it(`names every file of ${ASSETS_DIR}/ after a hash of its content, so it can stay a year`, () => {
    const assetsDirFiles = output.filter(file => file.fileName.startsWith(`${ASSETS_DIR}/`));

    expect(assetsDirFiles.length).toBeGreaterThan(0);
    assetsDirFiles.forEach(file => {
      expect(getFileNameTemplate(file), file.fileName).toContain('[hash]');
      expect(file.fileName).toMatch(HASHED_FILE_NAME_PATTERN);
    });
  });

  it(`copies no file of public/ into ${ASSETS_DIR}/, where it would stay a year under its name`, () => {
    expect(existsSync(resolve('public', ASSETS_DIR))).toBe(false);
  });
});
