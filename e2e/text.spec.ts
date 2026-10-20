import {
  describeSmallTexts,
  type DrawnCharacter,
  type DrawnItemEnd,
  findDetachedDepartmentLines,
  findSingleWordLines,
  findWrappedSeparatorItems,
  groupLines,
  listDrawnCharacters,
  listDrawnItemEnds,
  listDrawnTexts,
  measureWordBlock,
  measureWordLineHeights,
} from './text.ts';

/** Box of a character drawn on the first line of its block. */
const FIRST_LINE_BOX = { top: 10, height: 20, width: 8 };

/** Box of a character drawn on the second line, a line of 22 px lower. */
const SECOND_LINE_BOX = { top: 32, height: 20, width: 8 };

/** Box of a character that the browser draws nowhere, such as a collapsed space. */
const EMPTY_BOX = { top: 10, height: 20, width: 0 };

/** Parameters of {@link character}. */
interface CharacterParams {
  /** The character. */
  character: string;
  /** Block it belongs to. @default 0 */
  blockIndex?: number;
  /** Top of its box. @default FIRST_LINE_BOX.top */
  top?: number;
}

/** A character of a page, as `listDrawnCharacters` lists it. */
const character = ({
  character: text,
  blockIndex = 0,
  top = FIRST_LINE_BOX.top,
}: CharacterParams): DrawnCharacter => ({
  blockIndex,
  top,
  height: FIRST_LINE_BOX.height,
  character: text,
});

/** Characters of a word, all on the same line of a block. */
const word = ({
  text,
  blockIndex = 0,
  top = FIRST_LINE_BOX.top,
}: Omit<CharacterParams, 'character'> & { text: string }) =>
  [...text].map(letter => character({ character: letter, blockIndex, top }));

/** Makes each element in the list visible to `checkVisibility`, which jsdom does not implement. */
const stubVisibility = (visibility: Map<Element, boolean>) => {
  Object.defineProperty(Element.prototype, 'checkVisibility', {
    configurable: true,
    value(this: Element) {
      return visibility.get(this) ?? true;
    },
  });
};

describe('listDrawnTexts', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    delete (Element.prototype as Partial<Element>).checkVisibility;
  });

  it('lists each text with the font size it is drawn in, without its spaces', () => {
    document.body.innerHTML = `
      <p style="font-size: 15px">  Accueil  </p>
      <span style="font-size: 12px">build v1.1.0</span>
    `;
    stubVisibility(new Map());

    expect(listDrawnTexts(document.body)).toEqual([
      { text: 'Accueil', fontSizePx: 15 },
      { text: 'build v1.1.0', fontSizePx: 12 },
    ]);
  });

  it('leaves out the texts holding only spaces and those of hidden elements', () => {
    document.body.innerHTML = `
      <p style="font-size: 15px"> </p>
      <nav style="font-size: 28px">Projets</nav>
      <span style="font-size: 11px">FR</span>
    `;
    stubVisibility(new Map([[document.querySelector('nav') as Element, false]]));

    expect(listDrawnTexts(document.body)).toEqual([{ text: 'FR', fontSizePx: 11 }]);
  });

  it('asks the browser whether a text is visible, its visibility property included', () => {
    document.body.innerHTML = '<p>Accueil</p>';
    const checkVisibility = vi.fn(() => true);
    Object.defineProperty(Element.prototype, 'checkVisibility', {
      configurable: true,
      value: checkVisibility,
    });

    listDrawnTexts(document.body);

    expect(checkVisibility).toHaveBeenCalledWith({ visibilityProperty: true });
  });

  it('lists nothing in an element without text', () => {
    stubVisibility(new Map());

    expect(listDrawnTexts(document.body)).toEqual([]);
  });

  it('leaves out a text without a parent element, as in a fragment given as the root', () => {
    const fragment = document.createRange().createContextualFragment('Accueil<p>Projets</p>');
    stubVisibility(new Map());

    const texts = listDrawnTexts(fragment);

    expect(texts.map(({ text }) => text)).toEqual(['Projets']);
  });
});

