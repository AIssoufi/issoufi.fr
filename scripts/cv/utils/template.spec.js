import { theme } from '../../../src/theme/theme';
import { hasUnresolvedValue } from '../../utils/html.mjs';
import { CV_SOURCES } from '../testUtils';
import { buildCvContents } from './languages.mjs';
import { renderCvHtml, renderCvStyles } from './template.mjs';

const [FRENCH_CV, ENGLISH_CV] = await buildCvContents(CV_SOURCES);

const styles = renderCvStyles(theme);

/** Renders a CV and parses it, to query it as a browser would. */
const renderDocument = content =>
  new DOMParser().parseFromString(
    renderCvHtml({ content, styles, fontFaces: '@font-face {}' }),
    'text/html',
  );

/** Texts of the elements that match a selector, in order. */
const getTexts = ({ document, selector }) =>
  [...document.querySelectorAll(selector)].map(({ textContent }) => textContent);

describe('renderCvStyles', () => {
  it('resolves every design token of the theme', () => {
    expect(hasUnresolvedValue(styles)).toBe(false);
  });

  it('writes in the font and the colors of the site, on white paper', () => {
    expect(styles).toContain(`font-family: ${theme.fonts.body};`);
    expect(styles).toContain(`background-color: ${theme.colors.foreground};`);
    expect(styles).toContain(`color: ${theme.colors.accent};`);
  });

  it('prints on A4 paper', () => {
    expect(styles).toMatch(/@page \{\s*size: A4;/);
  });

  it('turns off ligatures, so that a search for "fi" finds the text in every reader', () => {
    expect(styles).toContain('font-variant-ligatures: none;');
  });

  it.each([
    ['a missing color', { colors: { ...theme.colors, 'shade-a80': undefined } }],
    ['missing line heights', { lineHeights: {} }],
    ['missing font weights', { fontWeights: {} }],
  ])('shows %s as an unresolved value', (_case, overrides) => {
    expect(hasUnresolvedValue(renderCvStyles({ ...theme, ...overrides }))).toBe(true);
  });
});

describe('renderCvHtml', () => {
  it('writes the language, the title and the author of the document', () => {
    const document = renderDocument(ENGLISH_CV);

    expect(document.documentElement.lang).toBe('en');
    expect(document.title).toBe('CV - ADAM Issoufi');
    expect(document.querySelector('meta[name="author"]').content).toBe('ADAM Issoufi');
  });

  it('loads the fonts before its own styles', () => {
    const document = renderDocument(FRENCH_CV);

    expect(getTexts({ document, selector: 'style' })).toEqual(['@font-face {}', styles]);
  });

  it('writes the name as the only level 1 heading, then a level 2 heading per section', () => {
    const document = renderDocument(FRENCH_CV);

    expect(getTexts({ document, selector: 'h1' })).toEqual(['ADAM Issoufi']);
    expect(getTexts({ document, selector: 'h2' })).toEqual([
      'Expériences',
      'Projets',
      'Compétences',
      'Formation',
    ]);
  });

  it('writes the design skills of the line under the job title in bold', () => {
    const document = renderDocument(FRENCH_CV);

    expect(document.querySelector('.tagline').textContent).toBe(
      'passionné par l’UX et l’UI Design · Je vous aide à développer vos applications web',
    );
    expect(getTexts({ document, selector: '.tagline strong' })).toEqual(['UX', 'UI']);
  });

  it('links the contact details that have a URL, and only them', () => {
    const document = renderDocument(FRENCH_CV);
    const contacts = [...document.querySelectorAll('.contacts li')];

    expect(contacts.map(({ textContent }) => textContent)).toEqual(
      FRENCH_CV.contacts.map(({ text }) => text),
    );
    expect(contacts.map(contact => contact.querySelector('a')?.getAttribute('href') ?? '')).toEqual(
      FRENCH_CV.contacts.map(({ url }) => url),
    );
  });

  it('writes each company, then each of its roles with its period', () => {
    const document = renderDocument(FRENCH_CV);

    expect(getTexts({ document, selector: '.company-name' })).toEqual([
      'Sewan Groupe · CDI · Paris (75)',
      'Wibilong · CDI · Paris (75)',
      'Supralog · Alternance · Antibes (06)',
      'Beepeers · Stage · Valbonne (06)',
    ]);
    expect(getTexts({ document, selector: '.period' })[0]).toBe('août 2021 — Aujourd’hui');
    expect(document.querySelectorAll('.role')).toHaveLength(5);
  });

  it('writes the strong pieces of a paragraph in bold', () => {
    const document = renderDocument(FRENCH_CV);

    expect(getTexts({ document, selector: '.role .text strong' })).toContain('Sophia Go');
  });

  it('writes the status of a project after its title, and its technologies under it', () => {
    const document = renderDocument(FRENCH_CV);
    const [project] = document.querySelectorAll('.project');

    expect(project.querySelector('.project-title').textContent).toBe(
      'Modernisation complète de la stack technique · En production',
    );
    expect(project.querySelector('.technologies')).toBeNull();
    expect(getTexts({ document, selector: '.project .technologies' })).toContain(
      'Node.js · GraphQL',
    );
  });

  it('links a project of the Projects page that has a URL', () => {
    const document = renderDocument(FRENCH_CV);
    const link = document.querySelector('.entries a');

    expect(link.getAttribute('href')).toBe('https://aissoufi.github.io/chess/');
    expect(link.textContent).toBe('Jeu d’échecs');
  });

  it('writes each degree with its years and its school', () => {
    const document = renderDocument(FRENCH_CV);

    expect(getTexts({ document, selector: '.degree' })).toEqual([
      'Master 2 MIAGE, spécialité MBDS',
      'DUT Informatique',
      'Classe préparatoire',
    ]);
    expect(getTexts({ document, selector: '.degree-entry .details' })[0]).toBe(
      '2016 – 2019 · Université de Nice',
    );
  });

  it('escapes every text, so that the data can never break the markup', () => {
    const content = {
      ...FRENCH_CV,
      name: '<script>alert(1)</script>',
      contacts: [{ text: 'R&D', url: 'https://example.com/?a="b"' }],
    };
    const html = renderCvHtml({ content, styles, fontFaces: '' });

    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(html).toContain('<a href="https://example.com/?a=&quot;b&quot;">R&amp;D</a>');
  });

  it('leaves out the empty parts: a role without introduction, period or technologies', () => {
    const role = {
      title: 'Développeur',
      start: '',
      end: '',
      intro: [],
      bullets: [],
      projects: [],
      technologies: [],
    };
    const content = {
      ...FRENCH_CV,
      subtitle: '',
      passion: [],
      experiences: {
        title: 'Expériences',
        items: [{ company: 'Acme', details: '', roles: [role] }],
      },
    };
    const document = renderDocument(content);

    expect(document.querySelector('.tagline')).toBeNull();
    expect(document.querySelector('.company-name').textContent).toBe('Acme');
    expect(document.querySelector('.role').querySelectorAll('p, ul')).toHaveLength(0);
  });

  it('writes a project of the Projects page without kind or technologies by its name alone', () => {
    const content = {
      ...FRENCH_CV,
      projects: {
        title: 'Projets',
        items: [
          {
            title: 'Projets personnels',
            items: [{ name: 'Calculatrice', type: '', tools: [], url: '' }],
          },
        ],
      },
    };
    const document = renderDocument(content);

    expect(document.querySelector('.entries li').innerHTML).toBe('<strong>Calculatrice</strong>');
  });
});
