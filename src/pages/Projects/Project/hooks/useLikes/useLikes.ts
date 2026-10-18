import { useCallback, useEffect, useRef, useState } from 'react';

import { LIKE_ANIMATION_MS } from '../../constants';
import { getStoredLikedIds, storeLike } from '../../storage';
import { setLike } from '../../utils';

/** Value returned by {@link useLikes}. */
interface UseLikesResult {
  /** Ids of the projects that the visitor liked. */
  likedIds: ReadonlySet<number>;
  /** Ids of the cards whose like button is playing its pop animation. */
  animatingIds: Set<number>;
  /**
   * Likes a project, or removes its like, keeps it in `localStorage`, and plays the animation of
   * its button for {@link LIKE_ANIMATION_MS}.
   */
  toggleLike: (id: number) => void;
}

/**
 * Manages the visitor's own likes of the project cards, and the short animation played on each
 * click. No project is liked on a first visit, and there is no count: a like is only the
 * visitor's, read from `localStorage` on the first render and stored on each click, so it
 * survives a reload and a change of language. When the browser blocks the storage, the likes
 * still toggle, for the visit only. Pending animation timers are cleared on unmount.
 */
export function useLikes(): UseLikesResult {
  const [likedIds, setLikedIds] = useState<ReadonlySet<number>>(getStoredLikedIds);
  const [animatingIds, setAnimatingIds] = useState<Set<number>>(() => new Set());
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>());

  useEffect(() => {
    const pendingTimers = timers.current;
    return () => pendingTimers.forEach(clearTimeout);
  }, []);

  const toggleLike = useCallback(
    (id: number) => {
      const isLiked = !likedIds.has(id);
      setLikedIds(setLike({ likedIds, id, isLiked }));
      storeLike({ id, isLiked });
      setAnimatingIds(previous => new Set(previous).add(id));

      const timer = setTimeout(() => {
        timers.current.delete(timer);
        setAnimatingIds(previous => {
          const next = new Set(previous);
          next.delete(id);
          return next;
        });
      }, LIKE_ANIMATION_MS);
      timers.current.add(timer);
    },
    [likedIds],
  );

  return { likedIds, animatingIds, toggleLike };
}
