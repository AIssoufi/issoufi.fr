import { fireEvent, render, waitFor } from '@testing-library/react';
import lottie from 'lottie-web/build/player/lottie_light';

import BurgerMenu from './BurgerMenu';
import { OPEN_ANIMATION } from './constants';

describe('BurgerMenu', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders without any props', () => {
    const { container } = render(<BurgerMenu />);

    expect(container.firstChild).toBeInTheDocument();
    expect(() => fireEvent.click(container.firstChild)).not.toThrow();
  });

  it('calls onOpen when clicked while closed', () => {
    const onOpen = vi.fn();
    const onClose = vi.fn();
    const { container } = render(
      <BurgerMenu
        onOpen={onOpen}
        onClose={onClose}
      />,
    );

    fireEvent.click(container.firstChild);

    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('calls onClose when clicked while open', () => {
    const onOpen = vi.fn();
    const onClose = vi.fn();
    const { container } = render(
      <BurgerMenu
        isOpen
        onOpen={onOpen}
        onClose={onClose}
      />,
    );

    fireEvent.click(container.firstChild);

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onOpen).not.toHaveBeenCalled();
  });

  it('plays the icon animation forward on open, once lottie-web is loaded', async () => {
    const animation = { play: vi.fn(), destroy: vi.fn(), setSpeed: vi.fn(), setDirection: vi.fn() };
    vi.spyOn(lottie, 'loadAnimation').mockReturnValue(animation);
    const { container } = render(<BurgerMenu />);
    await waitFor(() =>
      expect(lottie.loadAnimation).toHaveBeenCalledWith(
        expect.objectContaining({ container: container.firstChild, renderer: 'svg' }),
      ),
    );

    fireEvent.click(container.firstChild);

    expect(animation.setSpeed).toHaveBeenCalledWith(OPEN_ANIMATION.speedMultiplier);
    expect(animation.setDirection).toHaveBeenCalledWith(OPEN_ANIMATION.direction);
    expect(animation.play).toHaveBeenCalledTimes(1);
  });
});
