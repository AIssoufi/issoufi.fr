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
      'Profil',
      'Compétences',
      'Expériences',
      'Projets',
      'Formation',
    ]);
  });

  it('writes the summary of the profile, then its proof, each link after its label', () => {
    const content = {
      ...FRENCH_CV,
      labelSeparator: ' : ',
      profile: {
        title: 'Profil',
        summary: 'Développeur front-end',
        proof: 'Mon site est développé par des agents',
        proofLinks: [
          {
            label: 'Code',
            text: 'github.com/AIssoufi/site',
            url: 'https://github.com/AIssoufi/site',
          },
        ],
      },
    };
    const document = renderDocument(content);
    const [profile] = document.querySelectorAll('.section');

    expect(getTexts({ document: profile, selector: 'p' })).toEqual([
      'Développeur front-end',
      'Mon site est développé par des agents',
    ]);
    expect(profile.querySelector('.labeled-links').innerHTML).toBe(
      '<li><strong>Code</strong> : <a href="https://github.com/AIssoufi/site">github.com/AIssoufi/site</a></li>',
    );
  });

  it('leaves out the proof of the profile when it is empty', () => {
    const content = { ...FRENCH_CV, profile: { ...FRENCH_CV.profile, proof: '' } };
    const [profile] = renderDocument(content).querySelectorAll('.section');

    expect(getTexts({ document: profile, selector: 'p' })).toEqual([FRENCH_CV.profile.summary]);
  });

  it('writes each category of skills on its line, in bold, its skills after it', () => {
    const content = {
      ...FRENCH_CV,
      labelSeparator: ' : ',
      skills: {
        title: 'Compétences',
        items: [
          { category: 'Front-end', items: ['React.js', 'TypeScript'] },
          { category: 'Qualité', items: ['Tests unitaires'] },
        ],
      },
    };
    const document = renderDocument(content);

    expect(getTexts({ document, selector: '.skills li' })).toEqual([
      'Front-end : React.js, TypeScript',
      'Qualité : Tests unitaires',
    ]);
    expect(getTexts({ document, selector: '.skills strong' })).toEqual(['Front-end', 'Qualité']);
  });

  it('writes a category of the real French CV with its no-break space before the colon', () => {
    const document = renderDocument(FRENCH_CV);

    expect(document.querySelector('.skills li').textContent).toMatch(
      /^Front-end\u00a0: React\.js, TypeScript, /,
    );
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

    const toItem = ({ text, url }) => ({ text, url });

    expect(readItems(contactList)).toEqual(FRENCH_CV.contacts.map(toItem));
    expect(readItems(profileList)).toEqual(FRENCH_CV.profiles.map(toItem));
  });

  it('writes the icon of each contact detail before its text, hidden from screen readers', () => {
    const icons = {
      email: '<svg class="icon" aria-hidden="true"><path d="M1 1"/></svg>',
      location: '<svg class="icon" aria-hidden="true"><circle r="1"/></svg>',
    };
    const content = {
      ...FRENCH_CV,
      contacts: [
        { text: 'adam@example.com', url: 'mailto:adam@example.com', icon: 'email' },
        { text: 'Paris', url: '', icon: 'location' },
      ],
    };
    const html = renderCvHtml({ content, styles, fontFaces: '', icons });

    expect(html).toContain(
      `<ul class="contacts"><li>${icons.email}<a href="mailto:adam@example.com">adam@example.com</a></li><li>${icons.location}Paris</li></ul>`,
    );
  });

  it('writes a contact detail without icon when the icons lack its own', () => {
    const document = renderDocument(FRENCH_CV);

    expect(document.querySelectorAll('.contacts li')).toHaveLength(5);
    expect(document.querySelector('.contacts svg')).toBeNull();
  });

  it('writes each company, then each of its roles with its period', () => {
    const document = renderDocument(FRENCH_CV);

    expect(getTexts({ document, selector: '.company-name' })).toEqual([
      'Sewan Groupe\u00a0· CDI\u00a0· Paris\u00a0(75)',
      'Wibilong\u00a0· CDI\u00a0· Paris\u00a0(75)',
      'Supralog\u00a0· Alternance\u00a0· Antibes\u00a0(06)',
      'Beepeers\u00a0· Stage\u00a0· Valbonne\u00a0(06)',
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
      'CLARIS\u00a0: refonte du SI de certification\u00a0· 3 sprints livrés',
    );
    expect(getTexts({ document, selector: '.project .technologies' })).toContain(
      'React.js\u00a0· Redux.js\u00a0· TypeScript\u00a0· ChartJS',
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

  it('links each project of the Projects page that has a URL to its demo', () => {
    const document = renderDocument(FRENCH_CV);
    const links = [...document.querySelectorAll('.entries a')];

    expect(links.map(link => [link.textContent, link.getAttribute('href')])).toEqual([
      ['Kane Riviera Transfert', 'https://kane.issoufi.fr/'],
      ['Jeu d’échecs', 'https://chess.issoufi.fr/'],
      ['Magasin de plugins audio', 'https://pedalboards.issoufi.fr/'],
      ['Puissance 4', 'https://connect-four.issoufi.fr/'],
      ['Calculatrice', 'https://calculator.issoufi.fr/'],
    ]);
  });

  it('writes each degree with its years and its school', () => {
    const document = renderDocument(FRENCH_CV);

    expect(getTexts({ document, selector: '.degree' })).toEqual([
      'Master 2 MIAGE, spécialité MBDS',
      'DUT Informatique',
      'Classe préparatoire',
    ]);
    expect(getTexts({ document, selector: '.degree-entry .details' })[0]).toBe(
      '2016 – 2019\u00a0· Université de Nice',
    );
  });

  it('escapes every text, so that the data can never break the markup', () => {
    const content = {
      ...FRENCH_CV,
      name: '<script>alert(1)</script>',
      contacts: [{ text: 'R&D', url: 'https://example.com/?a="b"' }],
      labelSeparator: ' <: ',
      skills: { title: 'Compétences', items: [{ category: 'R&D', items: ['<b>', 'C&C'] }] },
    };
    const html = renderCvHtml({ content, styles, fontFaces: '' });

    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(html).toContain('<a href="https://example.com/?a=&quot;b&quot;">R&amp;D</a>');
    expect(html).toContain('<li><strong>R&amp;D</strong> &lt;: &lt;b&gt;, C&amp;C</li>');
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

  it('writes each project of a group in its entry, one without URL by its name alone', () => {
    const content = {
      ...FRENCH_CV,
      projects: {
        title: 'Projets',
        items: [
          {
            title: 'Projets personnels',
            items: [
              { name: 'Calculatrice', url: '' },
              { name: 'Jeu d’échecs', url: 'https://chess.issoufi.fr/' },
            ],
          },
        ],
      },
    };
    const document = renderDocument(content);

    expect(document.querySelector('.entries').innerHTML).toBe(
      '<span class="entry">Calculatrice</span>&nbsp;· <span class="entry"><a href="https://chess.issoufi.fr/">Jeu d’échecs</a></span>',
    );
  });
});
