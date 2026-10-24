// @vitest-environment jsdom
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import ts from 'typescript';
import { build, normalizePath, type Plugin, resolveConfig, type Rolldown } from 'vite';

import { PAGE_HEADINGS } from './e2e/constants.ts';
import { isGoogleHost } from './e2e/utils.ts';
import { GITHUB_PROFILE_URL, LINKEDIN_PROFILE_URL } from './src/constants/profiles.ts';
import { DEFAULT_LANGUAGE, LANGUAGES } from './src/i18n/constants.ts';
import { en } from './src/i18n/en.ts';
import { fr } from './src/i18n/fr.ts';
import { FONT_FACES } from './src/theme/constants.ts';
import { renderFontFaces } from './src/theme/utils.ts';
import { getYearsOfExperience } from './src/utils/career.ts';
import { APP_ICONS } from './src/utils/icons.ts';
import {
  getNotFoundFiles,
  getOgImageUrl,
  getPageFiles,
  HOME_PAGE,
  LANDSCAPE_PHOTO_MEDIA_QUERY,
  NOT_FOUND_FOLDER,
  PAGES,
  PORTRAIT_PHOTO_MEDIA_QUERY,
  SITE_URL,
  STATUS_PAGE_BACKGROUND_PHOTO,
} from './src/utils/pages.ts';
import { APP_CONTAINER_ID, PRERENDERED_PATH_ATTRIBUTE } from './src/utils/prerender.ts';
import { renderSitemap, SITEMAP_FILE_NAME } from './src/utils/sitemap.ts';
import {
  getWebManifestFiles,
  getWebManifestUrl,
  renderWebManifest,
} from './src/utils/webManifest.ts';
import {
  APP_ECMASCRIPT_LIBS,
  APP_ECMASCRIPT_TARGET,
  ASSETS_DIR,
  BUILD_TARGET,
  FONT_FACES_PLUGIN_NAME,
  HEADERS_FILE_NAME,
  NODE_MODULES_PATTERN,
  PAGE_ENTRY_FILE,
  PAGES_DIR,
  PAGES_PROJECT_HOST,
  SECURITY_HEADERS,
  SHARED_CHUNK_NAME,
  VENDOR_CHUNK_NAME,
} from './vite/constants.ts';
import { NOT_FOUND_PAGES_PLUGIN_NAME } from './vite/preview/constants.ts';
import { getFontFaceTags } from './vite/utils/fonts.ts';
import { renderHeaderRules } from './vite/utils/headers.ts';

/** Longest time the production build may take in this test, coverage included. */
const BUILD_TIMEOUT_MS = 60_000;

/**
 * How Vite loads the config in these tests: bundled by Rolldown into a file of its own, not
 * imported by Node.js as the scripts of `package.json` do (`--configLoader native`). Node.js would
 * load the modules of `vite/` a second time in the worker, under the same URL as the copy that
 * Vitest transforms, and the coverage would merge the two, giving their branches wrong counts, even
 * negative ones. `pnpm test` and `pnpm build` in the CI still load this config with Node.js, and
 * fail on an import that it cannot resolve, such as one without the extension of its file.
 */
const CONFIG_LOADER = 'bundle';

/** Element that loads a script of the app: a module script, or a link that preloads a module. */
const APP_SCRIPT_SELECTOR = 'script[type="module"], link[rel="modulepreload"]';

/** Host of each URL that a file names with `//`, with or without its scheme. */
const URL_HOST_PATTERN = /\/\/([\w.-]+)/g;

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
    configLoader: CONFIG_LOADER,
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

/** Documents parsed by {@link parseHtml}, by their HTML, which several tests read. */
const parsedDocuments = new Map<string, Document>();

/** Parses an HTML page as a browser does, once per HTML, into a document to query. */
const parseHtml = (html: string) => {
  const parsed = parsedDocuments.get(html) ?? new DOMParser().parseFromString(html, 'text/html');
  parsedDocuments.set(html, parsed);
  return parsed;
};

/** Parses an HTML page of the build, an empty document when the build has none. */
const readPage = (fileName: string) => parseHtml(getSource(fileName));

/**
 * Writes an element as the parser of {@link parseHtml} writes it back, to compare a tag written
 * by hand, such as `<link rel="icon" href="/favicon.ico">`, with an element of a page.
 */
