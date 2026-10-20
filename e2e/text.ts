import { DEPARTMENT_LINE_START_PATTERN } from './constants.ts';

/** A text that a page shows, with the size of its font. */
export interface DrawnText {
  /** Text of a text node, without the spaces around it. */
  text: string;
  /** Font size it is drawn in, in CSS pixels. */
  fontSizePx: number;
}

/**
 * Lists the texts that an element and its content show, one per text node, with the font size
 * each is drawn in. The text nodes holding only spaces and those of hidden elements, such as the
 * closed mobile menu, are left out. Runs in the browser, passed to `locator.evaluate`, so it uses
 * nothing from outside its own body.
 *
 * @param root - Node whose texts are listed, such as `body`. A text right under a root that
 * is not an element, such as a fragment, has no element to measure, and is left out.
 * @returns The texts in the order of the document.
 *
 * @example
 * await page.locator('body').evaluate(listDrawnTexts);
 * // [{ text: 'build v1.1.0', fontSizePx: 12 }, …]
 */
export const listDrawnTexts = (root: Node): DrawnText[] => {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  // A walker of SHOW_TEXT returns text nodes only, whose data is always a string
  const nextTextNode = () => walker.nextNode() as Text | null;
  const texts: DrawnText[] = [];
  for (let node = nextTextNode(); node; node = nextTextNode()) {
    const text = node.data.trim();
    const element = node.parentElement;
    const isShown = Boolean(element?.checkVisibility({ visibilityProperty: true }));
    if (!text || !element || !isShown) continue;

    texts.push({ text, fontSizePx: Number.parseFloat(getComputedStyle(element).fontSize) });
  }
  return texts;
};

/** Parameters of {@link describeSmallTexts}. */
interface DescribeSmallTextsParams {
  /** Texts of a page, as {@link listDrawnTexts} lists them. */
  texts?: readonly DrawnText[] | null;
  /** Smallest font size allowed, in CSS pixels. */
  minFontSizePx?: number;
}

/**
 * Describes the texts drawn under the smallest font size allowed, for the message of a failed
 * test, each one once however often the page shows it, such as a technology tag.
 *
 * @returns One description per small text, `<size>px: <text>`, in the order of the page; empty
 * when every text is large enough, or when the texts are not an array. A text whose font size is
 * not a number counts as small, and so does every text when the smallest size is not a number,
 * so that a broken measure fails the test.
 *
 * @example
 * describeSmallTexts({
 *   texts: [{ text: 'build v1.1.0', fontSizePx: 11 }, { text: 'Accueil', fontSizePx: 15 }],
 *   minFontSizePx: 12,
 * }); // ['11px: build v1.1.0']
 */
export const describeSmallTexts = ({
  texts,
  minFontSizePx = Number.NaN,
}: DescribeSmallTextsParams = {}): string[] => {
  const textList: readonly DrawnText[] = Array.isArray(texts) ? texts : [];
  const isReadable = ({ fontSizePx }: DrawnText) => fontSizePx >= minFontSizePx;
  const descriptions = textList
    .filter(text => !isReadable(text))
    .map(({ text, fontSizePx }) => `${fontSizePx}px: ${text}`);
  return [...new Set(descriptions)];
};

/** A character that a page shows, with the box of the line it is drawn on. */
export interface DrawnCharacter {
  /**
   * Position of its block among the blocks of the page: the closest element around it that is
   * not inline, such as a paragraph or a list item, whose lines it belongs to.
   */
  blockIndex: number;
  /** Distance from the top of the viewport to the top of its box, in CSS pixels. */
  top: number;
  /** Height of its box, in CSS pixels. */
  height: number;
  /** The character itself. */
  character: string;
}

/**
 * Lists the characters that an element and its content draw, each with the box it is drawn in
 * and the block whose lines it belongs to, so that {@link groupLines} can rebuild the lines that
 * the screen shows. A character the browser draws in no box, such as a space collapsed with the
 * one before it or the text of a hidden element, is left out. Runs in the browser, passed to
 * `locator.evaluate`, so it uses nothing from outside its own body.
 *
 * @param root - Node whose characters are listed, such as the `<main>` of a page. A text right
 * under a root that is not an element, such as a fragment, belongs to no block, and is left out.
 * @returns The characters in the order of the document.
 *
 * @example
 * const characters = await page.locator('main').evaluate(listDrawnCharacters);
 */
