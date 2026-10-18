import { LIKED_PROJECTS_STORAGE_KEY } from './constants';
import { getStoredLikedIds, storeLike } from './storage';

/** Error thrown by the storage when the browser blocks it, as with cookies disabled. */
const securityError = () => new DOMException('The operation is insecure.', 'SecurityError');

/** Error thrown by `setItem` when the storage is full, or limited to nothing in private mode. */
const quotaError = () => new DOMException('The quota has been exceeded.', 'QuotaExceededError');

/** Makes every access to `localStorage` throw, as when the browser blocks it. */
const blockStorageAccess = () =>
  vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => {
    throw securityError();
  });

/** Text stored under the key of the likes. */
const storedText = () => localStorage.getItem(LIKED_PROJECTS_STORAGE_KEY);

describe('like storage', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  describe('getStoredLikedIds', () => {
    it('likes nothing on a first visit', () => {
      expect(getStoredLikedIds().size).toBe(0);
    });

    it('returns the stored ids', () => {
      localStorage.setItem(LIKED_PROJECTS_STORAGE_KEY, '[1,5]');

      expect([...getStoredLikedIds()]).toEqual([1, 5]);
    });

    it.each(['', 'not json', '{"1":true}', '["1"]'])(
      'likes nothing for the stored text %j',
      value => {
        localStorage.setItem(LIKED_PROJECTS_STORAGE_KEY, value);

        expect(getStoredLikedIds().size).toBe(0);
      },
    );

    it('ignores the values stored under other keys', () => {
      localStorage.setItem('language', 'en');
      localStorage.setItem('likes', '[1]');

      expect(getStoredLikedIds().size).toBe(0);
    });

    it('likes nothing when reading the storage throws', () => {
      localStorage.setItem(LIKED_PROJECTS_STORAGE_KEY, '[1]');
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw securityError();
      });

      expect(getStoredLikedIds().size).toBe(0);
    });

    it('likes nothing when the browser blocks the storage', () => {
      localStorage.setItem(LIKED_PROJECTS_STORAGE_KEY, '[1]');
      blockStorageAccess();

      expect(getStoredLikedIds().size).toBe(0);
    });
  });

  describe('storeLike', () => {
    it('stores a like, so the next visit reads it', () => {
      storeLike({ id: 5, isLiked: true });

      expect(storedText()).toBe('[5]');
      expect([...getStoredLikedIds()]).toEqual([5]);
    });

    it('keeps the likes stored before, such as those of the other section', () => {
      storeLike({ id: 1, isLiked: true });
      storeLike({ id: 5, isLiked: true });

      expect(storedText()).toBe('[1,5]');
    });

    it('removes a like, and only that one', () => {
      localStorage.setItem(LIKED_PROJECTS_STORAGE_KEY, '[1,5]');

      storeLike({ id: 1, isLiked: false });

      expect(storedText()).toBe('[5]');
    });

    it('stores each like once', () => {
      storeLike({ id: 1, isLiked: true });
      storeLike({ id: 1, isLiked: true });

      expect(storedText()).toBe('[1]');
    });

    it('replaces a stored text that is not a list of ids', () => {
      localStorage.setItem(LIKED_PROJECTS_STORAGE_KEY, '{"1":true}');

      storeLike({ id: 5, isLiked: true });

      expect(storedText()).toBe('[5]');
    });

    it('does nothing when the storage is full', () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw quotaError();
      });

      expect(() => storeLike({ id: 1, isLiked: true })).not.toThrow();
      expect(storedText()).toBeNull();
    });

    it('does nothing when the browser blocks the storage', () => {
      const storageAccess = blockStorageAccess();

      expect(() => storeLike({ id: 1, isLiked: true })).not.toThrow();
      storageAccess.mockRestore();
      expect(storedText()).toBeNull();
    });
  });
});
