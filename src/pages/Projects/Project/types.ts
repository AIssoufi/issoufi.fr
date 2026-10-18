/** One project card, with its texts in the language of the page. */
export interface ProjectItemData {
  /**
   * Integer that no other project of the site has, in either section: the React key, and the key
   * of the visitor's like in `localStorage`, so it must stay with its project.
   */
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
}

/** Measures of the row of cards of a section, in CSS pixels, at its first scroll position. */
export interface RowMeasures {
  /** Width that the row shows, its padding box, without the cards it scrolls to. */
  rowWidth: number;
  /** Distance from the left edge of the row to the left edge of its first card. */
  firstCardStart: number;
  /** Width of a card, the same for every card of the row. */
  cardWidth: number;
  /** Distance from the left edge of a card to the left edge of the next one. */
  cardPitch: number;
}