const toElementHtml = (tag: string) => {
  const template = document.createElement('template');
  template.innerHTML = tag;
  return template.content.firstElementChild?.outerHTML;
};

/** Parameters of the helpers that query a document or one of its elements. */
interface QueryParams {
  /** Document of a page, or one of its elements such as its head. */
  root: ParentNode;
  /** CSS selector of the elements, e.g. `link[rel="icon"]`. */
  selector: string;
}

/** Lists the HTML of each element of a selector in a document or one of its elements. */
const getElementsHtml = ({ root, selector }: QueryParams) =>
  [...root.querySelectorAll(selector)].map(element => element.outerHTML);

/** Parameters of {@link getAttributeValues}. */
interface GetAttributeValuesParams extends QueryParams {
  /** Name of the attribute, e.g. `href`. */
  name: string;
}

/** Lists the value of an attribute of each element of a selector, in their order. */
const getAttributeValues = ({ root, selector, name }: GetAttributeValuesParams) =>
  [...root.querySelectorAll(selector)].map(element => element.getAttribute(name));

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

/** Lists the URLs of the scripts that an HTML page, or a part of it, preloads. */
const getPreloadedUrls = (root: ParentNode) =>
  getAttributeValues({ root, selector: 'link[rel="modulepreload"]', name: 'href' });

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
  return getPreloadedUrls(parseHtml(html)).filter(href => pageChunkUrls.includes(href ?? ''));
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
  const templateUrls = getPreloadedUrls(parseHtml(homeHtml));
  return getPreloadedUrls(parseHtml(html))
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
  /** Document of a page, or one of its elements such as its head. */
  root: ParentNode;
  /** Kind of file that the links preload, their `as` attribute, e.g. `font`. */
  as: string;
}

/** Lists the HTML of the links of a page that preload a kind of file, in their order. */
const getPreloads = ({ root, as }: GetPreloadsParams) =>
  getElementsHtml({ root, selector: `link[rel="preload"][as="${as}"]` });

/** Lists the HTML of the links of a page that preload a font, in their order. */
const getFontPreloads = (root: ParentNode) => getPreloads({ root, as: 'font' });

/** Path of a font file of `public/`, from its URL in `FONT_FACES`. */
const getPublicFontFile = (url: string) => join(resolve('public'), url);

/**
 * Finds the copy of a font file of `public/` that the build writes in `assets/`, by the path of the
 * file it was emitted from.
 */
const getFontAsset = (url: string) =>
  output.filter(isAsset).find(file => file.originalFileNames.includes(getPublicFontFile(url)));

/**
 * URL from which the pages load a font file of `public/`, the one of its copy in `assets/`, such
 * as `/assets/montserrat-latin-1a2b3c4d.woff2`, or `/` when the build has no copy.
 */
const getFontAssetUrl = (url: string) => `/${getFontAsset(url)?.fileName ?? ''}`;

/**
 * Runs the `transformIndexHtml` hook of the `font-faces` plugin, in the config resolved for a
 * command of Vite, on a page whose bundle holds no copy of the font files.
 */
const transformFontFacesHtml = async (command: 'build' | 'serve') => {
  const config = await resolveConfig(
    { configFile: 'vite.config.ts', configLoader: CONFIG_LOADER, logLevel: 'silent' },
    command,
    'production',
  );
  const { transformIndexHtml: hook } =
    config.plugins.find(({ name }) => name === FONT_FACES_PLUGIN_NAME) ?? {};
  if (typeof hook !== 'function') throw new Error('The plugin has no transformIndexHtml hook');
  const error = (message: string) => {
    throw new Error(message);
  };
  // The hook reads only the `error` of its `this`, which Vite would give it
  return hook.call({ error } as never, '', { path: '/', filename: 'index.html', bundle: {} });
};

/** Parameters of {@link getLinks}. */
interface GetLinksParams {
  /** Document of a page, or one of its elements such as its head. */
  root: ParentNode;
  /** Relation of the links, their `rel` attribute, e.g. `icon`. */
  rel: string;
}

/** Lists the HTML of the links of a page of a relation, in their order. */
const getLinks = ({ root, rel }: GetLinksParams) =>
  getElementsHtml({ root, selector: `link[rel="${rel}"]` });

/** Lists the URL of each link of a page of a relation. */
const getLinkUrls = ({ root, rel }: GetLinksParams) =>
  getAttributeValues({ root, selector: `link[rel="${rel}"]`, name: 'href' });

