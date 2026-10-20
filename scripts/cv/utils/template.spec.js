import { theme } from '../../../src/theme/theme.ts';
import { CV_SOURCES } from '../testUtils.js';
import { buildCvContents } from './languages.mjs';
import { renderCvStyles } from './styles.mjs';
import { renderCvHtml } from './template.mjs';

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

describe('renderCvHtml', () => {
  it('writes the language, the title and the author of the document', () => {
    const document = renderDocument(ENGLISH_CV);

    expect(document.documentElement.lang).toBe('en');
    expect(document.title).toBe('CV - ADAM Issoufi - Full-stack JavaScript Developer');
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
      'passionné par l’UX et l’UI\u00a0Design',
    );
    expect(getTexts({ document, selector: '.tagline strong' })).toEqual(['UX', 'UI']);
  });

  it('links the contact details that have a URL, and only them, then the profiles on their line', () => {
    const document = renderDocument(FRENCH_CV);
    const [contactList, profileList] = document.querySelectorAll('.contacts');
    const readItems = list =>
      [...list.querySelectorAll('li')].map(item => ({
        text: item.textContent,
        url: item.querySelector('a')?.getAttribute('href') ?? '',
      }));

    expect(readItems(contactList)).toEqual(FRENCH_CV.contacts);
    expect(readItems(profileList)).toEqual(FRENCH_CV.profiles);
  });

  it('writes each company, then each of its roles with its period', () => {
    const document = renderDocument(FRENCH_CV);

    expect(getTexts({ document, selector: '.company-name' })).toEqual([
      'Sewan Groupe · CDI · Paris\u00a0(75)',
      'Wibilong · CDI · Paris\u00a0(75)',
      'Supralog · Alternance · Antibes\u00a0(06)',
      'Beepeers · Stage · Valbonne\u00a0(06)',
    ]);
    expect(getTexts({ document, selector: '.period' })[0]).toBe('oct. 2025 – Aujourd’hui');
    expect(document.querySelectorAll('.role')).toHaveLength(7);
  });

  it('writes the strong pieces of a paragraph in bold', () => {
    const document = renderDocument(FRENCH_CV);

    expect(getTexts({ document, selector: '.role .text strong' })).toContain('Sophia GO');
  });

  it('writes the status of a project after its title, and its technologies under it', () => {
    const document = renderDocument(FRENCH_CV);
    const [project] = document.querySelectorAll('.project');

    expect(project.querySelector('.project-title').textContent).toBe(
      'Refonte de l’outillage, sans rupture pour les équipes consommatrices',
    );
    expect(project.querySelector('.technologies')).toBeNull();
    expect(getTexts({ document, selector: '.project-title' })).toContain(
      'CLARIS\u00a0: refonte du SI de certification · 3 sprints livrés',
    );
    expect(getTexts({ document, selector: '.project .technologies' })).toContain(
      'React.js · Redux.js · TypeScript · ChartJS',
    );
  });

  it.each([
    ['French', FRENCH_CV],
    ['English', ENGLISH_CV],
  ])(
    'gives the job titles that every language writes in English their language in the %s CV',
    (_language, content) => {
      const document = renderDocument(content);
      const titles = [...document.querySelectorAll('.role-title')];
      const englishTitles = titles
        .filter(title => title.lang === 'en')
        .map(({ textContent }) => textContent);

      expect(englishTitles).toEqual([
        'Full-stack JavaScript Engineer (React.js, Redux.js, Node.js and AWS)',
      ]);
      expect(titles.filter(title => title.hasAttribute('lang'))).toHaveLength(1);
    },
  );

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
      titleLanguage: '',
      start: '',
      end: '',
      intro: [],
      bullets: [],
      projects: [],
      technologies: [],
    };
    const content = {
      ...FRENCH_CV,
      passion: [],
      experiences: {
        title: 'Expériences',
        items: [{ company: 'Acme', details: '', roles: [role] }],
      },
    };
    const document = renderDocument(content);

    expect(document.querySelector('.tagline')).toBeNull();
    expect(document.querySelector('.company-name').textContent).toBe('Acme');
    expect(document.querySelector('.role-title').hasAttribute('lang')).toBe(false);
    expect(document.querySelector('.role').querySelectorAll('p, ul')).toHaveLength(0);
  });

  it('writes the projects of a group on one line, a project without URL by its name alone', () => {
    const content = {
      ...FRENCH_CV,
      projects: {
        title: 'Projets',
        items: [
          {
            title: 'Projets personnels',
            items: [
              { name: 'Calculatrice', url: '' },
              { name: 'Jeu d’échecs', url: 'https://aissoufi.github.io/chess/' },
            ],
          },
        ],
      },
    };
    const document = renderDocument(content);

    expect(document.querySelector('.entries').innerHTML).toBe(
      'Calculatrice · <a href="https://aissoufi.github.io/chess/">Jeu d’échecs</a>',
    );
  });
});