export const listDrawnCharacters = (root: Node): DrawnCharacter[] => {
  const blockIndexes = new Map<Element, number>();
  // An inline element belongs to the lines of its parent, up to the root
  const belongsToParentLines = (
    candidate: Element,
  ): candidate is Element & { parentElement: Element } =>
    candidate !== root &&
    candidate.parentElement !== null &&
    getComputedStyle(candidate).display.startsWith('inline');
  const findBlock = (element: Element) => {
    let block = element;
    while (belongsToParentLines(block)) block = block.parentElement;
    return block;
  };
  const range = document.createRange();
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  // A walker of SHOW_TEXT returns text nodes only, whose data is always a string
  const nextTextNode = () => walker.nextNode() as Text | null;
  const characters: DrawnCharacter[] = [];
  for (let node = nextTextNode(); node; node = nextTextNode()) {
    const element = node.parentElement;
    if (!element) continue;

    const block = findBlock(element);
    const blockIndex = blockIndexes.get(block) ?? blockIndexes.size;
    blockIndexes.set(block, blockIndex);
    const text = node.data;
    for (let index = 0; index < text.length; index += 1) {
      range.setStart(node, index);
      range.setEnd(node, index + 1);
      const [box] = range.getClientRects();
      const isDrawn = box !== undefined && box.width > 0;
      if (isDrawn)
        characters.push({ blockIndex, top: box.top, height: box.height, character: text[index] });
    }
  }
  return characters;
};

/** A line being rebuilt by {@link groupLines}. */
interface DrawnLine {
  /** Block that the line belongs to. */
  blockIndex: number;
  /** Top of the box of its first character, in CSS pixels. */
  top: number;
  /** Height of the box of its first character, in CSS pixels. */
  height: number;
  /** Characters of the line so far. */
  text: string;
}

/** Tells whether a value is a character with a finite box and a block, as listed by the browser. */
const isDrawnCharacter = (value: unknown): value is DrawnCharacter => {
  const character = value as Partial<DrawnCharacter> | null | undefined;
  const isCharacterString = typeof character?.character === 'string';
  const measures = [character?.blockIndex, character?.top, character?.height];
  return isCharacterString && measures.every(Number.isFinite);
};

/**
 * Rebuilds the lines that a page shows from its characters, as {@link listDrawnCharacters} lists
 * them: a character joins the last line of its block when its box stands at the same height, less
 * than half of a line apart, and starts a new line of its block otherwise, as after a wrap.
 *
 * @param characters - Characters of the page, in the order of the document.
 * @returns The text of each line, block after block, without the spaces at its ends; lines left
 * with no text are dropped. Empty when the characters are not an array; entries that are not
 * characters with a finite box are skipped.
 *
 * @example
 * groupLines([
 *   { blockIndex: 0, top: 10, height: 20, character: 'H' },
 *   { blockIndex: 0, top: 10, height: 20, character: 'i' },
 *   { blockIndex: 0, top: 32, height: 20, character: '!' },
 * ]); // ['Hi', '!']
 */
export const groupLines = (characters?: readonly DrawnCharacter[] | null): string[] => {
  const characterList = Array.isArray(characters) ? characters.filter(isDrawnCharacter) : [];
  const lines: DrawnLine[] = [];
  const lastLineOfBlock = new Map<number, DrawnLine>();
  for (const { blockIndex, top, height, character } of characterList) {
    const blockLine = lastLineOfBlock.get(blockIndex);
    const isOnBlockLine =
      blockLine !== undefined && Math.abs(top - blockLine.top) < blockLine.height / 2;
    if (isOnBlockLine) {
      blockLine.text += character;
      continue;
    }

    const newLine = { blockIndex, top, height, text: character };
    lines.push(newLine);
    lastLineOfBlock.set(blockIndex, newLine);
  }
  return lines.map(({ text }) => text.trim()).filter(Boolean);
};

/** The lines of a list that are strings, or none when it is not an array. */
const toLineList = (lines?: readonly string[] | null): string[] =>
  Array.isArray(lines) ? lines.filter(line => typeof line === 'string') : [];

/**
 * Lists the lines that hold a single word, such as a word left alone after a wrap. A no-break space
 * keeps the words it joins on one line, and counts here as the space between two words, so a line
 * of words joined by one, such as "UI Design", holds two of them.
 *
 * @param lines - Lines of text, as {@link groupLines} rebuilds them.
 * @returns The lines of a single word, in the order of the lines; empty when the lines are not an
 * array. Entries that are not strings, and lines with no word, are skipped.
 *
 * @example
 * findSingleWordLines(['Je vous aide à développer vos applications', 'web']); // ['web']
 */
