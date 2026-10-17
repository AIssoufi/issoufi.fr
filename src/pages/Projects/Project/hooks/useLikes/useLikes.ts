import { useCallback, useEffect, useRef, useState } from 'react';

import { LIKE_ANIMATION_MS } from '../../constants';
import type { LikeState, ProjectItemData } from '../../types';
import { createInitialLikes, toggleLike as toggle } from '../../utils';

/** Value returned by {@link useLikes}. */
interface UseLikesResult {
  /** Like count and flag of each card, by project id. */
  likes: LikeState;
  /** Ids of the cards whose like button is playing its pop animation. */
  animatingIds: Set<number>;
  /** Toggles the like of a card and plays its animation for {@link LIKE_ANIMATION_MS}. */
  toggleLike: (id: number) => void;
}

/**
 * Manages the in-memory likes of the project cards, starting from the JSON data, and the short
 * animation played on each click. Pending animation timers are cleared on unmount.
 *
 * @param projects - Cards whose initial likes to load. Read once, on the first render.
 */
export function useLikes(projects: ProjectItemData[]): UseLikesResult {
  const [likes, setLikes] = useState<LikeState>(() => createInitialLikes(projects));
  const [animatingIds, setAnimatingIds] = useState<Set<number>>(() => new Set());
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>());

  useEffect(() => {
    const pendingTimers = timers.current;
    return () => pendingTimers.forEach(clearTimeout);
  }, []);

  const toggleLike = useCallback((id: number) => {
    setLikes(previous => ({ ...previous, [id]: toggle(previous[id]) }));
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
  }, []);

  return { likes, animatingIds, toggleLike };
}
