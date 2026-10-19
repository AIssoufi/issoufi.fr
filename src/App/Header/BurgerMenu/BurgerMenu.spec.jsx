import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';

import i18n from '../../../i18n/index.ts';
import { declaredStyle } from '../../../styleTestUtils.js';
import { theme } from '../../../theme/index.ts';
import BurgerMenu from './BurgerMenu.tsx';
import { TOP_BAR_OPEN_ROTATION_DEG } from './BurgerIcon/constants.ts';

/** The top, middle and bottom bars of the icon, in this order. */
const getBars = () => [...screen.getByRole('button').children];

describe('BurgerMenu', () => {
  afterEach(async () => {
    await act(() => i18n.changeLanguage('fr'));
  });

  it('renders without any props', () => {
    const { container } = render(<BurgerMenu />);

    expect(container.firstChild).toBeInTheDocument();
    // Pressed with no callback to call
    expect(() => fireEvent.click(container.firstChild)).not.toThrow();
  });

  it('keeps its size, and a smaller one that fits the compact header of a short screen', () => {
    render(<BurgerMenu />);
    const button = screen.getByRole('button');
    const shortScreenMedia = `(max-height: ${theme.screenHeights.short})`;

    expect(declaredStyle({ element: button, property: 'height' })).toBe(theme.sizes['burger-icon']);
    for (const property of ['width', 'height']) {
      expect(declaredStyle({ element: button, property, media: shortScreenMedia })).toBe(
        theme.sizes['burger-icon-compact'],
      );
    }
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

  describe('icon', () => {
    it('draws its three bars with the first render, with nothing to load', () => {
      render(<BurgerMenu />);

      expect(getBars()).toHaveLength(3);
      expect(screen.getByRole('button').querySelector('svg')).not.toBeInTheDocument();
    });

    it('shows a cross while the menu is open, and the bars of a closed menu otherwise', () => {
      const { rerender } = render(<BurgerMenu />);
      expect(declaredStyle({ element: getBars()[0], property: 'rotate' })).toBe('');

      rerender(<BurgerMenu isOpen />);

      expect(declaredStyle({ element: getBars()[0], property: 'rotate' })).toBe(
        `${TOP_BAR_OPEN_ROTATION_DEG}deg`,
      );
    });

    it('keeps the bars of a closed menu when isOpen is missing', () => {
      render(<BurgerMenu isOpen={undefined} />);

      expect(declaredStyle({ element: getBars()[0], property: 'rotate' })).toBe('');
      expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'false');
    });
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

    it('gives its button to the ref, so the parent can focus it', () => {
      const ref = createRef();
      render(<BurgerMenu ref={ref} />);

      act(() => ref.current.focus());

      expect(ref.current).toBe(screen.getByRole('button'));
      expect(screen.getByRole('button')).toHaveFocus();
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