export const findSingleWordLines = (lines?: readonly string[] | null): string[] => {
  const lineList = toLineList(lines);
  const countWords = (line: string) => line.split(/\s+/u).filter(Boolean).length;
  return lineList.filter(line => countWords(line) === 1);
};

/**
 * Lists the lines that start with the number of a French department in brackets, such as "(06)",
 * left on its own line, away from the city it follows ("Antibes (06)").
 *
 * @param lines - Lines of text, as {@link groupLines} rebuilds them.
 * @returns The lines starting with a department, in the order of the lines; empty when the lines
 * are not an array. Entries that are not strings are skipped.
 *
 * @example
 * findDetachedDepartmentLines(['Supralog · CDI · Antibes', '(06)']); // ['(06)']
 */
export const findDetachedDepartmentLines = (lines?: readonly string[] | null): string[] => {
  const lineList = toLineList(lines);
  return lineList.filter(line => DEPARTMENT_LINE_START_PATTERN.test(line.trim()));
};

/** The end of a list item that a page shows, where the separator drawn after its text stands. */
export interface DrawnItemEnd {
  /** Text of the item, without the spaces around it. */
  text: string;
  /**
   * Distance from the top of the viewport to the top of the box of its last line of text, in CSS
   * pixels.
   */
  textTop: number;
  /** Height of that box, in CSS pixels. */
  textHeight: number;
  /**
   * Distance from the top of the viewport to the top of the last box that the item draws, in CSS
   * pixels: the box of what follows its text, such as the separator of its `::after`.
   */
  endTop: number;
}

/**
 * Measures where each item of some lists ends: the line of its text and the line of the last box
 * it draws, which holds the separator of its `::after`. The text of a range leaves out the content
 * of the pseudo-elements, which only the boxes of the item hold. An item that draws no box, as
 * when hidden, is left out. Runs in the browser, passed to `locator.evaluateAll`, so it uses
 * nothing from outside its own body.
 *
 * @param lists - Lists whose items are measured, such as the lists of tools of the project cards.
 * @returns The end of each item, list after list, in the order of the document.
 *
 * @example
 * const itemEnds = await page.locator('main section ul ul').evaluateAll(listDrawnItemEnds);
 */
export const listDrawnItemEnds = (lists: Element[]): DrawnItemEnd[] => {
  const range = document.createRange();
  return lists.flatMap(list =>
    [...list.children].flatMap(item => {
      range.selectNodeContents(item);
      const lastTextBox = [...range.getClientRects()].at(-1);
      const lastItemBox = [...item.getClientRects()].at(-1);
      const isDrawn = lastTextBox !== undefined && lastItemBox !== undefined;
      if (!isDrawn) return [];

      return [
        {
          text: range.toString().trim(),
          textTop: lastTextBox.top,
          textHeight: lastTextBox.height,
          endTop: lastItemBox.top,
        },
      ];
    }),
  );
};

/** Tells whether a value is the end of an item with a text and finite boxes, as measured. */
const isDrawnItemEnd = (value: unknown): value is DrawnItemEnd => {
  const itemEnd = value as Partial<DrawnItemEnd> | null | undefined;
  const isTextString = typeof itemEnd?.text === 'string';
  const measures = [itemEnd?.textTop, itemEnd?.textHeight, itemEnd?.endTop];
  return isTextString && measures.every(Number.isFinite);
};

/**
 * Lists the items whose separator starts a line, such as a line of tools that reads "· Babel":
 * the last box of the item, which holds the separator drawn after its text, stands half a line or
 * more below the last line of its text, as after a wrap between the two.
 *
 * @param itemEnds - Ends of the items, as {@link listDrawnItemEnds} measures them.
 * @returns The text of each item whose separator wrapped, in the order of the items; empty when
 * the ends are not an array. Entries that are not the end of an item with finite boxes are
 * skipped.
 *
 * @example
 * findWrappedSeparatorItems([
 *   { text: 'Gulp', textTop: 10, textHeight: 20, endTop: 10 },
 *   { text: 'Mocha', textTop: 10, textHeight: 20, endTop: 32 },
 * ]); // ['Mocha']
 */
export const findWrappedSeparatorItems = (itemEnds?: readonly DrawnItemEnd[] | null): string[] => {
  const itemEndList = Array.isArray(itemEnds) ? itemEnds.filter(isDrawnItemEnd) : [];
  const hasWrappedSeparator = ({ textTop, textHeight, endTop }: DrawnItemEnd) =>
    endTop - textTop >= textHeight / 2;
  return itemEndList.filter(hasWrappedSeparator).map(({ text }) => text);
};

