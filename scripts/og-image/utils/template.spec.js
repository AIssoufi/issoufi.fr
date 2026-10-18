import { en } from '../../../src/i18n/en';
import { fr } from '../../../src/i18n/fr';
import { theme } from '../../../src/theme/theme';
import { SITE_URL } from '../../../src/utils/pages';
import { listFontsInUse } from '../../utils/fonts.mjs';
import { getHomeTexts } from '../../utils/home-texts.mjs';
import { hasUnresolvedValue } from '../../utils/html.mjs';
import { FONTS_IN_USE } from '../constants.mjs';
import { renderOgImageHtml, renderOgImageStyles } from './template.mjs';

const texts = getHomeTexts({ translations: fr, siteUrl: SITE_URL });
const styles = renderOgImageStyles(theme);
const params = {
  language: 'fr',
  texts,
  styles,
  backgroundImageUrl: 'data:image/webp;base64,UklGR',
  fontStylesheetUrl: 'https://fonts.googleapis.com/css2?family=Montserrat&display=swap',
  particlesSvg: '<svg id="particles"></svg>',
};

/** Parses the rendered page, to query it like a browser does. */
const renderDocument = (overrides = {}) =>
  new DOMParser().parseFromString(renderOgImageHtml({ ...params, ...overrides }), 'text/html');

describe('renderOgImageStyles', () => {
  it('sizes the page to the image', () => {
    expect(styles).toContain('width: 1200px;');
    expect(styles).toContain('height: 630px;');
  });

  it('uses the fonts, colors, line heights, radius and glow of the theme', () => {
    expect(styles).toContain(`font-family: ${theme.fonts.body};`);
    expect(styles).toContain(`font-family: ${theme.fonts.display};`);
    expect(styles).toContain(`background-color: ${theme.colors['shade-a80']};`);
    expect(styles).toContain(`color: ${theme.colors['accent-soft']};`);
    expect(styles).toContain(`color: ${theme.colors['foreground-secondary']};`);
    expect(styles).toContain(`background-color: ${theme.colors.accent};`);
    expect(styles).toContain(`line-height: ${theme.lineHeights[120]};`);
    expect(styles).toContain(`border-radius: ${theme.radii.pill};`);
    expect(styles).toContain(`box-shadow: ${theme.shadows.accentGlowStrong};`);
  });

  it('resolves every token of the theme of the site', () => {
    expect(hasUnresolvedValue(styles)).toBe(false);
  });

  it.each([
    ['a renamed shadow', { shadows: {} }],
    ['a missing color', { colors: { ...theme.colors, 'shade-a80': undefined } }],
    ['missing line heights', { lineHeights: {} }],
  ])('shows %s as an unresolved value', (_, overrides) => {
    expect(hasUnresolvedValue(renderOgImageStyles({ ...theme, ...overrides }))).toBe(true);
  });

  it('only uses font weights that the font check loads', () => {
    const weights = [...styles.matchAll(/font-weight: (\d+);/g)].map(([, weight]) => weight);
    const checkedFonts = listFontsInUse({ theme, fontsInUse: FONTS_IN_USE });

    expect(weights.length).toBeGreaterThan(0);
    weights.forEach(weight => expect(checkedFonts).toContain(`${weight} 16px "Montserrat"`));
  });

  it('leaves the background photo to the page', () => {
    expect(styles).not.toContain('url(');
  });
});