describe('describeSmallTexts', () => {
  const texts = [
    { text: 'build v1.1.0', fontSizePx: 11 },
    { text: 'React.js', fontSizePx: 11 },
    { text: 'React.js', fontSizePx: 11 },
    { text: 'FR', fontSizePx: 12 },
    { text: 'Accueil', fontSizePx: 15 },
  ];

  it('describes each text under the smallest size once, keeping those at the size itself', () => {
    expect(describeSmallTexts({ texts, minFontSizePx: 12 })).toEqual([
      '11px: build v1.1.0',
      '11px: React.js',
    ]);
  });

  it('describes nothing when every text reaches the smallest size', () => {
    expect(describeSmallTexts({ texts, minFontSizePx: 11 })).toEqual([]);
  });

  it('counts a text whose font size is not a number as small, so a broken measure fails', () => {
    expect(
      describeSmallTexts({
        texts: [{ text: 'Accueil', fontSizePx: Number.NaN }],
        minFontSizePx: 12,
      }),
    ).toEqual(['NaNpx: Accueil']);
  });

  it('counts every text as small without a smallest size that is a number', () => {
    const [firstText] = texts;

    expect(describeSmallTexts({ texts: [firstText] })).toEqual(['11px: build v1.1.0']);
    expect(describeSmallTexts({ texts: [firstText], minFontSizePx: Number.NaN })).toEqual([
      '11px: build v1.1.0',
    ]);
  });

  it.each([
    ['no params', undefined],
    ['no texts', { minFontSizePx: 12 }],
    ['null texts', { texts: null, minFontSizePx: 12 }],
    ['texts that are not an array', { texts: 'Accueil', minFontSizePx: 12 }],
  ])('describes nothing with %s', (_case, params) => {
    expect(describeSmallTexts(params as never)).toEqual([]);
  });
});

describe('listDrawnCharacters', () => {
  /** Box of each character of the document, by its text node and its position in it. */
  let boxes: Map<string, { top: number; height: number; width: number }>;

  // jsdom lays nothing out and gives ranges no getClientRects: each test draws its characters
  beforeEach(() => {
    boxes = new Map();
    Object.defineProperty(Range.prototype, 'getClientRects', {
      configurable: true,
      value(this: Range) {
        const box = boxes.get(`${this.startContainer.textContent}:${this.startOffset}`);
        return box ? [box] : [];
      },
    });
  });

  afterEach(() => {
    delete (Range.prototype as Partial<Range>).getClientRects;
    document.body.innerHTML = '';
  });

  /** Draws each character of a text in the given box. */
  const drawText = ({ text, box }: { text: string; box: typeof FIRST_LINE_BOX }) =>
    [...text].forEach((_letter, index) => boxes.set(`${text}:${index}`, box));

  it('lists each drawn character with its box and the block whose lines it belongs to', () => {
    document.body.innerHTML = '<main><p>Hi <strong>you</strong></p><ul><li>ok</li></ul></main>';
    drawText({ text: 'Hi ', box: FIRST_LINE_BOX });
    drawText({ text: 'you', box: FIRST_LINE_BOX });
    drawText({ text: 'ok', box: SECOND_LINE_BOX });

    const characters = listDrawnCharacters(document.querySelector('main') as Element);

    // The strong text is inline: its characters belong to the lines of the paragraph
    expect(characters.map(({ character: text, blockIndex }) => [text, blockIndex])).toEqual([
      ['H', 0],
      ['i', 0],
      [' ', 0],
      ['y', 0],
      ['o', 0],
      ['u', 0],
      ['o', 1],
      ['k', 1],
    ]);
    expect(characters[0]).toEqual({ blockIndex: 0, top: 10, height: 20, character: 'H' });
    expect(characters[6]).toEqual({ blockIndex: 1, top: 32, height: 20, character: 'o' });
  });

  it('leaves out the characters drawn in no box or in an empty one', () => {
    document.body.innerHTML = '<main><p>a b</p></main>';
    boxes.set('a b:0', FIRST_LINE_BOX);
    boxes.set('a b:1', EMPTY_BOX);

    const characters = listDrawnCharacters(document.querySelector('main') as Element);

    expect(characters.map(({ character: text }) => text)).toEqual(['a']);
  });

  it('gives an inline text right inside the root the block of the root', () => {
    document.body.innerHTML = '<span id="root">a<em>b</em></span>';
    boxes.set('a:0', FIRST_LINE_BOX);
    boxes.set('b:0', FIRST_LINE_BOX);

    const characters = listDrawnCharacters(document.getElementById('root') as Element);

    expect(characters.map(({ blockIndex }) => blockIndex)).toEqual([0, 0]);
  });

  it('lists nothing in an element without text', () => {
    document.body.innerHTML = '<main></main>';

    expect(listDrawnCharacters(document.querySelector('main') as Element)).toEqual([]);
  });

  it('leaves out a text without a parent element, as in a fragment given as the root', () => {
    const fragment = document.createRange().createContextualFragment('a<p>b</p>');
    boxes.set('a:0', FIRST_LINE_BOX);
    boxes.set('b:0', FIRST_LINE_BOX);

    const characters = listDrawnCharacters(fragment);

    expect(characters.map(({ character: text }) => text)).toEqual(['b']);
  });
});

