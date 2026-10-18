import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import lottie from 'lottie-web/build/player/lottie_light';

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

describe('BurgerMenu', () => {
  afterEach(async () => {
    vi.restoreAllMocks();
    await act(() => i18n.changeLanguage('fr'));
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
    it('renders a plain button, so it never submits a form', () => {
      render(<BurgerMenu />);

      expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
    });

    it('is named "Ouvrir le menu" and collapsed while the menu is closed', () => {
      render(<BurgerMenu />);

      expect(screen.getByRole('button', { name: 'Ouvrir le menu' })).toHaveAttribute(
        'aria-expanded',
        'false',
      );
    });

    it('is named "Fermer le menu" and expanded while the menu is open', () => {
      render(<BurgerMenu isOpen />);

      expect(screen.getByRole('button', { name: 'Fermer le menu' })).toHaveAttribute(
        'aria-expanded',
        'true',
      );
    });

    it('is named "Open menu" and collapsed while the menu is closed, in English', async () => {
      await act(() => i18n.changeLanguage('en'));
      render(<BurgerMenu />);

      expect(screen.getByRole('button', { name: 'Open menu' })).toHaveAttribute(
        'aria-expanded',
        'false',
      );
    });

    it('is named "Close menu" and expanded while the menu is open, in English', async () => {
      await act(() => i18n.changeLanguage('en'));
      render(<BurgerMenu isOpen />);

      expect(screen.getByRole('button', { name: 'Close menu' })).toHaveAttribute(
        'aria-expanded',
        'true',
      );
    });

    it('names the menu it controls', () => {
      render(<BurgerMenu menuId="mobile-menu" />);

      expect(screen.getByRole('button')).toHaveAttribute('aria-controls', 'mobile-menu');
    });

    it('names no menu without a menu id, or with an empty one', () => {
      const { rerender } = render(<BurgerMenu />);
      expect(screen.getByRole('button')).not.toHaveAttribute('aria-controls');

      rerender(<BurgerMenu menuId="" />);
      expect(screen.getByRole('button')).not.toHaveAttribute('aria-controls');
    });

    it('is reached with Tab', async () => {
      render(<BurgerMenu />);

      await userEvent.tab();

      expect(screen.getByRole('button')).toHaveFocus();
    });

    it.each([
      ['Enter', '{Enter}'],
      ['Space', ' '],
    ])('calls onOpen when %s is pressed while the menu is closed', async (_key, keys) => {
      const onOpen = vi.fn();
      const onClose = vi.fn();
      render(
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
      render(
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
