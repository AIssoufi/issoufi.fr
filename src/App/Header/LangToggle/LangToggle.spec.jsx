import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import i18n from '../../../i18n';
import LangToggle from './LangToggle';

/** The indicator is the first child of the toggle, before the language buttons. */
const getIndicator = () => screen.getByRole('group').firstElementChild;

const getFrenchButton = () => screen.getByRole('button', { name: 'Français' });
const getEnglishButton = () => screen.getByRole('button', { name: 'English' });

describe('LangToggle', () => {
  afterEach(async () => {
    await act(() => i18n.changeLanguage('fr'));
  });

  it('renders FR and EN buttons without any props', () => {
    render(<LangToggle />);
    expect(screen.getByText('FR')).toBeInTheDocument();
    expect(screen.getByText('EN')).toBeInTheDocument();
  });

  it('switches to English, then back to French', async () => {
    render(<LangToggle />);

    await userEvent.click(getEnglishButton());
    expect(i18n.language).toBe('en');

    await userEvent.click(getFrenchButton());
    expect(i18n.language).toBe('fr');
  });

  it('slides the indicator under the active language', async () => {
    render(<LangToggle />);
    expect(getComputedStyle(getIndicator()).transform).toContain('calc(0 *');

    await userEvent.click(getEnglishButton());

    expect(getComputedStyle(getIndicator()).transform).toContain('calc(1 *');
  });

  it('keeps the indicator under the first language when the language is not supported', async () => {
    render(<LangToggle />);

    await act(() => i18n.changeLanguage('de'));

    expect(getComputedStyle(getIndicator()).transform).toContain('calc(0 *');
  });

  it('stays in the page flow below the tablet breakpoint, so it covers no content', () => {
    // jsdom applies no media query, so these are the narrow-screen styles
    render(<LangToggle />);

    const wrapperStyle = getComputedStyle(screen.getByRole('group'));
    expect(wrapperStyle.position).toBe('relative');
    expect(wrapperStyle.flexDirection).toBe('row');
  });

  describe('accessibility', () => {
    it('names each button after its language, in that language', () => {
      render(<LangToggle />);

      expect(getFrenchButton()).toHaveAttribute('lang', 'fr');
      expect(getEnglishButton()).toHaveAttribute('lang', 'en');
    });

    it('makes both buttons plain buttons, so they never submit a form', () => {
      render(<LangToggle />);

      expect(getFrenchButton()).toHaveAttribute('type', 'button');
      expect(getEnglishButton()).toHaveAttribute('type', 'button');
    });

    it('labels the group in French and presses the French button when French is active', () => {
      render(<LangToggle />);

      expect(screen.getByRole('group', { name: 'Langue' })).toContainElement(getFrenchButton());
      expect(getFrenchButton()).toHaveAttribute('aria-pressed', 'true');
      expect(getEnglishButton()).toHaveAttribute('aria-pressed', 'false');
    });

    it('labels the group in English and presses the English button when English is active', async () => {
      render(<LangToggle />);

      await userEvent.click(getEnglishButton());

      expect(screen.getByRole('group', { name: 'Language' })).toContainElement(getEnglishButton());
      expect(getFrenchButton()).toHaveAttribute('aria-pressed', 'false');
      expect(getEnglishButton()).toHaveAttribute('aria-pressed', 'true');
    });

    it('keeps the button names when the language changes', async () => {
      render(<LangToggle />);

      await userEvent.click(getEnglishButton());

      expect(getFrenchButton()).toBeInTheDocument();
      expect(getEnglishButton()).toBeInTheDocument();
    });

    it('presses no button and labels the group in French when the language is not supported', async () => {
      render(<LangToggle />);

      await act(() => i18n.changeLanguage('de'));

      expect(screen.getByRole('group', { name: 'Langue' })).toBeInTheDocument();
      expect(getFrenchButton()).toHaveAttribute('aria-pressed', 'false');
      expect(getEnglishButton()).toHaveAttribute('aria-pressed', 'false');
    });
  });
});
