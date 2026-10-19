/** One file of the screenshot of a project: the same image as the other files, at one width. */
export interface ThumbnailFile {
  /**
   * Absolute URL of the file in `public/`, e.g. `/chess-480.webp`, written whole: the standalone
   * build rewrites it into a relative URL.
   */
  url: string;
  /** Width of the file in pixels, its `w` descriptor in `srcset`. */
  width: number;
  /** Height of the file in pixels. */
  height: number;
}

/** Attributes of the `img` of a thumbnail, built by `getThumbnailSources` from its files. */
export interface ThumbnailSources {
  /** Widest file, for the browsers that ignore `srcset`. */
  src: string;
  /** Every file with its width (`/chess-480.webp 480w, …`), among which the browser picks. */
  srcSet: string;
  /** Width of the widest file, which gives the `img` the ratio of the screenshot. */
  width: number;
  /** Height of the widest file. */
  height: number;
}

/** One project card, with its texts in the language of the page. */
export interface ProjectItemData {
  /**
   * Integer that no other project of the site has, in either section: the React key, and the key
   * of the visitor's like in `localStorage`, so it must stay with its project.
   */
  id: number;
  /**
   * Project name, already translated: the level 3 heading of the card, and the end of the name of
   * its like button. A card without a name has no heading.
   */
  name: string;
  /** Kind of project, translated, e.g. "Web application", or "Application web" in French. */
  type: string;
  /**
   * Files of the screenshot of the project, the same image at several widths, among which the
   * browser downloads the one that the card needs on its screen. The card shows no image without
   * a valid one.
   */
  thumbnails: ThumbnailFile[];
  /**
   * Page opened in a new tab by the link of the card title, which covers the whole card. The card
   * has no link when it is missing, or when the project has no name to label the link with.
   */
  url?: string;
  /**
   * Technologies, a list under the name shown as one line separated by dots, each once. An entry
   * that is not a name is left out, and the card shows no list without one.
   */
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