describe('groupLines', () => {
  it('rebuilds the lines of a block, starting a new one where the text wraps', () => {
    const characters = [
      ...word({ text: 'Hello ' }),
      ...word({ text: 'world', top: SECOND_LINE_BOX.top }),
    ];

    expect(groupLines(characters)).toEqual(['Hello', 'world']);
  });

  it('keeps on one line the characters less than half a line apart, as a bold word', () => {
    const characters = [...word({ text: 'ab' }), character({ character: 'c', top: 19.9 })];

    expect(groupLines(characters)).toEqual(['abc']);
  });

  it('starts a new line half a line lower', () => {
    const characters = [...word({ text: 'ab' }), character({ character: 'c', top: 20 })];

    expect(groupLines(characters)).toEqual(['ab', 'c']);
  });

  it('keeps the lines of each block apart, even side by side or interleaved', () => {
    const characters = [
      ...word({ text: 'Intro ', blockIndex: 0 }),
      ...word({ text: 'item', blockIndex: 1 }),
      ...word({ text: 'end', blockIndex: 0 }),
    ];

    expect(groupLines(characters)).toEqual(['Intro end', 'item']);
  });

  it('drops the lines left with only spaces', () => {
    const characters = [...word({ text: 'a' }), ...word({ text: '  ', top: SECOND_LINE_BOX.top })];

    expect(groupLines(characters)).toEqual(['a']);
  });

  it('skips the entries that are not characters with a finite box', () => {
    const characters = [
      ...word({ text: 'ok' }),
      { ...character({ character: 'x' }), top: Number.NaN },
      { ...character({ character: 'y' }), blockIndex: undefined },
      { ...character({ character: 'z' }), character: 42 },
      null,
      'w',
    ];

    expect(groupLines(characters as never)).toEqual(['ok']);
  });

  it.each([
    ['no characters', []],
    ['nothing', undefined],
    ['null', null],
    ['an object', { character: 'a' }],
  ])('rebuilds no line from %s', (_case, characters) => {
    expect(groupLines(characters as never)).toEqual([]);
  });
});

describe('findSingleWordLines', () => {
  it('lists the lines that hold a single word, in their order', () => {
    const lines = ['Je vous aide à développer vos applications', 'web', 'passionné par', 'Design'];

    expect(findSingleWordLines(lines)).toEqual(['web', 'Design']);
  });

  it.each([
    ['words joined by a no-break space', 'UI\u00a0Design'],
    ['two words', 'UX and'],
    ['words between spaces', '  passionné par  '],
  ])('keeps a line of %s', (_case, line) => {
    expect(findSingleWordLines([line])).toEqual([]);
  });

  it('counts a word with an apostrophe or a hyphen as one word', () => {
    expect(findSingleWordLines(['l’UX', 'full-stack'])).toEqual(['l’UX', 'full-stack']);
  });

  it('skips the lines with no word and the entries that are not strings', () => {
    expect(findSingleWordLines(['', '  ', 42, null, undefined, 'web'] as never)).toEqual(['web']);
  });

  it.each([
    ['no lines', []],
    ['nothing', undefined],
    ['null', null],
    ['a string', 'web'],
  ])('finds no line in %s', (_case, lines) => {
    expect(findSingleWordLines(lines as never)).toEqual([]);
  });
});

