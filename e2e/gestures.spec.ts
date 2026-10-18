import { SCROLL_GESTURE_DISTANCE_PX, SCROLL_GESTURE_SPEED_PX_PER_S } from './constants';
import { scrollDownWithGesture } from './gestures';

/** Creates a fake DevTools protocol session whose `send` resolves, or rejects with `error`. */
const createFakeSession = ({ error }: { error?: Error } = {}) => ({
  send: vi.fn(async () => {
    if (error) throw error;
    return {};
  }),
});

/** Point of the screen where the gestures of these tests start. */
const POINT = { x: 187, y: 333 };

describe('scrollDownWithGesture', () => {
  it.each(['mouse', 'touch'] as const)(
    'synthesizes a %s scroll down of the default distance at the point',
    async source => {
      const session = createFakeSession();

      await scrollDownWithGesture({ session: session as never, ...POINT, source });

      expect(session.send).toHaveBeenCalledOnce();
      expect(session.send).toHaveBeenCalledWith('Input.synthesizeScrollGesture', {
        ...POINT,
        yDistance: -SCROLL_GESTURE_DISTANCE_PX,
        gestureSourceType: source,
        speed: SCROLL_GESTURE_SPEED_PX_PER_S,
      });
    },
  );

  it.each([
    [250, -250],
    [-100, 100],
    [0, -0],
  ])('scrolls by a given distance of %d px', async (distancePx, yDistance) => {
    const session = createFakeSession();

    await scrollDownWithGesture({
      session: session as never,
      ...POINT,
      source: 'mouse',
      distancePx,
    });

    expect(session.send).toHaveBeenCalledWith(
      'Input.synthesizeScrollGesture',
      expect.objectContaining({ yDistance }),
    );
  });

  it('rejects with the error of the protocol when it refuses the gesture', async () => {
    const error = new Error('Touch is not supported');
    const session = createFakeSession({ error });

    await expect(
      scrollDownWithGesture({ session: session as never, ...POINT, source: 'touch' }),
    ).rejects.toBe(error);
  });

  describe('edge cases', () => {
    it.each([
      ['x', { x: Number.NaN }],
      ['y', { y: Number.POSITIVE_INFINITY }],
      ['distancePx', { distancePx: Number.NaN }],
      ['x', { x: '187' }],
      ['y', { y: undefined }],
      ['distancePx', { distancePx: null }],
    ])('rejects without sending anything when %s is invalid', async (name, invalidValue) => {
      const session = createFakeSession();

      await expect(
        scrollDownWithGesture({
          session: session as never,
          ...POINT,
          source: 'mouse',
          ...(invalidValue as object),
        }),
      ).rejects.toThrow(new RegExp(`invalid values \\(${name}: `));
      expect(session.send).not.toHaveBeenCalled();
    });
  });
});
