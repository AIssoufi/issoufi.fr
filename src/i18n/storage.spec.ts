import { DEFAULT_LANGUAGE, LANGUAGE_STORAGE_KEY } from './constants';
import { getInitialLanguage, storeLanguage } from './storage';

/** Error thrown by the storage when the browser blocks it, as with cookies disabled. */
const securityError = () => new DOMException('The operation is insecure.', 'SecurityError');

/** Error thrown by `setItem` when the storage is full, or limited to nothing in private mode. */
const quotaError = () => new DOMException('The quota has been exceeded.', 'QuotaExceededError');

/** Makes every access to `localStorage` throw, as when the browser blocks it. */
const blockStorageAccess = () =>
  vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => {
    throw securityError();
  });

describe('language storage', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  describe('getInitialLanguage', () => {
    it('starts in the default language on a first visit', () => {
      expect(getInitialLanguage()).toBe(DEFAULT_LANGUAGE);
      expect(DEFAULT_LANGUAGE).toBe('fr');
    });

    it.each(['en', 'fr'])('restores the stored language %j', language => {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, language);

      expect(getInitialLanguage()).toBe(language);
    });

    it.each(['de', 'EN', 'en-US', ' en', '', '"en"', 'null'])(
      'falls back to the default language for the stored value %j',
      value => {
        localStorage.setItem(LANGUAGE_STORAGE_KEY, value);

        expect(getInitialLanguage()).toBe(DEFAULT_LANGUAGE);
      },
    );

    it('ignores the values stored under other keys', () => {
      localStorage.setItem('i18nextLng', 'en');

      expect(getInitialLanguage()).toBe(DEFAULT_LANGUAGE);
    });

    it('falls back to the default language when reading the storage throws', () => {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, 'en');
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw securityError();
      });

      expect(getInitialLanguage()).toBe(DEFAULT_LANGUAGE);
    });

    it('falls back to the default language when the browser blocks the storage', () => {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, 'en');
      blockStorageAccess();

      expect(getInitialLanguage()).toBe(DEFAULT_LANGUAGE);
    });
  });

  describe('storeLanguage', () => {
    it('stores the language, so the next visit restores it', () => {
      storeLanguage('en');

      expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('en');
      expect(getInitialLanguage()).toBe('en');
    });

    it('replaces the language stored before', () => {
      storeLanguage('en');
      storeLanguage('fr');

      expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('fr');
    });

    it('does nothing when the storage is full', () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw quotaError();
      });

      expect(() => storeLanguage('en')).not.toThrow();
      expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBeNull();
    });

    it('does nothing when the browser blocks the storage', () => {
      const storageAccess = blockStorageAccess();

      expect(() => storeLanguage('en')).not.toThrow();

      storageAccess.mockRestore();
      expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBeNull();
    });
  });
});
