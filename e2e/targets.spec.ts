import { measureHitAreas, type MeasureHitAreasOptions } from './targets';

/** Box that catches the points of an element, in pixels, and the element that the points hit. */
interface HitBox {
  /** Element under the points of the box. */
  element: Element;
  /** Left edge, included. */
  left: number;
  /** Top edge, included. */
  top: number;
  /** Right edge, left out. */
  right: number;
  /** Bottom edge, left out. */
  bottom: number;
}

/** Options of the measures, with an overlay and a skip link, as the browser test passes them. */
const OPTIONS: MeasureHitAreasOptions = {
  controlSelector: 'a[href], button',
  excludedSelector: '.skip-link',
  overlaySelector: 'header',
  maxReachPx: 44,
};

/**
 * Fakes the layout of the page, which jsdom does not compute: the box of each element, and the
 * boxes that catch the points, the last one on top, as a pseudo-element larger than its element.
 * `document.elementsFromPoint` lists the elements under a point, the top one first.
 */
const fakeLayout = ({
  boxes = new Map<Element, Omit<HitBox, 'element'>>(),
  hitBoxes = [] as HitBox[],
}) => {
  for (const [element, { left, top, right, bottom }] of boxes) {
    vi.spyOn(element, 'getBoundingClientRect').mockReturnValue(
      DOMRect.fromRect({ x: left, y: top, width: right - left, height: bottom - top }),
    );
  }
  const elementsFromPoint = vi.fn((x: number, y: number) =>
    hitBoxes
      .filter(box => x >= box.left && x < box.right && y >= box.top && y < box.bottom)
      .map(({ element }) => element)
      .reverse(),
  );
  const scrollIntoView = vi.fn();
  Object.assign(document, { elementsFromPoint });
  Object.assign(Element.prototype, { scrollIntoView });
  return { elementsFromPoint, scrollIntoView };
};

/** Builds the given markup in the body, and returns the element of each selector. */
const renderPage = (markup: string) => {
  document.body.innerHTML = markup;
  return (selector: string) => document.querySelector(selector) as Element;
};

/** A box of the given size whose top left corner is at the given point. */
const boxAt = ({ x = 100, y = 100, width = 0, height = 0 }) => ({
  left: x,
  top: y,
  right: x + width,
  bottom: y + height,
});

