import { act, renderHook } from '@testing-library/react';

import { LIKE_ANIMATION_MS } from '../../constants';
import type { ProjectItemData } from '../../types';
import { useLikes } from './useLikes';

const project = (id: number, likeCount: number, isLikedByOwnUser: boolean): ProjectItemData => ({
  id,
  name: `Project ${id}`,
  type: 'Application web',
  imageUrl: `/${id}.png`,
  tools: [],
  likeCount,
  isLikedByOwnUser,
});

describe('useLikes', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts from the project data', () => {
    const { result } = renderHook(() => useLikes([project(1, 2, true)]));
    expect(result.current.likes).toEqual({ 1: { count: 2, liked: true } });
    expect(result.current.animatingIds.size).toBe(0);
  });

  it('toggles a like and animates it for a while', () => {
    const { result } = renderHook(() => useLikes([project(1, 2, false)]));

    act(() => result.current.toggleLike(1));
    expect(result.current.likes[1]).toEqual({ count: 3, liked: true });
    expect(result.current.animatingIds.has(1)).toBe(true);

    act(() => vi.advanceTimersByTime(LIKE_ANIMATION_MS));
    expect(result.current.animatingIds.has(1)).toBe(false);
  });

  it('handles an id missing from the initial data instead of crashing', () => {
    const { result } = renderHook(() => useLikes([]));

    act(() => result.current.toggleLike(42));

    expect(result.current.likes[42]).toEqual({ count: 1, liked: true });
  });

  it('clears pending timers on unmount', () => {
    const { result, unmount } = renderHook(() => useLikes([project(1, 0, false)]));
    act(() => result.current.toggleLike(1));

    unmount();

    expect(vi.getTimerCount()).toBe(0);
  });
});
