import { waitFor } from '@testing-library/react';
import lottie from 'lottie-web/build/player/lottie_light';

/**
 * Waits for the burger icon animation of the header, drawn once lottie-web is loaded, after the
 * first render, so that this update never lands outside `act` after the test. Used by the specs
 * that render the burger menu; spy on the animation first, with
 * `vi.spyOn(lottie, 'loadAnimation')`, before the render.
 *
 * @returns {Promise<void>} Rejected when the animation is not drawn within the timeout of
 * `waitFor`, or when `lottie.loadAnimation` is not spied on.
 */
export const waitForBurgerIcon = async () => {
  await waitFor(() => expect(lottie.loadAnimation).toHaveBeenCalled());
};
