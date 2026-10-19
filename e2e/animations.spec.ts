import { listLastingAnimations, recordLargestShift, waitForEndingAnimations } from './animations';

/** Parameters of {@link fakeAnimation}. */
interface FakeAnimationParams {
  /** Number of times the animation repeats, `Infinity` for one that loops forever. */
  iterations: number;
  /** Promise that settles when the animation finishes or is cancelled. */
  finished: Promise<unknown>;
}

/** A fake animation that repeats `iterations` times, whose `finished` promise is given. */
const fakeAnimation = ({ iterations, finished }: FakeAnimationParams) => ({
  effect: { getComputedTiming: () => ({ iterations }) },
  finished,
});

/** A fake element holding the given animations, as `getAnimations({ subtree: true })` lists them. */
const fakeContainer = (animations: unknown[]) => {
  const getAnimations = vi.fn(() => animations);
  return { container: { getAnimations } as unknown as Element, getAnimations };
};

/** A promise and the function that resolves it. */
const deferred = () => {
  let resolve: () => void = () => {};
  const promise = new Promise<void>(done => {
    resolve = done;
  });
  return { promise, resolve };
};

describe('waitForEndingAnimations', () => {
  it('waits for every animation of the element and of its content to finish', async () => {
    const first = deferred();
    const second = deferred();
    const { container, getAnimations } = fakeContainer([
      fakeAnimation({ iterations: 1, finished: first.promise }),
      fakeAnimation({ iterations: 3, finished: second.promise }),
    ]);
    let isDone = false;

    const waiting = waitForEndingAnimations(container).then(() => {
      isDone = true;
    });
    first.resolve();
    await first.promise;
    expect(isDone).toBe(false);

    second.resolve();
    await waiting;
    expect(isDone).toBe(true);
    expect(getAnimations).toHaveBeenCalledWith({ subtree: true });
  });

  it('leaves out the animations that loop forever', async () => {
    const { container } = fakeContainer([
      fakeAnimation({ iterations: Number.POSITIVE_INFINITY, finished: new Promise(() => {}) }),
    ]);

    await expect(waitForEndingAnimations(container)).resolves.toBeUndefined();
  });

  it('counts a cancelled animation, whose promise rejects, as ended', async () => {
    const { container } = fakeContainer([
      fakeAnimation({
        iterations: 1,
        finished: Promise.reject(new DOMException('', 'AbortError')),
      }),
    ]);

    await expect(waitForEndingAnimations(container)).resolves.toBeUndefined();
  });

  it('resolves at once without any animation', async () => {
    const { container } = fakeContainer([]);
    await expect(waitForEndingAnimations(container)).resolves.toBeUndefined();
  });

  it('waits for an animation without an effect, which no timing marks as endless', async () => {
    const finished = deferred();
    const { container } = fakeContainer([{ effect: null, finished: finished.promise }]);
    let isDone = false;

    const waiting = waitForEndingAnimations(container).then(() => {
      isDone = true;
    });
    await Promise.resolve();
    expect(isDone).toBe(false);

    finished.resolve();
    await waiting;
    expect(isDone).toBe(true);
  });
});

/** Longest time, in ms, that the animations of {@link listLastingAnimations} tests may last. */
const MAX_DURATION_MS = 1;

/** Parameters of {@link fakeTimedAnimation}. */
interface FakeTimedAnimationParams {
  /** When the animation ends, delay included, in ms: `Infinity` for one that loops forever. */
  endTime: number;
  /** Keyframes of a CSS animation. */
  animationName?: string;
  /** Property changed by a CSS transition. */
  transitionProperty?: string;
  /** Tag of the animated element, upper case as in the DOM; `null` for an animation without one. */
  tagName?: string | null;
  /** Pseudo-element of the animated element, such as `::before`. */
  pseudoElement?: string | null;
}

/** A fake CSS animation or transition that ends at `endTime`, on an element of the given tag. */
const fakeTimedAnimation = ({
  endTime,
  animationName,
  transitionProperty,
  tagName = 'SPAN',
  pseudoElement = null,
}: FakeTimedAnimationParams) => ({
  animationName,
  transitionProperty,
  effect: {
    getComputedTiming: () => ({ endTime }),
    target: tagName === null ? null : { tagName },
    pseudoElement,
  },
});

