import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import i18n from '../../../i18n';
import LangToggle from './LangToggle';

/** The indicator is the first child of the toggle, before the language buttons. */
const getIndicator = () => screen.getByText('FR').parentElement.firstElementChild;

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

    await userEvent.click(screen.getByText('EN'));
    expect(i18n.language).toBe('en');

    await userEvent.click(screen.getByText('FR'));
    expect(i18n.language).toBe('fr');
  });

  it('slides the indicator under the active language', async () => {
    render(<LangToggle />);
    expect(getComputedStyle(getIndicator()).transform).toContain('calc(0 *');

    await userEvent.click(screen.getByText('EN'));

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

    const wrapperStyle = getComputedStyle(screen.getByText('FR').parentElement);
    expect(wrapperStyle.position).toBe('relative');
    expect(wrapperStyle.flexDirection).toBe('row');
  });
});
