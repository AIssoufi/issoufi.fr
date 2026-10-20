import {
  APP_TRANSLATIONS,
  DEFAULT_LANGUAGE,
  LANGUAGES,
  TEXT_DIRECTIONS,
} from '../i18n/constants.ts';
import type { Language } from '../i18n/types.ts';
import { isLanguage, localizePath } from '../i18n/utils.ts';
import { theme } from '../theme/theme.ts';
import { APP_ICONS, type AppIcon } from './icons.ts';
import { getLanguageFileName, HOME_PAGE } from './pages.ts';

/**
 * Name of the web app manifest of each language in the build: at its root for the default
 * language, in the folder of its prefix for the others (`en/manifest.webmanifest`). The extension
 * that the specification recommends, which Cloudflare Pages serves as
 * {@link WEB_MANIFEST_MEDIA_TYPE}.
 */
export const WEB_MANIFEST_FILE_NAME = 'manifest.webmanifest';

/** Media type of a web app manifest, which the dev server sends it with. */
export const WEB_MANIFEST_MEDIA_TYPE = 'application/manifest+json';

/**
 * Identity of the installed app, the same in every language: the site installs once, in the
 * language of the page it was installed from.
 */
export const WEB_APP_ID = '/';

/** Pages that the installed app opens itself: every page of every language. */
export const WEB_APP_SCOPE = '/';

/** How the installed app opens: in a window of its own, without the bar of the browser. */
export const WEB_APP_DISPLAY = 'standalone';

/** Placeholder of the years of experience in the description of the app. */
const YEARS_PLACEHOLDER_PATTERN = /{{years}}/g;

/** Number of spaces that indent each level of the manifest. */
const JSON_INDENT_SPACES = 2;

/** Use of an icon by the app: as it is, or cropped to the shape of the device (`maskable`). */
type IconPurpose = 'any' | 'maskable';

/** An icon of {@link APP_ICONS} listed in the manifest, with its purpose. */
interface ManifestIcon {
  /** The icon, with its size. */
  icon: AppIcon & { sizePx: number };
  /** How the app uses it. */
  purpose: IconPurpose;
}

/**
 * Icons of the installed app, in its manifest: the sizes that Chrome requires to install it, 192
 * and 512 px, then the maskable one, which Android crops to the shape of its home screen.
 */
const MANIFEST_ICONS: readonly ManifestIcon[] = [
  { icon: APP_ICONS.small, purpose: 'any' },
  { icon: APP_ICONS.large, purpose: 'any' },
  { icon: APP_ICONS.maskable, purpose: 'maskable' },
];

/** Renders an icon of the app as the manifest lists it. */
const renderManifestIcon = ({ icon, purpose }: ManifestIcon) => ({
  src: icon.url,
  sizes: `${icon.sizePx}x${icon.sizePx}`,
  type: icon.type,
  purpose,
});

/**
 * Gives the language of a value, or the default language for a value that is not one of the
 * `LANGUAGES`.
 */
const toLanguage = (language: unknown): Language =>
  isLanguage(language) ? language : DEFAULT_LANGUAGE;

/**
 * Builds the URL of the web app manifest of a language, which every page of that language links.
 *
 * @param language - Language of the manifest. A value that is not one of the `LANGUAGES` counts
 * as the default language.
 *
 * @example
 * getWebManifestUrl('fr'); // '/manifest.webmanifest'
 * getWebManifestUrl('en'); // '/en/manifest.webmanifest'
 */
export const getWebManifestUrl = (language?: unknown): string =>
  `/${getLanguageFileName({ fileName: WEB_MANIFEST_FILE_NAME, language: toLanguage(language) })}`;

/**
 * Finds the language whose web app manifest a request asks for, so the dev server can send it.
 *
 * @param url - URL of the request, from its path, e.g. `/en/manifest.webmanifest?v=2`. Its query
 * and fragment are ignored.
 * @returns The language of the manifest, or `undefined` for any other URL, and for a value that is
 * not a string.
 *
 * @example
 * findWebManifestLanguage('/en/manifest.webmanifest'); // 'en'
 * findWebManifestLanguage('/projects'); // undefined
 */
export const findWebManifestLanguage = (url?: unknown): Language | undefined => {
  if (typeof url !== 'string') return undefined;

  const [pathname] = url.split(/[?#]/);
  return LANGUAGES.find(language => getWebManifestUrl(language) === pathname);
};

/** Web app manifest of one language, emitted at build time. */
export interface WebManifestFile {
  /** Language of the manifest. */
  language: Language;
  /** Path of the file in the build, e.g. `en/manifest.webmanifest`. */
  fileName: string;
}

/**
 * Lists the web app manifest of every language of `LANGUAGES`: `manifest.webmanifest` for the
 * default language, `en/manifest.webmanifest` for English.
 */
export const getWebManifestFiles = (): WebManifestFile[] =>
  LANGUAGES.map(language => ({
    language,
    fileName: getLanguageFileName({ fileName: WEB_MANIFEST_FILE_NAME, language }),
  }));

/** Parameters of {@link renderWebManifest}. */
interface RenderWebManifestParams {
  /**
   * Language of the manifest. A value that is not one of the `LANGUAGES` counts as the default
   * language.
   */
  language?: Language;
  /** Years of experience, replacing `{{years}}` in the description. */
  years: number;
}

/**
 * Renders the web app manifest of a language, which lets a browser install the site as an app:
 * its name, short name and description in that language (the `meta.webApp` translations), its
 * `lang` and `dir`, the home page of that language as the page it opens on, and its icons (see
 * {@link MANIFEST_ICONS}). Every language shares the same identity and scope, the whole site. Used
 * by the Vite plugin at build time and by the dev server.
 *
 * @returns The JSON of the manifest, indented, ending with a line break.
 *
 * @example
 * JSON.parse(renderWebManifest({ language: 'en', years: 8 })).start_url; // '/en/'
 */
export const renderWebManifest = ({ language, years }: RenderWebManifestParams): string => {
  const manifestLanguage = toLanguage(language);
  const { name, shortName, description } = APP_TRANSLATIONS[manifestLanguage].meta.webApp;
  const manifest = {
    id: WEB_APP_ID,
    lang: manifestLanguage,
    dir: TEXT_DIRECTIONS[manifestLanguage],
    name,
    short_name: shortName,
    description: description.replace(YEARS_PLACEHOLDER_PATTERN, String(years)),
    start_url: localizePath({ path: HOME_PAGE.path, language: manifestLanguage }),
    scope: WEB_APP_SCOPE,
    display: WEB_APP_DISPLAY,
    theme_color: theme.colors.background,
    background_color: theme.colors.background,
    icons: MANIFEST_ICONS.map(renderManifestIcon),
  };

  return `${JSON.stringify(manifest, null, JSON_INDENT_SPACES)}\n`;
};