/** A word drawn in a box of its own, such as an animated word of the home title. */
export interface DrawnWord {
  /** Distance from the top of the viewport to the top of its box, in CSS pixels. */
  top: number;
  /** Height of its box, in CSS pixels. */
  height: number;
  /** Font size it is drawn in, in CSS pixels. */
  fontSizePx: number;
}

/** A block of text with the words of it drawn in boxes of their own, such as a line of a title. */
export interface WordBlock {
  /** Distance from the top of the viewport to the bottom of the block, in CSS pixels. */
  bottom: number;
  /** Its words, in the order of the document. */
  words: DrawnWord[];
}

/** Options of {@link measureWordBlock}, the argument that `locator.evaluate` passes to it. */
interface MeasureWordBlockOptions {
  /** Selector of the words of the block, such as `HERO_WORD_SELECTOR`. */
  wordSelector: string;
}

/**
 * Measures a block of text and the words of it drawn in boxes of their own, such as the animated
 * words of the home title, so that {@link measureWordLineHeights} can find the height of their
 * lines. Runs in the browser, passed to `locator.evaluate`, so it uses nothing from outside its
 * own body.
 *
 * @param block - Element whose words are measured, such as the job title of the home page.
 * @param options - The argument that `locator.evaluate` passes after the element.
 * @returns The bottom of the block and the box and font size of each of its words, in the order of
 * the document; no word when none matches the selector.
 *
 * @example
 * await page.locator(HERO_JOB_TITLE_SELECTOR)
 *   .evaluate(measureWordBlock, { wordSelector: HERO_WORD_SELECTOR });
 * // { bottom: 431, words: [{ top: 316, height: 58, fontSizePx: 48 }, …] }
 */
export const measureWordBlock = (
  block: Element,
  { wordSelector }: MeasureWordBlockOptions,
): WordBlock => {
  const words = [...block.querySelectorAll(wordSelector)].map(word => {
    const { top, height } = word.getBoundingClientRect();
    return { top, height, fontSizePx: Number.parseFloat(getComputedStyle(word).fontSize) };
  });
  return { bottom: block.getBoundingClientRect().bottom, words };
};

/** Tells whether a value is a word whose box and font size are finite numbers. */
const isDrawnWord = (value: unknown): value is DrawnWord => {
  const word = value as Partial<DrawnWord> | null | undefined;
  return [word?.top, word?.height, word?.fontSizePx].every(Number.isFinite);
};

/**
 * Measures the height of each line of the words of a block, as a share of the font size of its
 * first word: the distance from its top to the top of the next line of words, or to the bottom of
 * the block for the last one, which must end the block, as a big word ends each line of the home
 * title. A word joins the line of the word before it when its box stands at the same height, less
 * than half of a line apart, and starts a new line otherwise, as after a wrap.
 *
 * @param block - Block and its words, as {@link measureWordBlock} measures them.
 * @returns One ratio per line of words, from the first to the last; empty when the block is
 * missing, has no list of words or no finite bottom. Entries that are not words with a finite box
 * and font size are skipped. A line whose font size is zero or less has a ratio of `NaN`, so that
 * a broken measure fails the test.
 *
 * @example
 * measureWordLineHeights({
 *   bottom: 132,
 *   words: [
 *     { top: 10, height: 58, fontSizePx: 48 },
 *     { top: 70, height: 58, fontSizePx: 48 },
 *   ],
 * }); // [1.25, 1.29…]
 */
export const measureWordLineHeights = (block?: WordBlock | null): number[] => {
  const words = Array.isArray(block?.words) ? block.words.filter(isDrawnWord) : [];
  const bottom = block?.bottom;
  const hasBottom = typeof bottom === 'number' && Number.isFinite(bottom);
  if (!hasBottom) return [];

  // Each line is known by its first word
  const lines: DrawnWord[] = [];
  for (const word of words) {
    const lastLine = lines.at(-1);
    const isOnLastLine =
      lastLine !== undefined && Math.abs(word.top - lastLine.top) < lastLine.height / 2;
    if (!isOnLastLine) lines.push(word);
  }

  return lines.map(({ top, fontSizePx }, index) => {
    const lineBottom = lines[index + 1]?.top ?? bottom;
    const hasFontSize = fontSizePx > 0;
    return hasFontSize ? (lineBottom - top) / fontSizePx : Number.NaN;
  });
};
