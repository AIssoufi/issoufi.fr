import { act, renderHook } from '@testing-library/react';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';

import { ROW_CARD_COUNT } from '../../constants';
import { useWholeCardCount } from './useWholeCardCount';

/** Layout of a fake row of cards, which jsdom would not lay out. */
interface RowLayout {
  /** Width of the padding box of the list, in pixels, as `clientWidth` reads it. */
  rowWidth: number;
  /** Left padding of the list. @default '19px' */
  paddingLeft?: string;
  /** Gap of the list between its cards. @default '' */
  columnGap?: string;
  /** Width of each card. @default '327px' */
  cardWidth?: string;
  /** Margin around each card. @default '5px' */
  margin?: string;
  /** Number of cards in the list. @default 3 */
  cardCount?: number;
}

/** Gives the list the width that `clientWidth` reads, which jsdom always gives as 0. */
const setRowWidth = ({ list, rowWidth }: { list: HTMLElement; rowWidth: number }) => {
  Object.defineProperty(list, 'clientWidth', { configurable: true, value: rowWidth });
};

/**
 * Builds a list of cards in the document, sized by inline styles, which jsdom's computed styles
 * read, with the width of a 375 px wide phone by default: one card between the page gutters.
 */
const createRow = ({
  rowWidth,
  paddingLeft = '19px',
  columnGap = '',
  cardWidth = '327px',
  margin = '5px',
  cardCount = 3,
}: RowLayout) => {
  const list = document.createElement('ul');
  list.style.paddingLeft = paddingLeft;
  list.style.columnGap = columnGap;
  setRowWidth({ list, rowWidth });
  for (let index = 0; index < cardCount; index += 1) {
    const card = document.createElement('li');
    card.style.width = cardWidth;
    card.style.margin = margin;
    list.append(card);
  }
  document.body.append(list);
  return list;
};

/** Fake `ResizeObserver`, which jsdom lacks, recording what it observes. */
class FakeResizeObserver {
  /** Every observer created by the test, in order. */
  static instances: FakeResizeObserver[] = [];

  callback: ResizeObserverCallback;
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
    FakeResizeObserver.instances.push(this);
  }
}

/** Calls every fake observer, as the browser does once an observed element is resized. */
const notifyResize = () => {
  act(() => {
    for (const observer of FakeResizeObserver.instances) {
      observer.callback([], observer as unknown as ResizeObserver);
    }
  });
};

/** Renders the hook, then gives it the list, as React does with the ref once the list renders. */
const renderWithList = ({ list, maxCount }: { list: HTMLElement | null; maxCount?: number }) => {
  const hook = renderHook(() => useWholeCardCount({ maxCount }));
  act(() => hook.result.current.listRef(list));
  return hook;
};

