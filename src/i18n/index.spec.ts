import { DEFAULT_LANGUAGE, LANGUAGE_STORAGE_KEY } from './constants';

/** Runs the i18n setup again, as on a new page load, and returns its instance. */
const loadI18n = async () => {
  vi.resetModules();
  const { default: i18n } = await import('./index');
  return i18n;
};

describe('i18n', () => {
  afterEach(async () => {
    vi.restoreAllMocks();
    localStorage.clear();
    await loadI18n();
  });

  it('starts in the default language on a first visit', async () => {
    const i18n = await loadI18n();

    expect(i18n.language).toBe(DEFAULT_LANGUAGE);
  });

  it('starts in the language chosen on a previous visit', async () => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, 'en');

    const i18n = await loadI18n();

    expect(i18n.language).toBe('en');
    expect(i18n.t('nav.projects')).toBe('Projects');
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
});