describe('findDetachedDepartmentLines', () => {
  it('lists the lines that start with a department, in their order', () => {
    const lines = [
      'Supralog · CDI · Antibes',
      '(06)',
      'Sewan Groupe · CDI · Paris',
      '(75) et plus',
    ];

    expect(findDetachedDepartmentLines(lines)).toEqual(['(06)', '(75) et plus']);
  });

  it.each([
    ['a department after its city', 'Antibes\u00a0(06)'],
    ['a department of one digit', '(6)'],
    ['a department of three digits', '(974)'],
    ['a bracketed word', '(DX)'],
    ['an empty line', ''],
  ])('keeps a line with %s', (_case, line) => {
    expect(findDetachedDepartmentLines([line])).toEqual([]);
  });

  it('finds a department after spaces at the start of the line', () => {
    expect(findDetachedDepartmentLines(['  (06)'])).toEqual(['  (06)']);
  });

  it('skips the entries that are not strings', () => {
    expect(findDetachedDepartmentLines([6, null, '(06)'] as never)).toEqual(['(06)']);
  });

  it.each([
    ['no lines', []],
    ['nothing', undefined],
    ['null', null],
    ['a string', '(06)'],
  ])('finds no line in %s', (_case, lines) => {
    expect(findDetachedDepartmentLines(lines as never)).toEqual([]);
  });
});

describe('listDrawnItemEnds', () => {
  /** Boxes of the content of each item, as a range around it gives them. */
  let textBoxes: Map<Node, (typeof FIRST_LINE_BOX)[]>;
  /** Boxes that each item draws, its `::after` included. */
  let itemBoxes: Map<Element, (typeof FIRST_LINE_BOX)[]>;

  // jsdom lays nothing out and gives ranges no getClientRects: each test draws its items
  beforeEach(() => {
    textBoxes = new Map();
    itemBoxes = new Map();
    Object.defineProperty(Range.prototype, 'getClientRects', {
      configurable: true,
      value(this: Range) {
        return textBoxes.get(this.startContainer) ?? [];
      },
    });
    vi.spyOn(Element.prototype, 'getClientRects').mockImplementation(function (this: Element) {
      return (itemBoxes.get(this) ?? []) as unknown as DOMRectList;
    });
  });

  afterEach(() => {
    delete (Range.prototype as Partial<Range>).getClientRects;
    vi.restoreAllMocks();
    document.body.innerHTML = '';
  });

  /** Items of the lists of the document, in its order. */
  const getItems = () => [...document.querySelectorAll('li')];

  /** Lists of the document, in its order. */
  const getLists = () => [...document.querySelectorAll('ul')];

  it('measures the last line of the text and the last box of each item, list after list', () => {
    document.body.innerHTML =
      '<ul><li>Gulp</li><li> Mocha </li></ul><ul><li>Babel</li></ul><ul></ul>';
    const [gulp, mocha, babel] = getItems();
    textBoxes.set(gulp, [FIRST_LINE_BOX]);
    itemBoxes.set(gulp, [FIRST_LINE_BOX, FIRST_LINE_BOX]);
    // A tool that wraps, then its dot alone on the next line
    textBoxes.set(mocha, [FIRST_LINE_BOX, SECOND_LINE_BOX]);
    itemBoxes.set(mocha, [FIRST_LINE_BOX, SECOND_LINE_BOX, { ...SECOND_LINE_BOX, top: 54 }]);
    textBoxes.set(babel, [SECOND_LINE_BOX]);
    itemBoxes.set(babel, [SECOND_LINE_BOX]);

    expect(listDrawnItemEnds(getLists())).toEqual([
      { text: 'Gulp', textTop: 10, textHeight: 20, endTop: 10 },
      { text: 'Mocha', textTop: 32, textHeight: 20, endTop: 54 },
      { text: 'Babel', textTop: 32, textHeight: 20, endTop: 32 },
    ]);
  });

  it.each([
    ['no text box', { text: [], item: [FIRST_LINE_BOX] }],
    ['no box of its own', { text: [FIRST_LINE_BOX], item: [] }],
    ['no box at all', { text: [], item: [] }],
  ])('leaves out an item that draws %s, as when hidden', (_case, boxes) => {
    document.body.innerHTML = '<ul><li>Gulp</li><li>Babel</li></ul>';
    const [gulp, babel] = getItems();
    textBoxes.set(gulp, boxes.text);
    itemBoxes.set(gulp, boxes.item);
    textBoxes.set(babel, [FIRST_LINE_BOX]);
    itemBoxes.set(babel, [FIRST_LINE_BOX]);

    expect(listDrawnItemEnds(getLists()).map(({ text }) => text)).toEqual(['Babel']);
  });

  it('measures nothing without lists', () => {
    expect(listDrawnItemEnds([])).toEqual([]);
  });
});

