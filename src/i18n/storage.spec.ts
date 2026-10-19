import { LANGUAGE_STORAGE_KEY } from './constants.ts';
import { getStoredLanguage, resolveInitialLanguage, storeLanguage } from './storage.ts';

/** Error thrown by the storage when the browser blocks it, as with cookies disabled. */
const securityError = () => new DOMException('The operation is insecure.', 'SecurityError');

/** Error thrown by `setItem` when the storage is full, or limited to nothing in private mode. */
const quotaError = () => new DOMException('The quota has been exceeded.', 'QuotaExceededError');

/** Makes every access to `localStorage` throw, as when the browser blocks it. */
const blockStorageAccess = () =>
  vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => {
    throw securityError();
  });

/** Opens a URL of the site, as a visitor would. */
const openUrl = (url: string) => window.history.replaceState(null, '', url);

/** Path, query string and fragment of the current URL. */
const currentUrl = () =>
  `${window.location.pathname}${window.location.search}${window.location.hash}`;

describe('language storage', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    localStorage.clear();
    openUrl('/');
  });

  describe('getStoredLanguage', () => {
    it('returns nothing on a first visit', () => {
      expect(getStoredLanguage()).toBeUndefined();
    });

    it.each(['en', 'fr'])('returns the stored language %j', language => {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, language);

      expect(getStoredLanguage()).toBe(language);
    });

    it.each(['de', 'EN', 'en-US', ' en', '', '"en"', 'null'])(
      'returns nothing for the stored value %j',
      value => {
        localStorage.setItem(LANGUAGE_STORAGE_KEY, value);

        expect(getStoredLanguage()).toBeUndefined();
      },
    );

    it('ignores the values stored under other keys', () => {
      localStorage.setItem('i18nextLng', 'en');

      expect(getStoredLanguage()).toBeUndefined();
    });

    it('returns nothing when reading the storage throws', () => {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, 'en');
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw securityError();
      });

      expect(getStoredLanguage()).toBeUndefined();
    });

    it('returns nothing when the browser blocks the storage', () => {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, 'en');
      blockStorageAccess();

      expect(getStoredLanguage()).toBeUndefined();
    });
  });

  describe('storeLanguage', () => {
    it('stores the language, so the next visit reads it', () => {
      storeLanguage('en');

      expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('en');
      expect(getStoredLanguage()).toBe('en');
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

  describe('resolveInitialLanguage', () => {
    it('starts in French at the root on a first visit, without leaving it', () => {
      expect(resolveInitialLanguage()).toBe('fr');
      expect(currentUrl()).toBe('/');
    });

    it.each([
      ['/en/', 'en'],
      ['/en/projects', 'en'],
      ['/en/page-inconnue', 'en'],
      ['/projects', 'fr'],
      ['/page-inconnue', 'fr'],
    ])('starts at %s in the language of the URL, %j', (url, language) => {
      openUrl(url);

      expect(resolveInitialLanguage()).toBe(language);
      expect(currentUrl()).toBe(url);
    });

    it('takes the root to the home page of the stored language, keeping the query and fragment', () => {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, 'en');
      openUrl('/?ref=cv#top');
      const historyLength = window.history.length;

      expect(resolveInitialLanguage()).toBe('en');
      expect(currentUrl()).toBe('/en/?ref=cv#top');
      // The root is replaced, so the back button does not return to it, and to the redirect
      expect(window.history.length).toBe(historyLength);
    });

    it('keeps French at the root when French is stored', () => {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, 'fr');

      expect(resolveInitialLanguage()).toBe('fr');
      expect(currentUrl()).toBe('/');
    });

    it.each(['/projects', '/en/projects'])(
      'keeps %s in its own language, whatever the stored language',
      url => {
        const urlLanguage = url.startsWith('/en/') ? 'en' : 'fr';
        localStorage.setItem(LANGUAGE_STORAGE_KEY, urlLanguage === 'en' ? 'fr' : 'en');
        openUrl(url);

        expect(resolveInitialLanguage()).toBe(urlLanguage);
        expect(currentUrl()).toBe(url);
      },
    );

    it('starts in French outside a browser, where there is no URL to read', () => {
      vi.stubGlobal('window', undefined);

      expect(resolveInitialLanguage()).toBe('fr');
    });

    it('stays at the root in French when the browser blocks the storage', () => {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, 'en');
      blockStorageAccess();

      expect(resolveInitialLanguage()).toBe('fr');
      expect(currentUrl()).toBe('/');
    });
  });
});
