import { CV_SOURCES } from '../testUtils.js';
import { buildCvContents } from './languages.mjs';
import { findMissingCvTexts, findUnwrittenKeywords, listCvLinks, listCvTexts } from './texts.mjs';

const [FRENCH_CV, ENGLISH_CV] = await buildCvContents(CV_SOURCES);

/** A small CV, with every kind of text. */
const CONTENT = {
  language: 'fr',
  title: 'CV - ADAM Issoufi - Développeur',
  subject: 'Développeur front-end',
  keywords: ['React', 'Tests unitaires'],
  name: 'ADAM Issoufi',
  jobTitle: 'Développeur',
  passion: [
    { text: 'passionné par l’', isHighlighted: false },
    { text: 'UX', isHighlighted: true },
  ],
  subtitle: 'Je vous aide',
  contacts: [
    { text: 'adam@example.com', url: 'mailto:adam@example.com' },
    { text: 'Massy (91)', url: '' },
  ],
  profiles: [{ text: 'github.com/AIssoufi', url: 'https://github.com/AIssoufi' }],
  experiences: {
    title: 'Expériences',
    items: [
      {
        company: 'Acme',
        details: '',
        roles: [
          {
            title: 'Développeur',
            start: 'juin 2021',
            end: 'Aujourd’hui',
            intro: [
              { text: 'Développement de ', isStrong: false },
              { text: 'Rocket', isStrong: true },
            ],
            bullets: ['Premier point'],
            projects: [
              {
                title: 'Fusée',
                state: '',
                description: [{ text: 'Une fusée', isStrong: false }],
                bullets: ['Décollage'],
                technologies: ['Vite'],
              },
            ],
            technologies: ['React.js'],
          },
        ],
      },
    ],
  },
  projects: {
    title: 'Projets',
    items: [
      {
        title: 'Projets freelance',
        items: [
          { name: 'Study SARL', type: 'Site web', tools: ['PHP'], url: 'https://study.fr/' },
          { name: 'Calculatrice', type: '', tools: [], url: '' },
        ],
      },
    ],
  },
  skills: { title: 'Compétences', items: ['Tests unitaires'] },
  education: {
    title: 'Formation',
    items: [{ degree: 'DUT', period: '2014 – 2016', school: 'IUT de Nice', description: '' }],
  },
};

describe('listCvTexts', () => {
  it('lists every text in the order of the page, a paragraph made of pieces as one text', () => {
    expect(listCvTexts(CONTENT)).toEqual([
      'ADAM Issoufi',
      'Développeur',
      'passionné par l’UX',
      'Je vous aide',
      'adam@example.com',
      'Massy (91)',
      'github.com/AIssoufi',
      'Expériences',
      'Acme',
      'Développeur',
      'juin 2021',
      'Aujourd’hui',
      'Développement de Rocket',
      'Premier point',
      'Fusée',
      'Une fusée',
      'Décollage',
      'Vite',
      'React.js',
      'Projets',
      'Projets freelance',
      'Study SARL',
      'Site web',
      'PHP',
      'Calculatrice',
      'Compétences',
      'Tests unitaires',
      'Formation',
      'DUT',
      '2014 – 2016',
      'IUT de Nice',
    ]);
  });

  it.each([
    ['French', FRENCH_CV],
    ['English', ENGLISH_CV],
  ])('lists every bullet point of the %s experiences', (_language, content) => {
    const texts = listCvTexts(content);
    const bullets = content.experiences.items.flatMap(({ roles }) =>
      roles.flatMap(({ bullets: roleBullets }) => roleBullets),
    );

    expect(bullets.length).toBeGreaterThan(0);
    bullets.forEach(bullet => expect(texts).toContain(bullet));
  });
});

describe('listCvLinks', () => {
  it('lists the contact details, the profiles and the projects that are links', () => {
    expect(listCvLinks(CONTENT)).toEqual([
      'mailto:adam@example.com',
      'https://github.com/AIssoufi',
      'https://study.fr/',
    ]);
  });

  it('lists the links of the real French CV', () => {
    expect(listCvLinks(FRENCH_CV)).toEqual([
      'mailto:contact@issoufi.fr',
      'tel:+33695758632',
      'https://issoufi.fr/',
      'https://www.linkedin.com/in/issoufiadam',
      'https://aissoufi.github.io/chess/',
    ]);
  });
});