describe('findWrappedSeparatorItems', () => {
  /** End of an item whose last line of text stands on the first line. */
  const itemEnd = ({ text = 'Mocha', endTop = FIRST_LINE_BOX.top }: Partial<DrawnItemEnd>) => ({
    text,
    textTop: FIRST_LINE_BOX.top,
    textHeight: FIRST_LINE_BOX.height,
    endTop,
  });

  it('lists the items whose separator stands on a line below their text, in their order', () => {
    const itemEnds = [
      itemEnd({ text: 'Gulp' }),
      itemEnd({ text: 'Mocha', endTop: SECOND_LINE_BOX.top }),
      itemEnd({ text: 'Babel', endTop: SECOND_LINE_BOX.top }),
    ];

    expect(findWrappedSeparatorItems(itemEnds)).toEqual(['Mocha', 'Babel']);
  });

  it.each([
    ['on the line of the text', FIRST_LINE_BOX.top],
    ['a pixel lower, from rounding', FIRST_LINE_BOX.top + 1],
    ['just under half a line lower', FIRST_LINE_BOX.top + FIRST_LINE_BOX.height / 2 - 0.1],
    ['above the text', FIRST_LINE_BOX.top - FIRST_LINE_BOX.height],
  ])('keeps a separator %s', (_case, endTop) => {
    expect(findWrappedSeparatorItems([itemEnd({ endTop })])).toEqual([]);
  });

  it('counts a separator half a line lower as wrapped', () => {
    const endTop = FIRST_LINE_BOX.top + FIRST_LINE_BOX.height / 2;

    expect(findWrappedSeparatorItems([itemEnd({ endTop })])).toEqual(['Mocha']);
  });

  it('skips the entries that are not the end of an item with finite boxes', () => {
    const wrapped = itemEnd({ endTop: SECOND_LINE_BOX.top });
    const itemEnds = [
      null,
      undefined,
      42,
      { ...wrapped, text: 7 },
      { ...wrapped, textTop: Number.NaN },
      { ...wrapped, textHeight: undefined },
      { ...wrapped, endTop: Number.POSITIVE_INFINITY },
      { ...wrapped, endTop: '32' },
      wrapped,
    ];

    expect(findWrappedSeparatorItems(itemEnds as never)).toEqual(['Mocha']);
  });

  it.each([
    ['no items', []],
    ['nothing', undefined],
    ['null', null],
    ['a string', 'Mocha'],
  ])('finds no item in %s', (_case, itemEnds) => {
    expect(findWrappedSeparatorItems(itemEnds as never)).toEqual([]);
  });
});