/** Translations of each language, to read the titles the pages must have. */
const TRANSLATIONS = { fr, en };

/** Reads the language of a page, in its `<html lang>`. */
const getHtmlLanguage = (page: Document) => page.documentElement.getAttribute('lang') ?? undefined;

/** Reads the text of the title of a page, its entities decoded and its spaces kept. */
const getTitle = (page: Document) => page.querySelector('title')?.textContent;

/** Reads the URL of the link preview image of a page, in its `og:image`. */
const getOgImage = (page: Document) =>
  page.querySelector('meta[property="og:image"]')?.getAttribute('content') ?? undefined;

/**
 * Link to a translation in a `url` of the sitemap. Its groups capture the `hreflang` and the URL.
 */
const SITEMAP_ALTERNATE_LINK_PATTERN =
  /<xhtml:link rel="alternate" hreflang="([^"]*)" href="([^"]*)"/g;

/** `url` element of the sitemap, from its opening to its closing tag. */
const SITEMAP_URL_PATTERN = /<url>[\s\S]*?<\/url>/g;

/** Location of a `url` of the sitemap. Its first group captures the URL. */
const SITEMAP_LOCATION_PATTERN = /<loc>([^<]*)<\/loc>/g;

/** Reads the canonical URL of a page. */
const getCanonicalUrl = (page: Document) =>
  page.querySelector('link[rel="canonical"]')?.getAttribute('href') ?? undefined;

/** Lists the `hreflang` and the URL of each link of a page to a translation. */
const getAlternateLinks = (page: Document) =>
  [...page.querySelectorAll('link[rel="alternate"][hreflang]')].map(link => [
    link.getAttribute('hreflang'),
    link.getAttribute('href'),
  ]);

/** Lists the `hreflang` and the URL of each link to a translation of a `url` of the sitemap. */
const getSitemapAlternateLinks = (sitemapUrl: string) =>
  [...sitemapUrl.matchAll(SITEMAP_ALTERNATE_LINK_PATTERN)].map(([, hreflang, href]) => [
    hreflang,
    href,
  ]);

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

/** `type` of a script element of structured data, which browsers do not run. */
const DATA_BLOCK_TYPE = 'application/ld+json';

/** Selector of the script elements of structured data in a page. */
const STRUCTURED_DATA_SCRIPT_SELECTOR = `script[type="${DATA_BLOCK_TYPE}"]`;

/** Tells whether a script element runs inline code: it has no file to run, and holds no data. */
const isInlineScript = (script: Element) => {
  const hasSourceFile = Boolean(script.getAttribute('src'));
  const isDataBlock = script.getAttribute('type') === DATA_BLOCK_TYPE;
  return !hasSourceFile && !isDataBlock;
};

/** Lists the HTML of the script elements of a page that run inline code. */
const getInlineScripts = (page: Document) =>
  [...page.querySelectorAll('script')].filter(isInlineScript).map(script => script.outerHTML);

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

/** Reads the structured data that each script element of a page declares, parsed. */
const readStructuredData = (page: Document) =>
  [...page.querySelectorAll(STRUCTURED_DATA_SCRIPT_SELECTOR)].map(
    ({ textContent }) =>
      JSON.parse(textContent) as { '@context'?: string; '@graph'?: StructuredDataNode[] },
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

/** Compiler options that a tsconfig file of the project writes. */
interface WrittenCompilerOptions {
  /** Edition of ECMAScript whose syntax TypeScript accepts. */
  target?: string;
  /** TypeScript libraries of the APIs that the code may call. */
  lib?: string[];
  /** Packages whose global types TypeScript loads, such as `node`: all of `@types/` without it. */
  types?: string[];
}

/** TypeScript library of ECMAScript APIs, such as `ES2021` or `ES2022.Array`, unlike `DOM`. */
const ECMASCRIPT_LIB_PATTERN = /^ES/i;

/** Reads the compiler options that a tsconfig file writes, comments allowed: none without any. */
const readCompilerOptions = (fileName: string): WrittenCompilerOptions =>
  ts.readConfigFile(fileName, ts.sys.readFile).config?.compilerOptions ?? {};

describe('browser target of the build', () => {
  it('transpiles the app for the browsers of BUILD_TARGET', async () => {
    const config = await resolveConfig(
      { configFile: 'vite.config.ts', configLoader: CONFIG_LOADER, logLevel: 'silent' },
      'build',
    );

    expect(config.build.target).toEqual(BUILD_TARGET);
  });

  it(`type-checks the app against ${APP_ECMASCRIPT_TARGET}, the syntax that these browsers read`, () => {
    expect(readCompilerOptions('tsconfig.app.json').target).toBe(APP_ECMASCRIPT_TARGET);
  });

  it('type-checks the app against the ECMAScript APIs that these browsers ship, and no other', () => {
    const { lib = [] } = readCompilerOptions('tsconfig.app.json');

    expect(lib.filter(name => ECMASCRIPT_LIB_PATTERN.test(name))).toEqual(APP_ECMASCRIPT_LIBS);
  });

  it('type-checks the app without the global types of Node.js or of the tests', () => {
    expect(readCompilerOptions('tsconfig.app.json').types).toEqual([]);
  });
});

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
    const preloadedUrls = getPreloadedUrls(readPage(HOME_PAGE.fileName));

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
      const pageDocument = readPage(fileName);

      expect(getHtmlLanguage(pageDocument)).toBe(language);
      expect(getTitle(pageDocument)).toBe(TRANSLATIONS[language].meta[page.meta].title);
      expect(getOgImage(pageDocument)).toBe(getOgImageUrl(language));
    },
  );

  it.each(pageFiles.map(({ fileName, language }) => ({ fileName, language })))(
    'declares in $fileName valid structured data of schema.org, at its canonical URL, in $language',
    ({ fileName, language }) => {
      const page = readPage(fileName);
      const structuredData = readStructuredData(page);
      const [{ '@context': context, '@graph': nodes } = {}] = structuredData;

      expect(structuredData).toHaveLength(1);
      expect(context).toBe(SCHEMA_ORG_URL);
      expect(findNodes({ nodes, types: PAGE_NODE_TYPES })).toEqual([
        expect.objectContaining({ url: getCanonicalUrl(page), inLanguage: language }),
      ]);
    },
  );

  it.each(homePages.map(({ fileName, language }) => ({ fileName, language })))(
    'declares in $fileName the site and its owner, in $language',
    ({ fileName, language }) => {
      const page = readPage(fileName);
      const [{ '@graph': nodes } = {}] = readStructuredData(page);
      const [profilePage] = findNodes({ nodes, types: ['ProfilePage'] });

      expect(findNodes({ nodes, types: ['WebSite'] })).toEqual([
        expect.objectContaining({
          url: getCanonicalUrl(page),
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
      expect(readStructuredData(readPage(fileName))).toEqual([]);
    },
  );

  it.each(notFoundFiles)(
    'writes the not found page $fileName in $language',
    ({ fileName, language }) => {
      const page = readPage(fileName);

      expect(getHtmlLanguage(page)).toBe(language);
      expect(getTitle(page)).toBe(TRANSLATIONS[language].meta.notFound.title);
      expect(getElementsHtml({ root: page.head, selector: 'meta[name="robots"]' })).toEqual([
        toElementHtml('<meta name="robots" content="noindex" />'),
      ]);
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
    expect(getPreloadedUrls(readPage(fileName).head)).toContain(getPageChunkUrl(folder));
  });

  describe.each([
    ...pageFiles.map(({ fileName, language, page }) => ({
      fileName,
      language,
      photo: page.backgroundPhoto,
    })),
    ...notFoundFiles.map(({ fileName, language }) => ({
      fileName,
      language,
      photo: STATUS_PAGE_BACKGROUND_PHOTO,
    })),
  ])('$fileName', ({ fileName, language, photo }) => {
    const getHead = () => readPage(fileName).head;

    it(`preloads each web font of the site, from its copy in ${ASSETS_DIR}/, in its head`, () => {
      expect(getFontPreloads(getHead())).toEqual(
        FONT_FACES.map(({ url }) =>
          toElementHtml(
            `<link rel="preload" href="${getFontAssetUrl(url)}" as="font" type="font/woff2" crossorigin>`,
          ),
        ),
      );
    });

    // Its rendered style requests the photo, at the high priority of an image on the screen, which
    // the font and the largest image of the first paint would share their bandwidth with
    it('preloads its background photo at a low priority, in the version of each screen', () => {
      expect(getPreloads({ root: readPage(fileName), as: 'image' })).toEqual([
        toElementHtml(
          `<link rel="preload" as="image" href="${photo.portraitUrl}" media="${PORTRAIT_PHOTO_MEDIA_QUERY.replaceAll('<', '&lt;')}" fetchpriority="low" />`,
        ),
        toElementHtml(
          `<link rel="preload" as="image" href="${photo.url}" media="${LANDSCAPE_PHOTO_MEDIA_QUERY.replaceAll('<', '&lt;')}" fetchpriority="low" />`,
        ),
      ]);
    });

    it('downloads the scripts of the app at a low priority, since they only hydrate it', () => {
      const scripts = getElementsHtml({ root: getHead(), selector: APP_SCRIPT_SELECTOR });

      expect(scripts.length).toBeGreaterThan(0);
      scripts.forEach(script => expect(script).toContain(' fetchpriority="low"'));
      expect(getElementsHtml({ root: readPage(fileName), selector: APP_SCRIPT_SELECTOR })).toEqual(
        scripts,
      );
    });

    it('declares the web fonts in a style of its head, which no component changes', () => {
      expect(getElementsHtml({ root: getHead(), selector: 'style' })).toContain(
        toElementHtml(`<style>${renderFontFaces({ getUrl: getFontAssetUrl })}</style>`),
      );
    });

    it('runs no inline script, which its Content Security Policy would block', () => {
      expect(readPage(fileName).scripts.length).toBeGreaterThan(0);
      expect(getInlineScripts(readPage(fileName))).toEqual([]);
    });

    it('links the SVG favicon, after the ICO one of the older browsers, in its head', () => {
      const { url, sizePx } = APP_ICONS.legacyFavicon;
      expect(getLinks({ root: getHead(), rel: 'icon' })).toEqual([
        toElementHtml(`<link rel="icon" href="${url}" sizes="${sizePx}x${sizePx}" />`),
        toElementHtml(
          `<link rel="icon" href="${APP_ICONS.favicon.url}" type="${APP_ICONS.favicon.type}" />`,
        ),
      ]);
    });

    it('links the Apple touch icon, which iOS puts on its home screen, in its head', () => {
      expect(getLinkUrls({ root: getHead(), rel: 'apple-touch-icon' })).toEqual([
        APP_ICONS.appleTouch.url,
      ]);
    });

    it(`links the web app manifest of ${language} only, in its head`, () => {
      expect(getLinkUrls({ root: readPage(fileName), rel: 'manifest' })).toEqual([
        getWebManifestUrl(language),
      ]);
      expect(getLinkUrls({ root: getHead(), rel: 'manifest' })).toHaveLength(1);
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

/** Style elements that styled-components renders for a page, with its rules. */
const STYLED_STYLE_SELECTOR = 'style[data-styled="true"]';

/** Space characters of a text, which a browser shows as one space. */
const SPACES_PATTERN = /\s+/g;

/**
 * Rule by which styled-components names the classes of a styled component in a style, for the
 * browser to take them over: the id of the component, then its classes, each followed by a comma.
 */
const STYLED_GROUP_PATTERN = /data-styled\.g\d+\[id="([^"]+)"\]\{content:"([^"]*)"\}/g;

/** Id of a styled component, as the build derives it from its module and its place in it. */
const COMPONENT_ID_PATTERN = /^sc-[\da-f]{8}$/;

/** Id that styled-components gives to a global style or to keyframes, rather than a component. */
const NON_COMPONENT_ID_PATTERN = /^sc-(global|keyframes)-/;

/** Id of a styled component that a chunk of the build gives it: its first group. */
const CHUNK_COMPONENT_ID_PATTERN = /componentId:\s*["'`](sc-[^"'`]*)["'`]/g;

/** Reads a text as a browser shows it, its spaces collapsed. */
const collapseSpaces = (text = '') => text.replace(SPACES_PATTERN, ' ');

/** Reads the text of an element as a browser shows it, its spaces collapsed. */
const getText = (element?: Element | null) => collapseSpaces(element?.textContent);

/**
 * Reads the container of the app in a page of the build, the last element of its body: its
 * attributes besides its id, as name and value, and the container itself, missing when the last
 * element of the body is not the container.
 */
const readAppContainer = (fileName: string) => {
  const lastElement = readPage(fileName).body.lastElementChild;
  const isAppContainer = lastElement?.id === APP_CONTAINER_ID;
  const container = isAppContainer ? lastElement : undefined;
  const attributes = [...(container?.attributes ?? [])]
    .filter(({ name }) => name !== 'id')
    .map(({ name, value }) => [name, value]);
  return { attributes, container };
};

/** Lists the classes of the elements inside an element, once each. */
const getClassNames = (element?: Element) => [
  ...new Set(
    [...(element?.querySelectorAll('[class]') ?? [])].flatMap(({ classList }) => [...classList]),
  ),
];

/** Lists the rules of each style of styled-components in a head. */
const getStyledStyles = (head: ParentNode) =>
  [...head.querySelectorAll(STYLED_STYLE_SELECTOR)].map(({ textContent }) => textContent);

/** Reads the classes that the styles of styled-components in a head name, by styled component. */
const getStyledGroups = (head: ParentNode) =>
  getStyledStyles(head).flatMap(rules =>
    [...rules.matchAll(STYLED_GROUP_PATTERN)].map(([, id, names]) => ({
      id,
      classNames: names.split(',').filter(Boolean),
    })),
  );

/** Reads the id of each styled component that the chunks of a build define, in their order. */
const getChunkComponentIds = (files: OutputFile[]) =>
  files
    .filter(isChunk)
    .flatMap(({ code }) => [...code.matchAll(CHUNK_COMPONENT_ID_PATTERN)])
    .map(([, componentId]) => componentId);

describe('pages rendered at build time', () => {
  const pageFiles = getPageFiles();
  const notFoundFiles = getNotFoundFiles();

  describe.each([
    ...pageFiles.map(({ fileName, language, page }) => ({
      fileName,
      language,
      folder: page.folder,
    })),
    ...notFoundFiles.map(({ fileName, language }) => ({
      fileName,
      language,
      folder: NOT_FOUND_FOLDER,
    })),
  ])('$fileName', ({ fileName, language, folder }) => {
    const getHead = () => readPage(fileName).head;

    it(`shows the ${folder} page with its one h1, in ${language}, before any script runs`, () => {
      const { container } = readAppContainer(fileName);
      const heading = getText(container?.querySelector('h1'));

      expect(container?.querySelectorAll('main')).toHaveLength(1);
      expect(container?.querySelectorAll('h1')).toHaveLength(1);
      expect(heading).toContain(collapseSpaces(PAGE_HEADINGS[folder](TRANSLATIONS[language])));
    });

    it(`links every page of the site in ${language}`, () => {
      const { container } = readAppContainer(fileName);
      const hrefs = container
        ? getAttributeValues({ root: container, selector: 'a[href]', name: 'href' })
        : [];
      const languagePaths = pageFiles
        .filter(file => file.language === language)
        .map(({ path }) => path);

      expect(hrefs).toEqual(expect.arrayContaining(languagePaths));
    });

    it('holds no script, template or link in the page, which the policy or React would refuse', () => {
      const { container } = readAppContainer(fileName);

      expect(container).toBeDefined();
      expect(container?.querySelector('script, template, link')).toBeNull();
    });

    it('styles the page from its head, with the classes of its elements', () => {
      const pageClassNames = getClassNames(readAppContainer(fileName).container);
      const componentGroups = getStyledGroups(getHead()).filter(
        ({ id }) => !NON_COMPONENT_ID_PATTERN.test(id),
      );

      expect(getStyledStyles(getHead())).toHaveLength(1);
      expect(componentGroups.length).toBeGreaterThan(0);
      componentGroups.forEach(({ id, classNames }) => {
        expect(id).toMatch(COMPONENT_ID_PATTERN);
        expect(pageClassNames).toEqual(expect.arrayContaining([id, ...classNames]));
      });
    });

    it('names the styled components as the scripts of the build do, which hydrate the page', () => {
      const componentIds = getClassNames(readAppContainer(fileName).container).filter(name =>
        name.startsWith('sc-'),
      );

      expect(componentIds.length).toBeGreaterThan(0);
      componentIds.forEach(componentId => expect(componentId).toMatch(COMPONENT_ID_PATTERN));
      expect(getChunkComponentIds(output)).toEqual(expect.arrayContaining(componentIds));
    });
  });

  it.each(pageFiles.map(({ fileName, path }) => ({ fileName, path })))(
    'names in $fileName the path $path, so the browser hydrates the page there only',
    ({ fileName, path }) => {
      expect(readAppContainer(fileName).attributes).toEqual([[PRERENDERED_PATH_ATTRIBUTE, path]]);
    },
  );

  it.each(notFoundFiles)(
    'names no path in the not found page $fileName, which the browser renders again at its URL',
    ({ fileName, language }) => {
      const { attributes, container } = readAppContainer(fileName);

      expect(container).toBeDefined();
      expect(attributes).toEqual([]);
      expect(getText(container)).toContain(
        TRANSLATIONS[language].errors.notFound.messageWithoutPath,
      );
    },
  );

  it('gives each styled component of the build an id of its own', () => {
    const componentIds = getChunkComponentIds(output);

    expect(componentIds.length).toBeGreaterThan(0);
    componentIds.forEach(componentId => expect(componentId).toMatch(COMPONENT_ID_PATTERN));
    expect(new Set(componentIds).size).toBe(componentIds.length);
  });
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
      const pageChunkUrl = getSharingPageChunkUrl(folder);
      const expectedUrls = getStaticImportUrls({ files: sharingOutput, url: pageChunkUrl });

      expect(expectedUrls).toEqual(expect.arrayContaining([pageChunkUrl, getSharedChunkUrl()]));
      expect(getOwnPreloadedUrls({ html, homeHtml })).toEqual(expectedUrls);
    },
  );
});

describe('sitemap generated by the build', () => {
  const pageFiles = getPageFiles();

  it(`writes ${SITEMAP_FILE_NAME} at the root of the build`, () => {
    expect(getSource(SITEMAP_FILE_NAME)).toBe(renderSitemap());
  });

  it('lists the canonical URL of every page of the build, in every language', () => {
    const canonicalUrls = pageFiles.map(({ fileName }) => getCanonicalUrl(readPage(fileName)));

    expect(canonicalUrls).not.toContain(undefined);
    expect(getSitemapLocations(getSource(SITEMAP_FILE_NAME))).toEqual(canonicalUrls);
  });

  it.each(pageFiles)(
    'links $fileName to the same translations as its HTML file',
    ({ fileName }) => {
      const page = readPage(fileName);
      const sitemapUrl = getSitemapUrlEntry({
        sitemap: getSource(SITEMAP_FILE_NAME),
        location: getCanonicalUrl(page) ?? '',
      });

      expect(getAlternateLinks(page)).toHaveLength(LANGUAGES.length + 1);
      expect(getSitemapAlternateLinks(sitemapUrl)).toEqual(getAlternateLinks(page));
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
      { configFile: 'vite.config.ts', configLoader: CONFIG_LOADER, logLevel: 'silent' },
      'serve',
      'production',
    );

    expect(config.preview.headers).toEqual(SECURITY_HEADERS);
  });

  it('serves the not found pages from vite preview with the status 404, as Cloudflare does', async () => {
    const config = await resolveConfig(
      { configFile: 'vite.config.ts', configLoader: CONFIG_LOADER, logLevel: 'silent' },
      'serve',
      'production',
    );

    expect(config.plugins.map(plugin => plugin.name)).toContain(NOT_FOUND_PAGES_PLUGIN_NAME);
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

  it(`copies each web font into ${ASSETS_DIR}/ under a hash of its content, kept a year`, () => {
    FONT_FACES.forEach(({ url }) => {
      const fontAsset = getFontAsset(url);

      expect(fontAsset?.fileName, url).toMatch(HASHED_FILE_NAME_PATTERN);
      expect(
        Buffer.from(fontAsset?.source ?? '').equals(readFileSync(getPublicFontFile(url))),
        url,
      ).toBe(true);
    });
  });

  it('fails the build when a web font has no copy in its bundle', async () => {
    await expect(transformFontFacesHtml('build')).rejects.toThrow(
      `The build has no copy of the font file ${FONT_FACES[0].url}`,
    );
  });

  it('loads the web fonts from public/ on the dev server, which copies none of them', async () => {
    expect(await transformFontFacesHtml('serve')).toEqual(getFontFaceTags());
  });

  it(`copies no file of public/ into ${ASSETS_DIR}/, where it would stay a year under its name`, () => {
    expect(existsSync(resolve('public', ASSETS_DIR))).toBe(false);
  });
});
