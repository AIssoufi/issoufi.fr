import { configure, getConfig } from '@testing-library/react';
import lottie from 'lottie-web/build/player/lottie_light';

import { waitForBurgerIcon } from './testUtils';

/** Timeout of `waitFor` in the tests that expect a rejection, so that they end quickly. */
const SHORT_TIMEOUT_MS = 50;

describe('waitForBurgerIcon', () => {
  const { asyncUtilTimeout } = getConfig();

  beforeEach(() => {
    vi.spyOn(lottie, 'loadAnimation');
  });

  afterEach(() => {
    configure({ asyncUtilTimeout });
    vi.restoreAllMocks();
  });

  it('resolves once the animation is drawn', async () => {
    setTimeout(() => lottie.loadAnimation({}));

    await expect(waitForBurgerIcon()).resolves.toBeUndefined();
    expect(lottie.loadAnimation).toHaveBeenCalledTimes(1);
  });

  it('rejects when the animation is never drawn', async () => {
    configure({ asyncUtilTimeout: SHORT_TIMEOUT_MS });

    await expect(waitForBurgerIcon()).rejects.toThrow();
  });

  it('rejects when lottie.loadAnimation is not spied on', async () => {
    vi.restoreAllMocks();
    configure({ asyncUtilTimeout: SHORT_TIMEOUT_MS });
    lottie.loadAnimation({});

    await expect(waitForBurgerIcon()).rejects.toThrow();
  });
});
