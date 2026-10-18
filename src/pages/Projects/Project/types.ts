/** One project card, as stored in `.data/*-projects.json`. */
export interface ProjectItemData {
  /** Unique id: the React key and the key of the like state. */
  id: number;
  /** Project name, shown as the card title and the thumbnail alt text. */
  name: string;
  /** Kind of project, e.g. "Application web" or "Site vitrine". */
  type: string;
  /** Absolute URL of the screenshot in `public/`, e.g. `/chess.webp`. */
  imageUrl: string;
  /**
   * Page opened in a new tab by the link of the card title, which covers the whole card. The card
   * has no link when missing.
   */
  url?: string;
  /** Technologies, shown under the name separated by ` · `. */
  tools: string[];
  /** Initial number of likes. */
  likeCount: number;
  /** Whether the visitor's like is initially set. */
  isLikedByOwnUser: boolean;
}

/** Like count and liked flag of one card. */
export interface Like {
  /** Number of likes shown on the card. */
  count: number;
  /** Whether the visitor has liked the card. */
  liked: boolean;
}

/** Like state of each card, by project id. Kept in memory only, never saved. */
export type LikeState = Record<number, Like>;