describe('measureHitAreas', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = '';
    Reflect.deleteProperty(document, 'elementsFromPoint');
    Reflect.deleteProperty(Element.prototype, 'scrollIntoView');
  });

  it('measures the area of a control as large as its box', () => {
    const get = renderPage('<button>Next</button>');
    const box = boxAt({ width: 44, height: 44 });
    fakeLayout({
      boxes: new Map([[get('button'), box]]),
      hitBoxes: [{ element: get('button'), ...box }],
    });

    expect(measureHitAreas(OPTIONS)).toEqual([{ name: 'Next', width: 44, height: 44 }]);
  });

  it.each([
    ['centered on it', boxAt({ x: 94, y: 94, width: 44, height: 44 }), { width: 44, height: 44 }],
    ['to one side', boxAt({ x: 96, y: 92, width: 40, height: 56 }), { width: 40, height: 56 }],
    ['of an odd size', boxAt({ x: 93, y: 94, width: 45, height: 43 }), { width: 45, height: 43 }],
  ])('measures an area larger than the box of the control, %s', (_case, hitBox, size) => {
    const get = renderPage('<button aria-label="Like">♥</button>');
    fakeLayout({
      boxes: new Map([[get('button'), boxAt({ width: 32, height: 32 })]]),
      hitBoxes: [{ element: get('button'), ...hitBox }],
    });

    expect(measureHitAreas(OPTIONS)).toEqual([{ name: 'Like', ...size }]);
  });

  it('counts the points of the content of the control', () => {
    const get = renderPage('<a href="/"><span>Home</span></a>');
    const box = boxAt({ width: 60, height: 44 });
    fakeLayout({
      boxes: new Map([[get('a'), box]]),
      hitBoxes: [
        { element: get('a'), ...box },
        { element: get('span'), ...boxAt({ x: 110, y: 110, width: 40, height: 20 }) },
      ],
    });

    expect(measureHitAreas(OPTIONS)).toEqual([{ name: 'Home', width: 60, height: 44 }]);
  });

  it('stops where another element covers the control', () => {
    const get = renderPage('<button>FR</button><button>EN</button>');
    const french = boxAt({ width: 44, height: 44 });
    fakeLayout({
      boxes: new Map([
        [get('button:first-child'), french],
        [get('button:last-child'), boxAt({ x: 144, width: 44, height: 44 })],
      ]),
      hitBoxes: [
        { element: get('button:first-child'), ...french },
        // The area of the second button reaches 4 px over the first one
        { element: get('button:last-child'), ...boxAt({ x: 140, width: 48, height: 44 }) },
      ],
    });

    expect(measureHitAreas(OPTIONS)).toEqual([
      { name: 'FR', width: 40, height: 44 },
      { name: 'EN', width: 48, height: 44 },
    ]);
  });

  it('leaves out the overlay over a control of the page, but not over a control of the overlay', () => {
    const get = renderPage(
      '<header><button>Menu</button><div class="band"></div></header><main><button>Next</button></main>',
    );
    const menu = boxAt({ x: 0, y: 0, width: 44, height: 44 });
    const next = boxAt({ x: 100, y: 100, width: 44, height: 44 });
    fakeLayout({
      boxes: new Map([
        [get('header button'), menu],
        [get('main button'), next],
      ]),
      hitBoxes: [
        { element: get('header button'), ...menu },
        { element: get('main button'), ...next },
        // A band of the header covers the top half of both buttons
        { element: get('.band'), ...boxAt({ x: 0, y: 0, width: 400, height: 122 }) },
      ],
    });

    expect(measureHitAreas(OPTIONS)).toEqual([
      { name: 'Menu', width: 0, height: 0 },
      { name: 'Next', width: 44, height: 44 },
    ]);
  });

  it('scrolls each control of the page to the middle of the screen before measuring it, but not those of the overlay', () => {
    const get = renderPage('<header><a href="/">AI</a></header><main><button>Next</button></main>');
    const { scrollIntoView } = fakeLayout({
      boxes: new Map([
        [get('header a'), boxAt({ width: 44, height: 44 })],
        [get('main button'), boxAt({ width: 44, height: 44 })],
      ]),
    });

    measureHitAreas(OPTIONS);

    expect(scrollIntoView).toHaveBeenCalledExactlyOnceWith({ block: 'center', inline: 'center' });
    expect(scrollIntoView.mock.contexts).toEqual([get('main button')]);
  });

  it('stops measuring past the largest reach, on each side', () => {
    const get = renderPage('<a href="/projects/1">Chess</a>');
    fakeLayout({
      boxes: new Map([[get('a'), boxAt({ width: 60, height: 20 })]]),
      // The area of a link that covers its whole card
      hitBoxes: [{ element: get('a'), ...boxAt({ x: 0, y: 0, width: 300, height: 400 }) }],
    });

    expect(measureHitAreas({ ...OPTIONS, maxReachPx: 10 })).toEqual([
      { name: 'Chess', width: 21, height: 21 },
    ]);
  });

  it('measures nothing around a control covered at its center', () => {
    const get = renderPage('<button>Next</button><div class="cover"></div>');
    const box = boxAt({ width: 44, height: 44 });
    const { elementsFromPoint } = fakeLayout({
      boxes: new Map([[get('button'), box]]),
      hitBoxes: [
        { element: get('button'), ...box },
        { element: get('.cover'), ...boxAt({ x: 110, y: 110, width: 20, height: 20 }) },
      ],
    });

    expect(measureHitAreas(OPTIONS)).toEqual([{ name: 'Next', width: 0, height: 0 }]);
    expect(elementsFromPoint).toHaveBeenCalledOnce();
  });

  it('names a control by its label, or else by its text without the spaces around it', () => {
    const get = renderPage(
      '<button aria-label="Previous page"><svg></svg></button><a href="/"> Home </a><button></button>',
    );
    const box = boxAt({ width: 44, height: 44 });
    const controls = ['button[aria-label]', 'a', 'button:empty'].map(get);
    fakeLayout({
      boxes: new Map(controls.map(control => [control, box])),
      hitBoxes: [],
    });

    expect(measureHitAreas(OPTIONS).map(({ name }) => name)).toEqual(['Previous page', 'Home', '']);
  });

  describe('edge cases', () => {
    it('leaves out the excluded controls, those of an inert element, and those with no width or height', () => {
      const get = renderPage(
        [
          '<a class="skip-link" href="#main">Skip to content</a>',
          '<div inert><button>Behind the menu</button></div>',
          '<button class="closed">In the closed menu</button>',
          '<button class="flat">Flat</button>',
          '<button class="shown">Shown</button>',
        ].join(''),
      );
      const box = boxAt({ width: 44, height: 44 });
      fakeLayout({
        boxes: new Map([
          [get('.skip-link'), box],
          [get('[inert] button'), box],
          [get('.closed'), boxAt({})],
          [get('.flat'), boxAt({ width: 44 })],
          [get('.shown'), box],
        ]),
        hitBoxes: [{ element: get('.shown'), ...box }],
      });

      expect(measureHitAreas(OPTIONS)).toEqual([{ name: 'Shown', width: 44, height: 44 }]);
    });

    it('measures every control as a control of the page when the page has no overlay', () => {
      const get = renderPage('<button>Next</button><div class="cover"></div>');
      const box = boxAt({ width: 44, height: 44 });
      const { scrollIntoView } = fakeLayout({
        boxes: new Map([[get('button'), box]]),
        hitBoxes: [
          { element: get('button'), ...box },
          { element: get('.cover'), ...boxAt({ x: 130, width: 30, height: 44 }) },
        ],
      });

      expect(measureHitAreas({ ...OPTIONS, overlaySelector: 'nav' })).toEqual([
        { name: 'Next', width: 30, height: 44 },
      ]);
      expect(scrollIntoView).toHaveBeenCalledOnce();
    });

    it('names a control with an empty name when its text content is null', () => {
      const get = renderPage('<button>Next</button>');
      const box = boxAt({ width: 44, height: 44 });
      Object.defineProperty(get('button'), 'textContent', { get: () => null });
      fakeLayout({ boxes: new Map([[get('button'), box]]) });

      expect(measureHitAreas(OPTIONS).map(({ name }) => name)).toEqual(['']);
    });

    it('measures nothing on a page without controls', () => {
      renderPage('<p>Nothing to tap</p>');
      fakeLayout({});

      expect(measureHitAreas(OPTIONS)).toEqual([]);
    });
  });
});
