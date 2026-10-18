import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import lottie from 'lottie-web/build/player/lottie_light';
import { createRef } from 'react';

import i18n from '../../../i18n';
import BurgerMenu from './BurgerMenu';
import { OPEN_ANIMATION } from './constants';

/** Animation returned by the mocked lottie-web, with the methods BurgerMenu calls. */
const animationMock = () => ({
  play: vi.fn(),
  destroy: vi.fn(),
  setSpeed: vi.fn(),
  setDirection: vi.fn(),
  goToAndStop: vi.fn(),
});

/**
 * Waits for the icon animation, drawn once lottie-web is loaded, so that this update never lands
 * outside `act` after the test.
 */
const waitForIcon = () => waitFor(() => expect(lottie.loadAnimation).toHaveBeenCalled());

/** Renders the button, then waits for its icon animation. */
const renderBurgerMenu = async ui => {
  const result = render(ui);
  await waitForIcon();
  return result;
};

describe('BurgerMenu', () => {
  beforeEach(() => {
    vi.spyOn(lottie, 'loadAnimation');
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await act(() => i18n.changeLanguage('fr'));
  });

  it('renders without any props', async () => {
    const { container } = render(<BurgerMenu />);

    expect(container.firstChild).toBeInTheDocument();
    // Pressed before lottie-web is loaded, with no animation to play
    expect(() => fireEvent.click(container.firstChild)).not.toThrow();
    await waitForIcon();
  });

  it('calls onOpen when clicked while closed', async () => {
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
    await waitForIcon();
  });

  it('calls onClose when clicked while open', async () => {
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
    await waitForIcon();
  });

  it('plays the icon animation forward on open, once lottie-web is loaded', async () => {
    const animation = animationMock();
    vi.spyOn(lottie, 'loadAnimation').mockReturnValue(animation);
    const { container } = render(<BurgerMenu />);
    await waitFor(() =>
      expect(lottie.loadAnimation).toHaveBeenCalledWith(
        expect.objectContaining({ container: container.firstChild, renderer: 'svg' }),
      ),
    );
    // Loading the animation while the menu is closed plays it backward, from the burger: no change
    animation.play.mockClear();

    fireEvent.click(container.firstChild);

    expect(animation.setSpeed).toHaveBeenCalledWith(OPEN_ANIMATION.speedMultiplier);
    expect(animation.setDirection).toHaveBeenCalledWith(OPEN_ANIMATION.direction);
    expect(animation.play).toHaveBeenCalledTimes(1);
  });

  it('shows the cross at once when the menu was opened before lottie-web was loaded', async () => {
    const animation = { ...animationMock(), totalFrames: 30 };
    vi.spyOn(lottie, 'loadAnimation').mockReturnValue(animation);
    render(<BurgerMenu isOpen />);

    await waitFor(() => expect(animation.goToAndStop).toHaveBeenCalledWith(29, true));
    expect(animation.play).not.toHaveBeenCalled();
  });

  it('keeps the burger when the menu is closed once lottie-web is loaded', async () => {
    const animation = { ...animationMock(), totalFrames: 30 };
    vi.spyOn(lottie, 'loadAnimation').mockReturnValue(animation);
    render(<BurgerMenu />);

    await waitFor(() => expect(lottie.loadAnimation).toHaveBeenCalled());
    expect(animation.goToAndStop).not.toHaveBeenCalled();
  });

  it('plays the animation instead of jumping to the cross when the menu opens', async () => {
    const animation = { ...animationMock(), totalFrames: 30 };
    vi.spyOn(lottie, 'loadAnimation').mockReturnValue(animation);
    const { container, rerender } = render(<BurgerMenu />);
    await waitFor(() => expect(lottie.loadAnimation).toHaveBeenCalled());
    animation.play.mockClear();

    fireEvent.click(container.firstChild);
    rerender(<BurgerMenu isOpen />);

    expect(animation.setDirection).toHaveBeenLastCalledWith(OPEN_ANIMATION.direction);
    expect(animation.play).toHaveBeenCalledTimes(1);
    expect(animation.goToAndStop).not.toHaveBeenCalled();
  });

  describe('accessibility', () => {
    it('renders a plain button, so it never submits a form', async () => {
      await renderBurgerMenu(<BurgerMenu />);

      expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
    });

    it('is named "Ouvrir le menu" and collapsed while the menu is closed', async () => {
      await renderBurgerMenu(<BurgerMenu />);

      expect(screen.getByRole('button', { name: 'Ouvrir le menu' })).toHaveAttribute(
        'aria-expanded',
        'false',
      );
    });

    it('is named "Fermer le menu" and expanded while the menu is open', async () => {
      await renderBurgerMenu(<BurgerMenu isOpen />);

      expect(screen.getByRole('button', { name: 'Fermer le menu' })).toHaveAttribute(
        'aria-expanded',
        'true',
      );
    });

    it('is named "Open menu" and collapsed while the menu is closed, in English', async () => {
      await act(() => i18n.changeLanguage('en'));
      await renderBurgerMenu(<BurgerMenu />);

      expect(screen.getByRole('button', { name: 'Open menu' })).toHaveAttribute(
        'aria-expanded',
        'false',
      );
    });

    it('is named "Close menu" and expanded while the menu is open, in English', async () => {
      await act(() => i18n.changeLanguage('en'));
      await renderBurgerMenu(<BurgerMenu isOpen />);

      expect(screen.getByRole('button', { name: 'Close menu' })).toHaveAttribute(
        'aria-expanded',
        'true',
      );
    });

    it('names the menu it controls', async () => {
      await renderBurgerMenu(<BurgerMenu menuId="mobile-menu" />);

      expect(screen.getByRole('button')).toHaveAttribute('aria-controls', 'mobile-menu');
    });

    it('names no menu without a menu id, or with an empty one', async () => {
      const { rerender } = await renderBurgerMenu(<BurgerMenu />);
      expect(screen.getByRole('button')).not.toHaveAttribute('aria-controls');

      rerender(<BurgerMenu menuId="" />);
      expect(screen.getByRole('button')).not.toHaveAttribute('aria-controls');
    });

    it('gives its button to the ref, so the parent can focus it', async () => {
      const ref = createRef();
      await renderBurgerMenu(<BurgerMenu ref={ref} />);

      act(() => ref.current.focus());

      expect(ref.current).toBe(screen.getByRole('button'));
      expect(screen.getByRole('button')).toHaveFocus();
    });

    it('is reached with Tab', async () => {
      await renderBurgerMenu(<BurgerMenu />);

      await userEvent.tab();

      expect(screen.getByRole('button')).toHaveFocus();
    });

    it.each([
      ['Enter', '{Enter}'],
      ['Space', ' '],
    ])('calls onOpen when %s is pressed while the menu is closed', async (_key, keys) => {
      const onOpen = vi.fn();
      const onClose = vi.fn();
      await renderBurgerMenu(
        <BurgerMenu
          onOpen={onOpen}
          onClose={onClose}
        />,
      );

      await userEvent.tab();
      await userEvent.keyboard(keys);

      expect(onOpen).toHaveBeenCalledTimes(1);
      expect(onClose).not.toHaveBeenCalled();
    });

    it.each([
      ['Enter', '{Enter}'],
      ['Space', ' '],
    ])('calls onClose when %s is pressed while the menu is open', async (_key, keys) => {
      const onOpen = vi.fn();
      const onClose = vi.fn();
      await renderBurgerMenu(
        <BurgerMenu
          isOpen
          onOpen={onOpen}
          onClose={onClose}
        />,
      );

      await userEvent.tab();
      await userEvent.keyboard(keys);

      expect(onClose).toHaveBeenCalledTimes(1);
      expect(onOpen).not.toHaveBeenCalled();
    });
  });
});