describe('findMissingCvTexts', () => {
  it.each([
    ['French', FRENCH_CV],
    ['English', ENGLISH_CV],
  ])('finds none in the %s CV', (_language, content) => {
    expect(findMissingCvTexts(content)).toEqual([]);
  });

  it('finds none in a CV with every text', () => {
    expect(findMissingCvTexts(CONTENT)).toEqual([]);
  });

  it.each([
    ['empty', ''],
    ['blank', '   '],
  ])('reports a name that is %s', (_case, name) => {
    expect(findMissingCvTexts({ ...CONTENT, name })).toEqual(['name']);
  });

  it('reports the path of a missing role, project or group title', () => {
    const [company] = CONTENT.experiences.items;
    const [role] = company.roles;
    const content = {
      ...CONTENT,
      experiences: {
        ...CONTENT.experiences,
        items: [
          company,
          {
            ...company,
            company: '',
            roles: [role, { ...role, end: '', projects: [{ ...role.projects[0], title: '' }] }],
          },
        ],
      },
      projects: { ...CONTENT.projects, items: [{ title: '', items: [] }] },
    };

    expect(findMissingCvTexts(content)).toEqual([
      'experiences.items[1].company',
      'experiences.items[1].roles[1].end',
      'experiences.items[1].roles[1].projects[0].title',
      'projects.items[0].title',
    ]);
  });

  it('reports the lists that the CV cannot do without when they are empty', () => {
    const content = {
      ...CONTENT,
      contacts: [],
      profiles: [],
      experiences: { ...CONTENT.experiences, items: [] },
      skills: { ...CONTENT.skills, items: [] },
      education: { ...CONTENT.education, items: [] },
    };

    expect(findMissingCvTexts(content)).toEqual([
      'contacts',
      'profiles',
      'experiences.items',
      'skills.items',
      'education.items',
    ]);
  });

  it('reports the line about design when one of its pieces is empty', () => {
    const passion = [...CONTENT.passion, { text: '', isHighlighted: false }];

    expect(findMissingCvTexts({ ...CONTENT, passion })).toEqual(['passion']);
  });

  it('reports a missing subject and an empty list of keywords', () => {
    expect(findMissingCvTexts({ ...CONTENT, subject: ' ', keywords: [] })).toEqual([
      'subject',
      'keywords',
    ]);
  });

  it('reports the missing titles of the sections', () => {
    const content = {
      ...CONTENT,
      skills: { ...CONTENT.skills, title: '' },
      education: { ...CONTENT.education, title: '' },
    };

    expect(findMissingCvTexts(content)).toEqual(['skills.title', 'education.title']);
  });
});

describe('findUnwrittenKeywords', () => {
  it('finds none when the CV writes each keyword, whatever its case', () => {
    const keywords = ['react', 'TESTS UNITAIRES', 'Site web', 'IUT de Nice'];

    expect(findUnwrittenKeywords({ ...CONTENT, keywords })).toEqual([]);
  });

  it('finds a keyword in a text where punctuation or spaces surround it', () => {
    const content = { ...CONTENT, keywords: ['React', 'js', 'Study'] };

    expect(findUnwrittenKeywords(content)).toEqual([]);
  });

  it('reports the keywords that the CV never writes, in their order', () => {
    const keywords = ['Angular', 'React', 'Kubernetes'];

    expect(findUnwrittenKeywords({ ...CONTENT, keywords })).toEqual(['Angular', 'Kubernetes']);
  });

  it.each([
    ['the start of a word', 'Reac'],
    ['the end of a word', 'eact'],
    ['words of two texts', 'Développeur juin'],
  ])('reports a keyword that the CV writes only as %s', (_case, keyword) => {
    expect(findUnwrittenKeywords({ ...CONTENT, keywords: [keyword] })).toEqual([keyword]);
  });

  it('counts neither the title nor the subject, which the page does not write', () => {
    const content = {
      ...CONTENT,
      title: 'CV Vue',
      subject: 'Angular',
      keywords: ['Vue', 'Angular'],
    };

    expect(findUnwrittenKeywords(content)).toEqual(['Vue', 'Angular']);
  });

  it('finds none in a CV without keyword', () => {
    expect(findUnwrittenKeywords({ ...CONTENT, keywords: [] })).toEqual([]);
  });

  it.each([
    ['French', FRENCH_CV],
    ['English', ENGLISH_CV],
  ])('finds none in the %s CV', (_language, content) => {
    expect(findUnwrittenKeywords(content)).toEqual([]);
  });
});