describe('listLastingAnimations', () => {
  it('lists every animation of the element and of its content', () => {
    const { container, getAnimations } = fakeContainer([]);

    expect(listLastingAnimations(container, { maxDurationMs: MAX_DURATION_MS })).toEqual([]);
    expect(getAnimations).toHaveBeenCalledWith({ subtree: true });
  });

  it('describes an animation that loops forever by its keyframes, element and end', () => {
    const { container } = fakeContainer([
      fakeTimedAnimation({ endTime: Number.POSITIVE_INFINITY, animationName: 'textFlow' }),
    ]);

    expect(listLastingAnimations(container, { maxDurationMs: MAX_DURATION_MS })).toEqual([
      'textFlow on <span>, ends after Infinity ms',
    ]);
  });

  it('describes a transition by the property it changes, and a pseudo-element', () => {
    const { container } = fakeContainer([
      fakeTimedAnimation({
        endTime: 250,
        transitionProperty: 'transform',
        tagName: 'LI',
        pseudoElement: '::after',
      }),
    ]);

    expect(listLastingAnimations(container, { maxDurationMs: MAX_DURATION_MS })).toEqual([
      'transform on <li>::after, ends after 250 ms',
    ]);
  });

  it('keeps an animation that ends just in time, or before, and lists one just later', () => {
    const { container } = fakeContainer([
      fakeTimedAnimation({ endTime: MAX_DURATION_MS, animationName: 'onTime' }),
      fakeTimedAnimation({ endTime: MAX_DURATION_MS / 2, animationName: 'early' }),
      // A negative delay starts an animation before the page shows it
      fakeTimedAnimation({ endTime: -1000, animationName: 'started' }),
      fakeTimedAnimation({ endTime: MAX_DURATION_MS + 0.001, animationName: 'late' }),
    ]);

    expect(listLastingAnimations(container, { maxDurationMs: MAX_DURATION_MS })).toEqual([
      `late on <span>, ends after ${MAX_DURATION_MS + 0.001} ms`,
    ]);
  });

  it('names an animation without a name or an element all the same', () => {
    const { container } = fakeContainer([
      fakeTimedAnimation({ endTime: 900, animationName: '', tagName: null }),
    ]);

    expect(listLastingAnimations(container, { maxDurationMs: MAX_DURATION_MS })).toEqual([
      'animation on <no element>, ends after 900 ms',
    ]);
  });

  it('leaves out an animation without an effect, which has nothing to show', () => {
    const { container } = fakeContainer([{ effect: null }]);

    expect(listLastingAnimations(container, { maxDurationMs: MAX_DURATION_MS })).toEqual([]);
  });
});

/**
 * A stand-in for `DOMMatrixReadOnly`, which jsdom lacks, that reads the offset of the first
 * `translate(Xpx, Ypx)` of a transform, and none from any other transform.
 */
class FakeMatrix {
  e = 0;
  f = 0;

  constructor(transform = '') {
    const match = /translate\((-?[\d.]+)px, (-?[\d.]+)px\)/.exec(transform);
    if (!match) return;
    this.e = Number(match[1]);
    this.f = Number(match[2]);
  }
}

/** Elements whose inline `transform` is each of the given values. */
const transformedElements = (transforms: string[]) =>
  transforms.map(transform => {
    const element = document.createElement('span');
    element.style.transform = transform;
    return element;
  });

/**
 * Makes `requestAnimationFrame` call back at once, after running the step of the frame of the
 * given index, and returns its spy.
 */
const runFrames = (stepFrame: (frame: number) => void = () => {}) => {
  let frame = 0;
  return vi.spyOn(window, 'requestAnimationFrame').mockImplementation(callback => {
    stepFrame(frame);
    callback(frame);
    frame += 1;
    return frame;
  });
};

describe('recordLargestShift', () => {
  beforeEach(() => {
    vi.stubGlobal('DOMMatrixReadOnly', FakeMatrix);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('waits the given number of frames', async () => {
    const requestFrame = runFrames();

    await recordLargestShift(transformedElements(['']), { frameCount: 4 });

    expect(requestFrame).toHaveBeenCalledTimes(4);
  });

  it('gives the largest distance of any element from its place, a negative offset included', async () => {
    runFrames();
    const elements = transformedElements([
      'translate(3px, 4px) rotate(2deg)',
      'translate(-6px, -8px) rotate(-1deg)',
      'translate(1px, 0px)',
    ]);

    expect(await recordLargestShift(elements, { frameCount: 1 })).toBe(10);
  });

  it('keeps the peak of an element that goes back to its place in a later frame', async () => {
    const [word] = transformedElements(['translate(0px, 0px)']);
    const offsets = ['translate(0px, 2px)', 'translate(0px, 7px)', 'translate(0px, 0px)'];
    runFrames(frame => {
      word.style.transform = offsets[frame];
    });

    expect(await recordLargestShift([word], { frameCount: offsets.length })).toBe(7);
  });

  it('gives 0 for elements without a transform', async () => {
    runFrames();

    expect(await recordLargestShift(transformedElements(['', '']), { frameCount: 2 })).toBe(0);
  });

  it('gives 0 for an element without an inline style', async () => {
    runFrames();
    const element = document.createElementNS('https://example.com/no-style', 'word');

    expect(await recordLargestShift([element], { frameCount: 1 })).toBe(0);
  });

  it('gives 0 without any element', async () => {
    runFrames();

    expect(await recordLargestShift([], { frameCount: 2 })).toBe(0);
  });

  it.each([0, -1, Number.NaN])('gives 0 at once for %s frames', async frameCount => {
    const requestFrame = runFrames();

    expect(
      await recordLargestShift(transformedElements(['translate(5px, 0px)']), { frameCount }),
    ).toBe(0);
    expect(requestFrame).not.toHaveBeenCalled();
  });
});