describe('renderOgImageHtml', () => {
  it('starts an HTML document with the style sheet', () => {
    const html = renderOgImageHtml(params);

    expect(html).toMatch(/^<!doctype html>/);
    expect(renderDocument().querySelector('style').textContent).toBe(styles);
  });

  it('writes every text of the home page', () => {
    const page = renderDocument();

    expect(page.querySelector('.logo').textContent).toBe('AI');
    expect(page.querySelector('.name').textContent).toBe('ADAM Issoufi');
    expect(page.querySelector('h1').textContent).toBe('Développeur full-stack JavaScript');
    expect(page.querySelector('.passion').textContent).toBe('passionné par l’UX et l’UI Design');
    expect(page.querySelector('.subtitle').textContent).toBe(
      'Je vous aide à développer vos applications web',
    );
    expect(page.querySelector('.site').textContent).toBe('issoufi.fr');
  });

  it('writes the texts of the home page in English', () => {
    const page = renderDocument({
      language: 'en',
      texts: getHomeTexts({ translations: en, siteUrl: SITE_URL }),
    });

    expect(page.querySelector('.name').textContent).toBe('ADAM Issoufi');
    expect(page.querySelector('h1').textContent).toBe('Full-stack JavaScript Developer');
    expect(page.querySelector('.passion').textContent).toBe('passionate about UX and UI Design');
    expect(page.querySelector('.subtitle').textContent).toBe('I help you build web applications');
  });

  it.each(['fr', 'en'])('names the language %s of the texts', language => {
    expect(renderDocument({ language }).documentElement.lang).toBe(language);
  });

  it.each([undefined, null, 42, {}])(
    'leaves the language unknown when it is %j, not a string',
    language => {
      const html = renderOgImageHtml({ ...params, language });

      expect(html).toContain('<html lang="">');
    },
  );

  it('escapes the language, so it cannot break the page', () => {
    const page = renderDocument({ language: 'en"><script>' });

    expect(page.documentElement.lang).toBe('en"><script>');
    expect(page.querySelector('script')).toBeNull();
  });

  it('puts the design skills in bold', () => {
    const skills = [...renderDocument().querySelectorAll('.passion strong')];

    expect(skills.map(({ textContent }) => textContent)).toEqual(['UX', 'UI']);
  });

  it('freezes the shimmer of each word of the job title where the first image had it', () => {
    const words = [...renderDocument().querySelectorAll('h1 .word')];

    expect(words.map(({ textContent }) => textContent)).toEqual([
      'Développeur',
      'full-stack',
      'JavaScript',
    ]);
    expect(words.map(word => word.style.backgroundPositionX)).toEqual(['-25%', '52%', '20%']);
  });

  it('keeps the shimmer away from the words after the third one', () => {
    const page = renderDocument({ texts: { ...texts, jobTitle: 'One Two Three Four Five' } });
    const positions = [...page.querySelectorAll('h1 .word')].map(
      word => word.style.backgroundPositionX,
    );

    expect(positions.slice(3)).toEqual(['-25%', '-25%']);
  });

  it('loads the font style sheet and shows the background photo', () => {
    const page = renderDocument();

    expect(page.querySelector('link[rel="stylesheet"]').getAttribute('href')).toBe(
      params.fontStylesheetUrl,
    );
    expect(page.body.style.backgroundImage).toBe(`url("${params.backgroundImageUrl}")`);
  });

  it('draws the particles above the darkened photo and under the texts', () => {
    const layers = [...renderDocument().body.children].map(element => element.className);

    expect(layers).toEqual(['layer shade', 'layer', 'logo', 'layer']);
    expect(renderDocument().querySelector('#particles')).not.toBeNull();
  });

  it('escapes the texts, so a translation cannot break the page', () => {
    const page = renderDocument({
      texts: { ...texts, subtitle: '<img src=x onerror=alert(1)> & co', name: 'A "quoted" name' },
    });

    expect(page.querySelector('.subtitle').textContent).toBe('<img src=x onerror=alert(1)> & co');
    expect(page.querySelector('.subtitle img')).toBeNull();
    expect(page.querySelector('.name').textContent).toBe('A "quoted" name');
  });

  it('escapes the URL of the background photo', () => {
    const page = renderDocument({ backgroundImageUrl: 'data:image/webp;base64,A\')"><script>' });

    expect(page.querySelector('script')).toBeNull();
  });

  it('escapes the URL of the font style sheet', () => {
    const fontStylesheetUrl = 'https://fonts.googleapis.com/css2?family=A&display=swap"><script>';
    const page = renderDocument({ fontStylesheetUrl });

    expect(page.querySelector('link').getAttribute('href')).toBe(fontStylesheetUrl);
    expect(page.querySelector('script')).toBeNull();
  });
});
