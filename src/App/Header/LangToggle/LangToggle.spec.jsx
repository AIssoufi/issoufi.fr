import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router';

import i18n from '../../../i18n/index.ts';
import { LANGUAGE_STORAGE_KEY } from '../../../i18n/constants.ts';
import {
  declaredStyle,
  FORCED_COLORS_MEDIA,
  getContrastRatio,
  MIN_TEXT_CONTRAST_RATIO,
  serializeCssValue,
} from '../../../styleTestUtils.js';
import { theme } from '../../../theme/index.ts';
import { HOVER_POINTER_QUERY } from '../../../theme/constants.ts';
import UrlLanguage from '../../UrlLanguage/index.ts';
import LangToggle from './LangToggle.tsx';

/** The indicator is the first child of the toggle, before the language buttons. */
const getIndicator = () => screen.getByRole('group').firstElementChild;

const getFrenchButton = () => screen.getByRole('button', { name: 'Français' });
const getEnglishButton = () => screen.getByRole('button', { name: 'English' });

/** Shows the current URL and the key of its history entry, which changes with each navigation. */
const LocationDisplay = () => {
  const { pathname, search, hash, key } = useLocation();
  return (
    <output
      data-testid="location"
      data-key={key}
    >{`${pathname}${search}${hash}`}</output>
  );
};

const getLocation = () => screen.getByTestId('location');

/** Renders the toggle at a URL, with the texts following its language as in the app. */
const renderAt = (path = '/') =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <UrlLanguage />
      <LangToggle />
      <LocationDisplay />
    </MemoryRouter>,
  );

