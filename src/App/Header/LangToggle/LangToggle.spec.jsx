import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@xstyled/styled-components';
import { renderToString } from 'react-dom/server';
import { MemoryRouter, useLocation } from 'react-router';

import { renderHydrated } from '../../../hydrationTestUtils.tsx';

import i18n from '../../../i18n/index.ts';
import { LANGUAGE_STORAGE_KEY } from '../../../i18n/constants.ts';
import {
  declaredStyle,
  getContrastRatio,
  mediaDeclaringStyle,
  MIN_TEXT_CONTRAST_RATIO,
  serializeCssValue,
} from '../../../styleTestUtils.js';
import { theme } from '../../../theme/index.ts';
import {
  FORCED_COLORS_QUERY,
  FULL_MOTION_QUERY,
  HOVER_POINTER_QUERY,
} from '../../../theme/constants.ts';
import UrlLanguage from '../../UrlLanguage/index.ts';
import LangToggle from './LangToggle.tsx';

/** The indicator is the first child of the toggle, before the language links. */
const getIndicator = () => screen.getByRole('group').firstElementChild;

const getFrenchLink = () => screen.getByRole('link', { name: 'FR – Français' });
const getEnglishLink = () => screen.getByRole('link', { name: 'EN – English' });

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

/** Renders the toggle at a URL as the build renders it, and returns the `href` of its links. */
const getBuildHrefs = path => {
  const page = document.createElement('div');
  page.innerHTML = renderToString(
    <ThemeProvider theme={theme}>
      <MemoryRouter initialEntries={[path]}>
        <LangToggle />
      </MemoryRouter>
    </ThemeProvider>,
  );
  return [...page.querySelectorAll('a')].map(link => link.getAttribute('href'));
};

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

  it('renders FR and EN links without any props', () => {
    renderAt();
    expect(screen.getByText('FR')).toBeInTheDocument();
    expect(screen.getByText('EN')).toBeInTheDocument();
  });

  it.each([
    ['/projects', '/projects', '/en/projects'],
    ['/', '/', '/en/'],
    ['/en/experiences', '/experiences', '/en/experiences'],
    ['/en/', '/', '/en/'],
    ['/en/page-inconnue', '/page-inconnue', '/en/page-inconnue'],
  ])(
    'links the page %s in French to %s and in English to %s, which works without JavaScript',
    (path, frenchHref, englishHref) => {
      renderAt(path);

      expect(getFrenchLink()).toHaveAttribute('href', frenchHref);
      expect(getEnglishLink()).toHaveAttribute('href', englishHref);
    },
  );

  it('keeps the query and the fragment of the URL in the links', () => {
    renderAt('/projects?tri=date#perso');

    expect(getFrenchLink()).toHaveAttribute('href', '/projects?tri=date#perso');
    expect(getEnglishLink()).toHaveAttribute('href', '/en/projects?tri=date#perso');
  });

  it('adds the query and the fragment, which the build cannot know, once the page is hydrated', () => {
    // React logs a link that differs from the page of the build, which fails the test
    renderHydrated(
      <MemoryRouter initialEntries={['/projects?tri=date#perso']}>
        <LangToggle />
      </MemoryRouter>,
    );

    expect(getEnglishLink()).toHaveAttribute('href', '/en/projects?tri=date#perso');
  });

  it('leaves the query and the fragment out of the page of the build', () => {
    expect(getBuildHrefs('/projects?tri=date#perso')).toEqual(['/projects', '/en/projects']);
  });

  it.each([
    ['/404', '/', '/en/'],
    ['/en/404', '/', '/en/'],
    ['/en/page-inconnue', '/', '/en/'],
    ['/en/projects/', '/projects', '/en/projects'],
    ['', '/', '/en/'],
  ])(
    'links the page that the build renders at %j in French to %s and in English to %s',
    (path, frenchHref, englishHref) => {
      // The not found page that the build renders answers any path of no page, which it cannot name
      expect(getBuildHrefs(path)).toEqual([frenchHref, englishHref]);
    },
  );

  it('goes to the same page in English, then back in French, keeping the query and fragment', async () => {
    renderAt('/projects?tri=date#perso');

    await userEvent.click(getEnglishLink());
    expect(getLocation()).toHaveTextContent('/en/projects?tri=date#perso');
    expect(i18n.language).toBe('en');

    await userEvent.click(getFrenchLink());
    expect(getLocation()).toHaveTextContent('/projects?tri=date#perso');
    expect(i18n.language).toBe('fr');
  });

  it('goes from the home page to the English home page, then back to the root', async () => {
    renderAt('/');

    await userEvent.click(getEnglishLink());
    expect(getLocation()).toHaveTextContent(/^\/en\/$/);

    await userEvent.click(getFrenchLink());
    expect(getLocation()).toHaveTextContent(/^\/$/);
  });

  it('keeps an unknown path in the other language, for its not found page', async () => {
    renderAt('/en/page-inconnue');

    await userEvent.click(getFrenchLink());

    expect(getLocation()).toHaveTextContent('/page-inconnue');
  });

  it('stays on the page when its language is chosen again, and remembers it', async () => {
    renderAt('/en/projects');
    const key = getLocation().dataset.key;

    await userEvent.click(getEnglishLink());

    expect(getLocation()).toHaveTextContent('/en/projects');
    expect(getLocation().dataset.key).toBe(key);
    expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('en');
  });

  it('leaves a click with a modifier key on the link of its language to the browser', () => {
    renderAt('/en/projects');

    // The browser opens the link in a new tab: the click is not cancelled
    const isNotCancelled = fireEvent.click(getEnglishLink(), { metaKey: true });

    expect(isNotCancelled).toBe(true);
    expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('en');
  });

  it('remembers the chosen language for the root URL of the next visit', async () => {
    renderAt('/projects');
    expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBeNull();

    await userEvent.click(getEnglishLink());
    expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('en');

    await userEvent.click(getFrenchLink());
    expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('fr');
  });

  it('still switches the language when the browser blocks the storage', async () => {
    vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => {
      throw new DOMException('The operation is insecure.', 'SecurityError');
    });
    renderAt('/projects');

    await userEvent.click(getEnglishLink());

    expect(getLocation()).toHaveTextContent('/en/projects');
    expect(i18n.language).toBe('en');
    expect(getEnglishLink()).toHaveAttribute('aria-current', 'true');
  });

  it('slides the indicator under the language of the URL', async () => {
    renderAt('/projects');
    expect(getComputedStyle(getIndicator()).transform).toContain('calc(0 *');

    await userEvent.click(getEnglishLink());

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

  it('gives each link a target as large as a finger, from the middle of their gap outward, in a row then in a column', () => {
    renderAt();
    const fingerTarget = theme.sizes['finger-target'];
    const halfGapOutside = `calc(${theme.space[4]} / -2)`;
    const centeringOffset = `calc((100% - ${fingerTarget}) / 2)`;
    const tabletMedia = `(min-width: ${theme.screens.tablet})`;
    const targetInset = ({ pseudo, media = '' }) =>
      declaredStyle({ element: getFrenchLink(), property: 'inset', pseudo, media });
    const inset = value => serializeCssValue({ property: 'inset', value });

    expect(declaredStyle({ element: getFrenchLink(), property: 'width', pseudo: '::after' })).toBe(
      fingerTarget,
    );
    expect(declaredStyle({ element: getFrenchLink(), property: 'height', pseudo: '::after' })).toBe(
      fingerTarget,
    );
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
      declaredStyle({ element: getEnglishLink(), property: 'color', pseudo, media });
    const hoverColor = inactiveColor({ pseudo: ':hover', media: HOVER_POINTER_QUERY });

    // A touch screen would keep the hover color of the link tapped last
    expect(inactiveColor({ pseudo: ':hover' })).toBe('');
    expect(hoverColor).not.toBe('');
    for (const color of [inactiveColor(), hoverColor]) {
      expect(
        getContrastRatio({ foreground: color, background: theme.colors.background }),
      ).toBeGreaterThanOrEqual(MIN_TEXT_CONTRAST_RATIO);
    }
  });

  it('centers the code of each link in its box, as a button would', () => {
    renderAt();

    for (const link of [getFrenchLink(), getEnglishLink()]) {
      expect(getComputedStyle(link)).toMatchObject({
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      });
    }
  });

  // GlobalStyle makes the transition instant with reduced motion: the link would jump
  it('grows a link under a pointer that hovers only, without reduced motion, as the buttons of the site do', () => {
    renderAt();
    const fullMotionHoverQuery = `${HOVER_POINTER_QUERY} and ${FULL_MOTION_QUERY}`;
    const hoverStyle = ({ property, media }) =>
      declaredStyle({ element: getEnglishLink(), property, pseudo: ':hover', media });

    expect(hoverStyle({ property: 'transform', media: fullMotionHoverQuery })).toBe('scale(1.06)');
    expect(
      mediaDeclaringStyle({ element: getEnglishLink(), property: 'transform', pseudo: ':hover' }),
    ).toEqual([fullMotionHoverQuery]);
    // Its color still changes with reduced motion
    expect(hoverStyle({ property: 'color', media: HOVER_POINTER_QUERY })).not.toBe('');
  });

  it('marks the active language with a border of the color of a selection in forced colors mode', () => {
    renderAt();

    // Forced colors mode removes the fill and the glow of the indicator
    expect(
      declaredStyle({ element: getIndicator(), property: 'border', media: FORCED_COLORS_QUERY }),
    ).toBe(`${theme.borderWidths.thick} solid highlight`);
  });

  describe('accessibility', () => {
    it('pronounces each link in its language', () => {
      renderAt();

      expect(getFrenchLink()).toHaveAttribute('lang', 'fr');
      expect(getEnglishLink()).toHaveAttribute('lang', 'en');
    });

    it('starts the name of each link with its visible code, then its language for screen readers only', () => {
      renderAt();

      // An aria-label would replace the visible code, which a voice control user says, in the name
      expect(getFrenchLink()).not.toHaveAttribute('aria-label');
      expect(getEnglishLink()).not.toHaveAttribute('aria-label');
      for (const name of ['– Français', '– English']) {
        expect(screen.getByText(name)).toHaveStyle({
          position: 'absolute',
          clipPath: 'inset(50%)',
        });
      }
    });

    it('tells the language of the page that each link leads to', () => {
      renderAt();

      expect(getFrenchLink()).toHaveAttribute('hreflang', 'fr');
      expect(getEnglishLink()).toHaveAttribute('hreflang', 'en');
    });

    it('labels the group in French and marks French as the current language at a French URL', () => {
      renderAt('/projects');

      expect(screen.getByRole('group', { name: 'Langue' })).toContainElement(getFrenchLink());
      expect(getFrenchLink()).toHaveAttribute('aria-current', 'true');
      expect(getEnglishLink()).not.toHaveAttribute('aria-current');
    });

    it('labels the group in English and marks English as the current language at an English URL', () => {
      renderAt('/en/projects');

      expect(screen.getByRole('group', { name: 'Language' })).toContainElement(getEnglishLink());
      expect(getFrenchLink()).not.toHaveAttribute('aria-current');
      expect(getEnglishLink()).toHaveAttribute('aria-current', 'true');
    });

    it('keeps the link names when the language changes', async () => {
      renderAt();

      await userEvent.click(getEnglishLink());

      expect(getFrenchLink()).toBeInTheDocument();
      expect(getEnglishLink()).toBeInTheDocument();
    });
  });
});
