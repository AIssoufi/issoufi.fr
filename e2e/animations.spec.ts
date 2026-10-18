import { waitForEndingAnimations } from './animations';

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