describe('LangToggle', () => {
  afterEach(async () => {
    vi.restoreAllMocks();
    localStorage.clear();
    await act(() => i18n.changeLanguage('fr'));
  });

  it('renders FR and EN buttons without any props', () => {
    renderAt();
    expect(screen.getByText('FR')).toBeInTheDocument();
    expect(screen.getByText('EN')).toBeInTheDocument();
  });

  it('goes to the same page in English, then back in French, keeping the query and fragment', async () => {
    renderAt('/projects?tri=date#perso');

    await userEvent.click(getEnglishButton());
    expect(getLocation()).toHaveTextContent('/en/projects?tri=date#perso');
    expect(i18n.language).toBe('en');

    await userEvent.click(getFrenchButton());
    expect(getLocation()).toHaveTextContent('/projects?tri=date#perso');
    expect(i18n.language).toBe('fr');
  });

  it('goes from the home page to the English home page, then back to the root', async () => {
    renderAt('/');

    await userEvent.click(getEnglishButton());
    expect(getLocation()).toHaveTextContent(/^\/en\/$/);

    await userEvent.click(getFrenchButton());
    expect(getLocation()).toHaveTextContent(/^\/$/);
  });

  it('keeps an unknown path in the other language, for its not found page', async () => {
    renderAt('/en/page-inconnue');

    await userEvent.click(getFrenchButton());

    expect(getLocation()).toHaveTextContent('/page-inconnue');
  });

  it('stays on the page when its language is chosen again', async () => {
    renderAt('/en/projects');
    const key = getLocation().dataset.key;

    await userEvent.click(getEnglishButton());

    expect(getLocation()).toHaveTextContent('/en/projects');
    expect(getLocation().dataset.key).toBe(key);
  });

  it('remembers the chosen language for the root URL of the next visit', async () => {
    renderAt('/projects');
    expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBeNull();

    await userEvent.click(getEnglishButton());
    expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('en');

    await userEvent.click(getFrenchButton());
    expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('fr');
  });

  it('still switches the language when the browser blocks the storage', async () => {
    vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => {
      throw new DOMException('The operation is insecure.', 'SecurityError');
    });
    renderAt('/projects');

    await userEvent.click(getEnglishButton());

    expect(getLocation()).toHaveTextContent('/en/projects');
    expect(i18n.language).toBe('en');
    expect(getEnglishButton()).toHaveAttribute('aria-pressed', 'true');
  });

  it('slides the indicator under the language of the URL', async () => {
    renderAt('/projects');
    expect(getComputedStyle(getIndicator()).transform).toContain('calc(0 *');

    await userEvent.click(getEnglishButton());

    expect(getComputedStyle(getIndicator()).transform).toContain('calc(1 *');
  });

  it('starts with the indicator under English at an English URL', () => {
    renderAt('/en/experiences');

    expect(getComputedStyle(getIndicator()).transform).toContain('calc(1 *');
  });

  it('stays in the page flow below the tablet breakpoint, so it covers no content', () => {
    // jsdom applies no media query, so these are the narrow-screen styles
    renderAt();

    const wrapperStyle = getComputedStyle(screen.getByRole('group'));
    expect(wrapperStyle.position).toBe('relative');
    expect(wrapperStyle.flexDirection).toBe('row');
  });

  it('gives each button a target as large as a finger, from the middle of their gap outward, in a row then in a column', () => {
    renderAt();
    const fingerTarget = theme.sizes['finger-target'];
    const halfGapOutside = `calc(${theme.space[4]} / -2)`;
    const centeringOffset = `calc((100% - ${fingerTarget}) / 2)`;
    const tabletMedia = `(min-width: ${theme.screens.tablet})`;
    const targetInset = ({ pseudo, media = '' }) =>
      declaredStyle({ element: getFrenchButton(), property: 'inset', pseudo, media });
    const inset = value => serializeCssValue({ property: 'inset', value });

    expect(
      declaredStyle({ element: getFrenchButton(), property: 'width', pseudo: '::after' }),
    ).toBe(fingerTarget);
    expect(
      declaredStyle({ element: getFrenchButton(), property: 'height', pseudo: '::after' }),
    ).toBe(fingerTarget);
    expect(targetInset({ pseudo: ':first-of-type::after' })).toBe(
      inset(`${centeringOffset} ${halfGapOutside} auto auto`),
    );
    expect(targetInset({ pseudo: ':last-of-type::after' })).toBe(
      inset(`${centeringOffset} auto auto ${halfGapOutside}`),
    );
    expect(targetInset({ pseudo: ':first-of-type::after', media: tabletMedia })).toBe(
      inset(`auto auto ${halfGapOutside} ${centeringOffset}`),
    );
    expect(targetInset({ pseudo: ':last-of-type::after', media: tabletMedia })).toBe(
      inset(`${halfGapOutside} auto auto ${centeringOffset}`),
    );
    expect(getComputedStyle(screen.getByRole('group')).gap).toBe(theme.space[4]);
  });

  it('keeps the inactive language at 4.5:1 on the dark background, hovered or not', () => {
    renderAt();
    const inactiveColor = ({ pseudo = '', media = '' } = {}) =>
      declaredStyle({ element: getEnglishButton(), property: 'color', pseudo, media });
    const hoverColor = inactiveColor({ pseudo: ':hover', media: HOVER_POINTER_QUERY });

    // A touch screen would keep the hover color of the button tapped last
    expect(inactiveColor({ pseudo: ':hover' })).toBe('');
    expect(hoverColor).not.toBe('');
    for (const color of [inactiveColor(), hoverColor]) {
      expect(
        getContrastRatio({ foreground: color, background: theme.colors.background }),
      ).toBeGreaterThanOrEqual(MIN_TEXT_CONTRAST_RATIO);
    }
  });

  it('marks the active language with a border of the color of a selection in forced colors mode', () => {
    renderAt();

    // Forced colors mode removes the fill and the glow of the indicator
    expect(
      declaredStyle({ element: getIndicator(), property: 'border', media: FORCED_COLORS_MEDIA }),
    ).toBe(`${theme.borderWidths.thick} solid highlight`);
  });

  describe('accessibility', () => {
    it('names each button after its language, in that language', () => {
      renderAt();

      expect(getFrenchButton()).toHaveAttribute('lang', 'fr');
      expect(getEnglishButton()).toHaveAttribute('lang', 'en');
    });

    it('makes both buttons plain buttons, so they never submit a form', () => {
      renderAt();

      expect(getFrenchButton()).toHaveAttribute('type', 'button');
      expect(getEnglishButton()).toHaveAttribute('type', 'button');
    });

    it('labels the group in French and presses the French button at a French URL', () => {
      renderAt('/projects');

      expect(screen.getByRole('group', { name: 'Langue' })).toContainElement(getFrenchButton());
      expect(getFrenchButton()).toHaveAttribute('aria-pressed', 'true');
      expect(getEnglishButton()).toHaveAttribute('aria-pressed', 'false');
    });

    it('labels the group in English and presses the English button at an English URL', () => {
      renderAt('/en/projects');

      expect(screen.getByRole('group', { name: 'Language' })).toContainElement(getEnglishButton());
      expect(getFrenchButton()).toHaveAttribute('aria-pressed', 'false');
      expect(getEnglishButton()).toHaveAttribute('aria-pressed', 'true');
    });

    it('keeps the button names when the language changes', async () => {
      renderAt();

      await userEvent.click(getEnglishButton());

      expect(getFrenchButton()).toBeInTheDocument();
      expect(getEnglishButton()).toBeInTheDocument();
    });
  });
});
