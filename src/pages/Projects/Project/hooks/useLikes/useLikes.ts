import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useIsHydrated } from '../../../../../hooks/useIsHydrated/index.ts';
import { LIKE_ANIMATION_MS } from '../../constants.ts';
import { getStoredLikedIds, storeLike } from '../../storage.ts';
import { setLike } from '../../utils.ts';

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

/** Likes of the page rendered at build time, which knows nothing of the visitor: none. */
const NO_LIKED_IDS: ReadonlySet<number> = new Set();

/**
 * Manages the visitor's own likes of the project cards, and the short animation played on each
 * click. No project is liked on a first visit, and there is no count: a like is only the
 * visitor's, read from `localStorage` on the first render in the browser and stored on each
 * click, so it survives a reload and a change of language. The page rendered at build time, and
 * the browser while it hydrates it, show no like, and the stored ones right after (see
 * {@link useIsHydrated}). When the browser blocks the storage, the likes still toggle, for the
 * visit only. Pending animation timers are cleared on unmount.
 */
export function useLikes(): UseLikesResult {
  const isHydrated = useIsHydrated();
  const storedLikedIds = useMemo(
    () => (isHydrated ? getStoredLikedIds() : NO_LIKED_IDS),
    [isHydrated],
  );
  // `null` until the first click, so the likes follow the storage until then
  const [toggledLikedIds, setLikedIds] = useState<ReadonlySet<number> | null>(null);
  const likedIds = toggledLikedIds ?? storedLikedIds;
  const [animatingIds, setAnimatingIds] = useState<Set<number>>(() => new Set());
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>());

  useEffect(() => {
    const pendingTimers = timers.current;
    return () => pendingTimers.forEach(clearTimeout);
  }, []);

  const toggleLike = useCallback(
    (id: number) => {
      // The state after the click: a project not liked yet becomes liked, and the reverse
      const isLikedFromNow = !likedIds.has(id);
      setLikedIds(setLike({ likedIds, id, isLiked: isLikedFromNow }));
      storeLike({ id, isLiked: isLikedFromNow });
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
