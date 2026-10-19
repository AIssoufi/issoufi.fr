import { DEPARTMENT_LINE_START_PATTERN } from './constants';

/** A text that a page shows, with the size of its font. */
export interface DrawnText {
  /** Text of a text node, without the spaces around it. */
  text: string;
  /** Font size it is drawn in, in CSS pixels. */
  fontSizePx: number;
}

/**
 * Lists the texts that an element and its content show, one per text node, with the font size
 * each is drawn in. The text nodes holding only spaces and those of hidden elements, such as a
 * `<noscript>` or the closed mobile menu, are left out. Runs in the browser, passed to
 * `locator.evaluate`, so it uses nothing from outside its own body.
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
