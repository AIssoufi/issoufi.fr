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
 * @param root - Element whose texts are listed, such as `body`.
 * @returns The texts in the order of the document.
 *
 * @example
 * await page.locator('body').evaluate(listDrawnTexts);
 * // [{ text: 'build v1.1.0', fontSizePx: 12 }, …]
 */
export const listDrawnTexts = (root: Element): DrawnText[] => {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const texts: DrawnText[] = [];
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const text = node.textContent?.trim() ?? '';
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
 * @param root - Element whose characters are listed, such as the `<main>` of a page.
 * @returns The characters in the order of the document.
 *
 * @example
 * const characters = await page.locator('main').evaluate(listDrawnCharacters);
 */
export const listDrawnCharacters = (root: Element): DrawnCharacter[] => {
  const blockIndexes = new Map<Element, number>();
  const findBlock = (element: Element) => {
    let block = element;
    const isInline = (candidate: Element) =>
      getComputedStyle(candidate).display.startsWith('inline');
    while (block !== root && block.parentElement && isInline(block)) block = block.parentElement;
    return block;
  };
  const range = document.createRange();
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const characters: DrawnCharacter[] = [];
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const element = node.parentElement;
    if (!element) continue;

    const block = findBlock(element);
    if (!blockIndexes.has(block)) blockIndexes.set(block, blockIndexes.size);
    const blockIndex = blockIndexes.get(block) ?? 0;
    const text = node.textContent ?? '';
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
