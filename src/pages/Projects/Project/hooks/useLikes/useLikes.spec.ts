import { act, renderHook } from '@testing-library/react';

import { LIKE_ANIMATION_MS, LIKED_PROJECTS_STORAGE_KEY } from '../../constants';
import { useLikes } from './useLikes';

/** Makes every access to `localStorage` throw, as when the browser blocks it. */
const blockStorageAccess = () =>
  vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => {
    throw new DOMException('The operation is insecure.', 'SecurityError');
  });

/** Ids that the hook shows as liked, in their order. */
const likedIdsOf = (result: { current: ReturnType<typeof useLikes> }) => [
  ...result.current.likedIds,
];

describe('useLikes', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('likes nothing on a first visit, and plays no animation', () => {
    const { result } = renderHook(() => useLikes());

    expect(result.current.likedIds.size).toBe(0);
    expect(result.current.animatingIds.size).toBe(0);
  });

  it('starts from the likes stored on a previous visit', () => {
    localStorage.setItem(LIKED_PROJECTS_STORAGE_KEY, '[1,5]');

    const { result } = renderHook(() => useLikes());

    expect(likedIdsOf(result)).toEqual([1, 5]);
  });

  it('likes nothing when the stored likes are not a list of ids', () => {
    localStorage.setItem(LIKED_PROJECTS_STORAGE_KEY, '{"1":true}');

    const { result } = renderHook(() => useLikes());

    expect(result.current.likedIds.size).toBe(0);
  });

  it('likes a project, then removes its like, and stores each change', () => {
    const { result } = renderHook(() => useLikes());

    act(() => result.current.toggleLike(1));
    expect(likedIdsOf(result)).toEqual([1]);
    expect(localStorage.getItem(LIKED_PROJECTS_STORAGE_KEY)).toBe('[1]');

    act(() => result.current.toggleLike(1));
    expect(likedIdsOf(result)).toEqual([]);
    expect(localStorage.getItem(LIKED_PROJECTS_STORAGE_KEY)).toBe('[]');
  });

  it('keeps a like for the next visit, as after a reload or a change of language', () => {
    const { result, unmount } = renderHook(() => useLikes());
    act(() => result.current.toggleLike(5));
    unmount();

    const { result: nextVisit } = renderHook(() => useLikes());

    expect(likedIdsOf(nextVisit)).toEqual([5]);
  });

  it('keeps the likes of the other section of the page when it stores its own', () => {
    const { result: personalProjects } = renderHook(() => useLikes());
    const { result: freelanceProjects } = renderHook(() => useLikes());

    act(() => personalProjects.current.toggleLike(1));
    act(() => freelanceProjects.current.toggleLike(5));

    expect(localStorage.getItem(LIKED_PROJECTS_STORAGE_KEY)).toBe('[1,5]');
    expect(likedIdsOf(personalProjects)).toEqual([1]);
    expect(likedIdsOf(freelanceProjects)).toEqual([5]);
  });

  it('still toggles the likes for the visit when the browser blocks the storage', () => {
    blockStorageAccess();
    const { result } = renderHook(() => useLikes());

    act(() => result.current.toggleLike(1));
    expect(likedIdsOf(result)).toEqual([1]);

    act(() => result.current.toggleLike(1));
    expect(likedIdsOf(result)).toEqual([]);
  });

  it('still shows a like when the storage is full', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('The quota has been exceeded.', 'QuotaExceededError');
    });
    const { result } = renderHook(() => useLikes());

    act(() => result.current.toggleLike(1));

    expect(likedIdsOf(result)).toEqual([1]);
  });

  it('animates the button of a toggled like for a while', () => {
    const { result } = renderHook(() => useLikes());

    act(() => result.current.toggleLike(1));
    expect(result.current.animatingIds.has(1)).toBe(true);

    act(() => vi.advanceTimersByTime(LIKE_ANIMATION_MS - 1));
    expect(result.current.animatingIds.has(1)).toBe(true);

    act(() => vi.advanceTimersByTime(1));
    expect(result.current.animatingIds.has(1)).toBe(false);
  });

  it('animates the removal of a like too', () => {
    localStorage.setItem(LIKED_PROJECTS_STORAGE_KEY, '[1]');
    const { result } = renderHook(() => useLikes());

    act(() => result.current.toggleLike(1));

    expect(result.current.animatingIds.has(1)).toBe(true);
  });

  it('clears pending timers on unmount', () => {
    const { result, unmount } = renderHook(() => useLikes());
    act(() => result.current.toggleLike(1));

    unmount();

    expect(vi.getTimerCount()).toBe(0);
  });
});