describe('useWholeCardCount', () => {
  beforeEach(() => {
    FakeResizeObserver.instances = [];
    vi.stubGlobal('ResizeObserver', FakeResizeObserver);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    document.body.replaceChildren();
  });

  it('counts the cards that the row holds until the list is rendered', () => {
    const { result } = renderHook(() => useWholeCardCount());

    expect(result.current.wholeCardCount).toBe(ROW_CARD_COUNT);
  });

  it('counts the cards that the row holds where nothing is laid out, as in jsdom', () => {
    const list = document.createElement('ul');
    list.append(document.createElement('li'));

    const { result } = renderWithList({ list });

    expect(result.current.wholeCardCount).toBe(ROW_CARD_COUNT);
  });

  it('counts the cards that the row holds when the list has no card to measure', () => {
    const { result } = renderWithList({ list: createRow({ rowWidth: 375, cardCount: 0 }) });

    expect(result.current.wholeCardCount).toBe(ROW_CARD_COUNT);
  });

  it.each([
    ['a phone 375 px wide', { rowWidth: 375 }, 1],
    ['a tablet 768 px wide', { rowWidth: 768, cardWidth: '355px' }, 2],
    ['a laptop', { rowWidth: 1336, paddingLeft: '0px', cardWidth: '435.33px' }, 3],
  ])('counts the cards that the row shows whole on %s', (_screen, layout, expected) => {
    const { result } = renderWithList({ list: createRow(layout) });

    expect(result.current.wholeCardCount).toBe(expected);
  });

  it('counts the gap of the list between the cards', () => {
    // Two cards of 300 px fit in 610 px side by side, not with a gap of 20 px
    const layout = { rowWidth: 610, paddingLeft: '0px', cardWidth: '300px', margin: '0px' };

    const { result: withoutGap } = renderWithList({ list: createRow(layout) });
    const { result: withGap } = renderWithList({
      list: createRow({ ...layout, columnGap: '20px' }),
    });

    expect(withoutGap.current.wholeCardCount).toBe(2);
    expect(withGap.current.wholeCardCount).toBe(1);
  });

  it('counts no more cards than the row holds, however wide the screen', () => {
    const list = createRow({ rowWidth: 2400, paddingLeft: '0px', cardWidth: '260px' });

    const { result } = renderWithList({ list, maxCount: 3 });

    expect(result.current.wholeCardCount).toBe(3);
  });

  it('counts one card when even the first one passes the edge of the row', () => {
    const { result } = renderWithList({ list: createRow({ rowWidth: 280, cardWidth: '300px' }) });

    expect(result.current.wholeCardCount).toBe(1);
  });

  it('counts again when the list is resized, as when the phone is rotated', () => {
    const list = createRow({ rowWidth: 375 });
    const { result } = renderWithList({ list });
    expect(result.current.wholeCardCount).toBe(1);

    setRowWidth({ list, rowWidth: 768 });
    for (const card of list.children) (card as HTMLElement).style.width = '355px';
    notifyResize();

    expect(result.current.wholeCardCount).toBe(2);
  });

  it('observes the list, and stops once the hook is unmounted', () => {
    const list = createRow({ rowWidth: 375 });
    const { unmount } = renderWithList({ list });
    const [observer] = FakeResizeObserver.instances;

    expect(observer.observe).toHaveBeenCalledWith(list);
    expect(observer.disconnect).not.toHaveBeenCalled();

    unmount();

    expect(observer.disconnect).toHaveBeenCalledOnce();
  });

  it('observes the new list when the list changes, and stops observing the old one', () => {
    const firstList = createRow({ rowWidth: 375 });
    const secondList = createRow({ rowWidth: 768, cardWidth: '355px' });
    const { result } = renderWithList({ list: firstList });
    const [firstObserver] = FakeResizeObserver.instances;

    act(() => result.current.listRef(secondList));

    expect(firstObserver.disconnect).toHaveBeenCalledOnce();
    expect(FakeResizeObserver.instances.at(-1)?.observe).toHaveBeenCalledWith(secondList);
    expect(result.current.wholeCardCount).toBe(2);
  });

  it('counts the cards of the list where ResizeObserver does not exist', () => {
    vi.stubGlobal('ResizeObserver', undefined);

    const { result } = renderWithList({ list: createRow({ rowWidth: 375 }) });

    expect(result.current.wholeCardCount).toBe(1);
  });

  it('counts the cards that the row holds once the list is removed', () => {
    const { result } = renderWithList({ list: createRow({ rowWidth: 375 }) });

    act(() => result.current.listRef(null));

    expect(result.current.wholeCardCount).toBe(ROW_CARD_COUNT);
  });

  it.each([0, -1, 2.5, Number.NaN, Number.POSITIVE_INFINITY])(
    'falls back to the cards of the row for a most count of %s',
    maxCount => {
      const { result } = renderHook(() => useWholeCardCount({ maxCount }));

      expect(result.current.wholeCardCount).toBe(ROW_CARD_COUNT);
    },
  );

  it('counts the most cards it may on the server, where no screen is known', () => {
    const Probe = () => String(useWholeCardCount({ maxCount: 2 }).wholeCardCount);

    expect(renderToString(createElement(Probe))).toBe('2');
  });
});
