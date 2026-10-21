import {
  APP_TRANSLATIONS,
  DEFAULT_LANGUAGE,
  LANGUAGE_STORAGE_KEY,
  LANGUAGES,
} from './constants.ts';
import { en } from './en.ts';
import { fr } from './fr.ts';

/** Runs the i18n setup again, as on a new page load, and returns the module. */
const loadI18nModule = async () => {
  vi.resetModules();
  return import('./index.ts');
};

/** Runs the i18n setup again, as on a new page load, and returns its instance. */
const loadI18n = async () => (await loadI18nModule()).default;

describe('i18n', () => {
  afterEach(async () => {
    vi.restoreAllMocks();
    localStorage.clear();
    window.history.replaceState(null, '', '/');
    await loadI18n();
  });

  it('starts with the texts of the app in every language, without those of the lazy pages', async () => {
    const i18n = await loadI18n();

    LANGUAGES.forEach(language =>
      expect(i18n.getResourceBundle(language, 'translation')).toEqual(APP_TRANSLATIONS[language]),
    );
    expect(Object.keys(i18n.options.resources ?? {})).toEqual([...LANGUAGES]);
    expect(i18n.exists('projects.pageTitle')).toBe(false);
    expect(i18n.exists('exp.pageTitle')).toBe(false);
  });

  it('adds groups of texts to every language, beside those it has', async () => {
    const { default: i18n, addTranslations } = await loadI18nModule();

    addTranslations({ fr: { projects: fr.projects }, en: { projects: en.projects } });

    LANGUAGES.forEach(language =>
      expect(i18n.getResourceBundle(language, 'translation')).toEqual({
        ...APP_TRANSLATIONS[language],
        projects: { fr, en }[language].projects,
      }),
    );
  });

  it('replaces a group of the same name, and leaves the texts of the app it started with as they were', async () => {
    const { default: i18n, addTranslations } = await loadI18nModule();
    const { APP_TRANSLATIONS: appTranslations } = await import('./constants.ts');

    addTranslations({
      fr: { home: { ...fr.home, cta: 'Nouveau' } },
      en: { home: { ...en.home, cta: 'New' } },
    });
    addTranslations({ fr: { projects: fr.projects }, en: { projects: en.projects } });

    expect(i18n.t('home.cta')).toBe('Nouveau');
    expect(i18n.getResource('en', 'translation', 'home.cta')).toBe('New');
    expect(appTranslations.fr.home.cta).toBe('Voir mes projets');
    expect(appTranslations.en.home.cta).toBe('View my projects');
    expect(appTranslations.en).not.toHaveProperty('projects');
  });

  it.each([
    ['empty', { fr: {}, en: {} }],
    ['missing', undefined],
  ])('keeps the texts of every language when the texts added are %s', async (_, translations) => {
    const { default: i18n, addTranslations } = await loadI18nModule();

    // @ts-expect-error: no groups, as JavaScript could pass them
    addTranslations(translations);

    LANGUAGES.forEach(language =>
      expect(i18n.getResourceBundle(language, 'translation')).toEqual(APP_TRANSLATIONS[language]),
    );
  });

  it('adds the texts of the languages given, and none to a language missing', async () => {
    const { default: i18n, addTranslations } = await loadI18nModule();

    // @ts-expect-error: a language left out, as JavaScript could leave it
    addTranslations({ fr: { projects: fr.projects } });

    expect(i18n.getResource('fr', 'translation', 'projects')).toEqual(fr.projects);
    expect(i18n.getResourceBundle('en', 'translation')).toEqual(APP_TRANSLATIONS.en);
  });

  it('starts in the default language on a first visit', async () => {
    const i18n = await loadI18n();

    expect(i18n.language).toBe(DEFAULT_LANGUAGE);
  });

  it('starts in the language of an English URL', async () => {
    window.history.replaceState(null, '', '/en/projects');

    const i18n = await loadI18n();

    expect(i18n.language).toBe('en');
    expect(i18n.t('nav.projects')).toBe('Projects');
  });

  it('starts at the root in the language chosen on a previous visit, at its URL', async () => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, 'en');

    const i18n = await loadI18n();

    expect(i18n.language).toBe('en');
    expect(i18n.t('nav.projects')).toBe('Projects');
    expect(window.location.pathname).toBe('/en/');
  });

  it('starts at a French URL in French, whatever the language chosen before', async () => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, 'en');
    window.history.replaceState(null, '', '/projects');

    const i18n = await loadI18n();

    expect(i18n.language).toBe(DEFAULT_LANGUAGE);
    expect(window.location.pathname).toBe('/projects');
  });

  it('starts in the default language when the browser blocks the storage', async () => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, 'en');
    vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => {
      throw new DOMException('The operation is insecure.', 'SecurityError');
    });

    const i18n = await loadI18n();

    expect(i18n.language).toBe(DEFAULT_LANGUAGE);
    expect(i18n.t('nav.projects')).toBe('Projets');
  });

  // i18next 25 printed an advertising notice in the console of every page unless told not to:
  // version 26 removed it, along with the option that hid it
  it('logs no support notice to the console', async () => {
    const consoleInfo = vi.spyOn(console, 'info').mockImplementation(() => {});

    await loadI18n();

    expect(consoleInfo).not.toHaveBeenCalled();
  });
});