describe('measureWordBlock', () => {
  /** Box of each element of the document, by its id. */
  let boxes: Map<string, { top: number; height: number; bottom: number }>;

  // jsdom lays nothing out, and gives every element an empty box: each test places its elements
  beforeEach(() => {
    boxes = new Map();
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (
      this: Element,
    ) {
      return (boxes.get(this.id) ?? { top: 0, height: 0, bottom: 0 }) as DOMRect;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = '';
  });

  it('measures the bottom of the block and the box and font size of each word, in order', () => {
    document.body.innerHTML = `
      <span id="block">
        <span id="first" style="font-size: 48px">Full-stack</span>
        <em>and</em>
        <span id="second" style="font-size: 24px">Developer</span>
      </span>
    `;
    boxes.set('block', { top: 10, height: 122, bottom: 132 });
    boxes.set('first', { top: 10, height: 58, bottom: 68 });
    boxes.set('second', { top: 70, height: 29, bottom: 99 });

    const block = measureWordBlock(document.getElementById('block') as Element, {
      wordSelector: 'span',
    });

    expect(block).toEqual({
      bottom: 132,
      words: [
        { top: 10, height: 58, fontSizePx: 48 },
        { top: 70, height: 29, fontSizePx: 24 },
      ],
    });
  });

  it('measures no word when none matches the selector', () => {
    document.body.innerHTML = '<p id="block">Design</p>';
    boxes.set('block', { top: 10, height: 30, bottom: 40 });

    const block = measureWordBlock(document.getElementById('block') as Element, {
      wordSelector: 'span',
    });

    expect(block).toEqual({ bottom: 40, words: [] });
  });
});

describe('measureWordLineHeights', () => {
  /** Font size of the words of the tests, in CSS pixels. */
  const FONT_SIZE_PX = 40;

  /** Height of the box of a word of the tests, 1.2 times its font size. */
  const WORD_HEIGHT_PX = 48;

  /** A word of {@link FONT_SIZE_PX}, as `measureWordBlock` measures it. */
  const drawnWord = ({ top, fontSizePx = FONT_SIZE_PX }: { top: number; fontSizePx?: number }) => ({
    top,
    height: WORD_HEIGHT_PX,
    fontSizePx,
  });

  it('measures each line to the top of the next one, and the last one to the bottom of the block', () => {
    const block = {
      bottom: 150,
      words: [drawnWord({ top: 10 }), drawnWord({ top: 10 }), drawnWord({ top: 70 })],
    };

    // 60 px to the next line, then 80 px to the bottom of the block
    expect(measureWordLineHeights(block)).toEqual([1.5, 2]);
  });

  it('measures a single line to the bottom of the block', () => {
    const block = { bottom: 58, words: [drawnWord({ top: 10 }), drawnWord({ top: 10 })] };

    expect(measureWordLineHeights(block)).toEqual([1.2]);
  });

  it('keeps on one line the words less than half a line apart, as a word pushed a little', () => {
    const block = { bottom: 82, words: [drawnWord({ top: 10 }), drawnWord({ top: 33.9 })] };

    expect(measureWordLineHeights(block)).toEqual([1.8]);
  });

  it('starts a new line half a line lower', () => {
    const block = { bottom: 82, words: [drawnWord({ top: 10 }), drawnWord({ top: 34 })] };

    expect(measureWordLineHeights(block)).toEqual([0.6, 1.2]);
  });

  it('divides the height of each line by the font size of its first word', () => {
    const block = {
      bottom: 110,
      words: [
        drawnWord({ top: 10, fontSizePx: 20 }),
        drawnWord({ top: 10 }),
        drawnWord({ top: 70 }),
      ],
    };

    expect(measureWordLineHeights(block)).toEqual([3, 1]);
  });

  it.each([
    ['zero', 0],
    ['negative', -40],
  ])(
    'gives a line whose font size is %s a ratio of NaN, so a broken measure fails',
    (_case, fontSizePx) => {
      const block = { bottom: 58, words: [drawnWord({ top: 10, fontSizePx })] };

      expect(measureWordLineHeights(block)).toEqual([Number.NaN]);
    },
  );

  it('skips the entries that are not words with a finite box and font size', () => {
    const block = {
      bottom: 58,
      words: [
        { ...drawnWord({ top: 0 }), top: Number.NaN },
        { ...drawnWord({ top: 0 }), height: Number.POSITIVE_INFINITY },
        { top: 0, height: WORD_HEIGHT_PX },
        { ...drawnWord({ top: 0 }), fontSizePx: '40px' },
        null,
        'UX',
        drawnWord({ top: 10 }),
      ],
    };

    expect(measureWordLineHeights(block as never)).toEqual([1.2]);
  });

  it.each([
    ['nothing', undefined],
    ['null', null],
    ['a block without words', { bottom: 58, words: [] }],
    ['words that are not a list', { bottom: 58, words: drawnWord({ top: 10 }) }],
    ['a block without a bottom', { words: [drawnWord({ top: 10 })] }],
    ['a bottom of NaN', { bottom: Number.NaN, words: [drawnWord({ top: 10 })] }],
    ['a bottom that is a string', { bottom: '58', words: [drawnWord({ top: 10 })] }],
  ])('measures no line from %s', (_case, block) => {
    expect(measureWordLineHeights(block as never)).toEqual([]);
  });
});
