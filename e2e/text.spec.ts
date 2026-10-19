import {
  describeSmallTexts,
  type DrawnCharacter,
  groupLines,
  listDrawnCharacters,
  listDrawnTexts,
} from './text';

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
