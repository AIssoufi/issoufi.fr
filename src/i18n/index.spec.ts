import { DEFAULT_LANGUAGE, LANGUAGE_STORAGE_KEY, LANGUAGES, TRANSLATIONS } from './constants.ts';

/** Runs the i18n setup again, as on a new page load, and returns its instance. */
const loadI18n = async () => {
  vi.resetModules();
  const { default: i18n } = await import('./index.ts');
  return i18n;
};

describe('i18n', () => {
  afterEach(async () => {
    vi.restoreAllMocks();
    localStorage.clear();
    window.history.replaceState(null, '', '/');
    await loadI18n();
  });

  it('loads the translations of every language', async () => {
    const i18n = await loadI18n();

    LANGUAGES.forEach(language =>
      expect(i18n.getResourceBundle(language, 'translation')).toEqual(TRANSLATIONS[language]),
    );
    expect(Object.keys(i18n.options.resources ?? {})).toEqual([...LANGUAGES]);
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
