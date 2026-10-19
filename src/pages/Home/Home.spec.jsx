import { act, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';

import i18n from '../../i18n';
import { theme } from '../../theme';
import { HOVER_POINTER_QUERY, REDUCED_MOTION_QUERY } from '../../theme/constants';
import { declaredStyle, serializeCssValue } from '../../styleTestUtils';
import { getPage } from '../../utils/pages';
import { readBackgroundImages } from '../testUtils';
import { Home } from './Home';

/** Media query of the short screens, such as a phone held sideways. */
const SHORT_SCREEN_MEDIA_QUERY = `(max-height: ${theme.screenHeights.short})`;

/** Media query of the wide screens, from the `wide` breakpoint. */
const WIDE_MEDIA_QUERY = `(min-width: ${theme.screens.wide})`;

const renderHome = (path = '/') =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Home />
    </MemoryRouter>,
  );

describe('Home', () => {
  afterEach(async () => {
    await act(() => i18n.changeLanguage('fr'));
  });

  it('renders the job title and the subtitle', () => {
    renderHome();

    expect(screen.getByText('Développeur')).toBeInTheDocument();
    expect(screen.getByText('JavaScript')).toBeInTheDocument();
    expect(screen.getByText('Je vous aide à développer vos applications web')).toBeInTheDocument();
  });

  it('spells the second line of the title right, with UX and UI as animated words', () => {
    renderHome();

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'passionné par l’UX et l’UI Design',
    );
    expect(screen.getByText('UX')).toBeInTheDocument();
    expect(screen.getByText('UI')).toBeInTheDocument();
  });

  it.each([
    ['French', 'fr', 'l’UX', 'l’UI Design'],
    ['English', 'en', 'UX', 'UI Design'],
  ])(
    'holds the words that belong to UX and UI on their line, in %s',
    async (_language, language, uxWords, uiWords) => {
      renderHome();
      await act(() => i18n.changeLanguage(language));
      // The text of the page, its no-break spaces as plain ones
      const readWords = element => element.textContent.replace(/\s+/gu, ' ');
      const uxGroup = screen.getByText('UX').parentElement;
      const uiGroup = screen.getByText('UI').parentElement;

      expect(readWords(uxGroup)).toBe(uxWords);
      expect(readWords(uiGroup)).toBe(uiWords);
      for (const group of [uxGroup, uiGroup]) {
        expect(declaredStyle({ element: group, property: 'white-space' })).toBe('nowrap');
      }
    },
  );

  it('balances the lines of the passion and the subtitle, but not those of the job title', () => {
    renderHome();
    const title = screen.getByRole('heading', { level: 1 });
    const [jobTitleLine, passionLine] = title.children;
    const subtitle = screen.getByText('Je vous aide à développer vos applications web');
    const textWrap = element => declaredStyle({ element, property: 'text-wrap' });

    expect(textWrap(jobTitleLine)).toBe('wrap');
    // The passion keeps the balance of every heading (GlobalStyle)
    expect(textWrap(passionLine)).toBe('');
    expect(textWrap(subtitle)).toBe('balance');
    for (const line of [jobTitleLine, passionLine]) {
      expect(getComputedStyle(line).display).toBe('block');
    }
  });

  it('has a single main landmark and a single level 1 heading', () => {
    renderHome();

    expect(screen.getAllByRole('main')).toHaveLength(1);
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  });

  it('links to the projects and experiences pages', () => {
    renderHome();

    expect(screen.getByRole('link', { name: 'Voir mes projets' })).toHaveAttribute(
      'href',
      '/projects',
    );
    expect(screen.getByRole('link', { name: 'Expériences professionnelles' })).toHaveAttribute(
      'href',
      '/experiences',
    );
  });

  it('links to the English pages on the English home page', () => {
    renderHome('/en/');
    const [projectsLink, experiencesLink] = screen.getAllByRole('link');

    expect(projectsLink).toHaveAttribute('href', '/en/projects');
    expect(experiencesLink).toHaveAttribute('href', '/en/experiences');
  });

  it('sizes the hero with the screen, and tightens it on a short one', () => {
    renderHome();
    const title = screen.getByRole('heading', { level: 1 });
    const intro = title.parentElement;
    const subtitle = screen.getByText('Je vous aide à développer vos applications web');
    const buttons = screen.getByRole('link', { name: 'Voir mes projets' }).parentElement
      .parentElement;
    const fontSize = element => declaredStyle({ element, property: 'font-size' });
    const shortScreenStyle = ({ element, property }) =>
      declaredStyle({ element, property, media: SHORT_SCREEN_MEDIA_QUERY });

    expect(fontSize(screen.getByText('UX'))).toBe(
      serializeCssValue({ property: 'font-size', value: theme.fontSizes['hero-title'] }),
    );
    expect(fontSize(title)).toBe(
      serializeCssValue({ property: 'font-size', value: theme.fontSizes['hero-text'] }),
    );
    expect(fontSize(subtitle)).toBe(
      serializeCssValue({ property: 'font-size', value: theme.fontSizes['hero-subtitle'] }),
    );
    // The largest width of the intro is in ems of the title words
    expect(fontSize(intro)).toBe(fontSize(screen.getByText('UX')));
    expect(declaredStyle({ element: intro, property: 'max-width' })).toBe(
      serializeCssValue({ property: 'max-width', value: theme.sizes['hero-intro'] }),
    );
    expect(declaredStyle({ element: buttons, property: 'padding-top' })).toBe(
      serializeCssValue({ property: 'padding-top', value: theme.space['hero-actions'] }),
    );
    expect(shortScreenStyle({ element: title, property: 'margin-bottom' })).toBe(theme.space[4]);
    expect(shortScreenStyle({ element: buttons, property: 'gap' })).toBe(theme.space[8]);
  });

  it('enlarges the labels of its buttons from the wide breakpoint, and leaves the hero fluid', () => {
    renderHome();
    const wideFontSize = element =>
      declaredStyle({ element, property: 'font-size', media: WIDE_MEDIA_QUERY });
    const buttons = screen.getAllByRole('link');

    expect(buttons).toHaveLength(2);
    buttons.forEach(button => {
      expect(declaredStyle({ element: button, property: 'font-size' })).toBe(theme.fontSizes[14]);
      expect(wideFontSize(button)).toBe(theme.fontSizes[16]);
    });
    // The title and the subtitle already grow with the screen
    expect(wideFontSize(screen.getByRole('heading', { level: 1 }))).toBe('');
    expect(wideFontSize(screen.getByText('UX'))).toBe('');
    expect(wideFontSize(screen.getByText('Je vous aide à développer vos applications web'))).toBe(
      '',
    );
  });

  it('fits the buttons to narrow screens instead of widening the page', () => {
    // jsdom applies no media query, so these are the mobile styles
    renderHome();
    const links = screen.getAllByRole('link');

    expect(links).toHaveLength(2);
    links.forEach(link => {
      const style = getComputedStyle(link);
      expect(style.width).not.toBe('max-content');
      expect(style.minWidth).not.toBe('240px');
      expect(style.flexGrow).toBe('1');
      expect(style.padding).toBe('13px 20px');
      expect(style.textAlign).toBe('center');
    });
  });

  it('inverts the colors of the secondary button under a pointer that hovers, not those of the main one', () => {
    renderHome();
    const hoverStyle = ({ name, property, media = HOVER_POINTER_QUERY }) =>
      declaredStyle({
        element: screen.getByRole('link', { name }),
        property,
        pseudo: ':hover',
        media,
      });
    const secondaryHoverStyle = property =>
      hoverStyle({ name: 'Expériences professionnelles', property });
    const color = name => serializeCssValue({ property: 'color', value: theme.colors[name] });

    expect(secondaryHoverStyle('background-color')).toBe(color('foreground'));
    expect(secondaryHoverStyle('color')).toBe(color('background'));
    expect(secondaryHoverStyle('border-color')).toBe(color('foreground'));
    expect(hoverStyle({ name: 'Voir mes projets', property: 'background-color' })).toBe('');
    expect(hoverStyle({ name: 'Voir mes projets', property: 'color' })).toBe(color('foreground'));
    // A touch screen would keep the hover colors of the button tapped last
    expect(
      hoverStyle({ name: 'Expériences professionnelles', property: 'background-color', media: '' }),
    ).toBe('');
  });

  it('hides the cursor glow with reduced motion, and nothing else, since it follows no pointer', () => {
    const { container } = renderHome();

    const hiddenWithReducedMotion = [...container.querySelectorAll('*')].filter(
      element =>
        declaredStyle({ element, property: 'display', media: REDUCED_MOTION_QUERY }) === 'none',
    );

    expect(hiddenWithReducedMotion).toHaveLength(1);
    const glowStyle = getComputedStyle(hiddenWithReducedMotion[0]);
    expect(glowStyle.position).toBe('fixed');
    expect(glowStyle.pointerEvents).toBe('none');
    expect(glowStyle.display).not.toBe('none');
  });

  it('shows the background photo of its entry in PAGES, over its placeholder', () => {
    const { url, portraitUrl, placeholderUrl } = getPage('/').backgroundPhoto;
    renderHome();

    expect(readBackgroundImages(screen.getByRole('main'))).toEqual({
      image: `url("${url}"), url("${placeholderUrl}")`,
      portraitImage: `url("${portraitUrl}"), url("${placeholderUrl}")`,
    });
  });
});
