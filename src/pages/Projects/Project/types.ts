/** One project card, with its texts in the language of the page. */
export interface ProjectItemData {
  /** Unique id: the React key and the key of the like state. */
  id: number;
  /** Project name, already translated, shown as the card title and the thumbnail alt text. */
  name: string;
  /** Kind of project, translated, e.g. "Web application", or "Application web" in French. */
  type: string;
  /** Absolute URL of the screenshot in `public/`, e.g. `/chess.webp`. */
  imageUrl: string;
  /**
   * Page opened in a new tab by the link of the card title, which covers the whole card. The card
   * has no link when it is missing, or when the project has no name to label the link with.
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
