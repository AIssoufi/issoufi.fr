import {
  buildCvContent,
  buildExperiences,
  buildProjectItems,
  toLinkText,
  toLinkUrl,
} from './content.mjs';

/** Translations of a tiny site, by key. */
const TEXTS = {
  'cvLink.text': 'CV',
  'exp.pageTitle': 'Expériences',
  'projects.pageTitle': 'Projets',
  'projects.freelance': 'Projets freelance',
  'projects.personal': 'Projets personnels',
  'exp.acme.name': 'Acme',
  'exp.acme.contract': 'CDI',
  'exp.acme.city': 'Paris (75)',
  'exp.acme.title': 'Développeur',
  'exp.acme.start': 'juin 2021',
  'exp.acme.end': 'Aujourd’hui',
  'exp.acme.intro1': 'Développement de ',
  'exp.acme.introStrong': 'Rocket',
  'exp.acme.b1': 'Premier point',
  'exp.acme.proj1Title': 'Fusée',
  'exp.acme.proj1State': 'En production',
};

/** Translates a key of {@link TEXTS}, `''` for any other value, as `translateKey` does. */
const translate = key => TEXTS[key] ?? '';

/** A company with one role, its introduction, a bullet point, a project and technologies. */
const ACME = {
  id: 'acme',
  nameKey: 'exp.acme.name',
  contractKey: 'exp.acme.contract',
  cityKey: 'exp.acme.city',
  roles: [
    {
      titleKey: 'exp.acme.title',
      startKey: 'exp.acme.start',
      endKey: 'exp.acme.end',
      intro: [{ key: 'exp.acme.intro1' }, { key: 'exp.acme.introStrong', isStrong: true }],
      bulletKeys: ['exp.acme.b1'],
      projects: [
        {
          titleKey: 'exp.acme.proj1Title',
          stateKey: 'exp.acme.proj1State',
          technologies: ['Vite'],
        },
      ],
      technologies: ['React.js', 'TypeScript'],
    },
  ],
};

/** Texts of the home page, from `getHomeTexts`. */
const HOME_TEXTS = {
  logo: 'AI',
  name: 'ADAM Issoufi',
  jobTitle: 'Développeur full-stack JavaScript',
  passion: [
    { text: 'passionné par l’', isHighlighted: false },
    { text: 'UX', isHighlighted: true },
  ],
  subtitle: 'Je vous aide',
  site: 'issoufi.fr',
};

/** Data of the CV, as `scripts/cv/.data/cv.json` stores it. */
const CV_DATA = {
  contact: {
    email: 'adam@example.com',
    phoneUrl: 'tel:+33600000000',
    linkedInUrl: 'https://www.linkedin.com/in/adam/',
  },
  languages: {
    fr: {
      phone: '06 00 00 00 00',
      location: 'Massy (91)',
      mobility: 'Véhiculé',
      skillsTitle: 'Compétences',
      skills: ['Tests unitaires', '', 42],
      educationTitle: 'Formation',
      education: [
        { degree: 'DUT Informatique', period: '2014 – 2016', school: 'IUT de Nice' },
        { period: '2013 – 2014' },
        'Master',
      ],
    },
  },
};

/** Parameters of a whole French CV. */
const PARAMS = {
  language: 'fr',
  translate,
  homeTexts: HOME_TEXTS,
  cvData: CV_DATA,
  experiences: [ACME],
  personalProjects: [{ id: 1, name: 'Calculatrice', type: 'Application web', tools: ['React.js'] }],
  freelanceProjects: [
    { id: 2, name: 'Study SARL', type: 'Site web', tools: ['PHP'], url: 'https://study.fr/' },
  ],
  siteUrl: 'https://issoufi.fr/',
  gitHubUrl: 'https://github.com/AIssoufi',
};

describe('toLinkUrl', () => {
  it.each([
    'https://issoufi.fr/en/',
    'http://localhost:4173',
    'mailto:adam@example.com',
    'tel:+33600000000',
  ])('keeps %s', url => {
    expect(toLinkUrl(url)).toBe(url);
  });

  it.each([
    'javascript:alert(1)',
    'ftp://issoufi.fr',
    'issoufi.fr',
    '',
    '   ',
    undefined,
    null,
    42,
  ])('gives no link for %j', url => {
    expect(toLinkUrl(url)).toBe('');
  });
});

describe('toLinkText', () => {
  it.each([
    ['https://www.linkedin.com/in/issoufiadam', 'linkedin.com/in/issoufiadam'],
    ['https://www.linkedin.com/in/issoufiadam/', 'linkedin.com/in/issoufiadam'],
    ['https://github.com/AIssoufi', 'github.com/AIssoufi'],
    ['https://issoufi.fr/', 'issoufi.fr'],
    ['http://localhost:4173/en//', 'localhost:4173/en'],
  ])('writes %s as %s', (url, text) => {
    expect(toLinkText(url)).toBe(text);
  });

  it.each(['mailto:adam@example.com', 'tel:+33600000000', 'github.com', '', undefined, 42])(
    'gives no text for %j, which is not a web address',
    url => {
      expect(toLinkText(url)).toBe('');
    },
  );
});

describe('buildExperiences', () => {
  it('translates the company, its roles and their projects', () => {
    expect(buildExperiences({ translate, experiences: [ACME] })).toEqual([
      {
        company: 'Acme',
        details: 'CDI · Paris (75)',
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
                state: 'En production',
                description: [],
                bullets: [],
                technologies: ['Vite'],
              },
            ],
            technologies: ['React.js', 'TypeScript'],
          },
        ],
      },
    ]);
  });

  it('leaves out of the details a contract type or a city without translation', () => {
    const [{ details }] = buildExperiences({
      translate,
      experiences: [{ ...ACME, contractKey: 'exp.unknown' }],
    });

    expect(details).toBe('Paris (75)');
  });

  it('leaves out the pieces, bullet points and technologies that are empty or not texts', () => {
    const role = {
      intro: [{ key: 'exp.unknown' }, null, { key: 'exp.acme.intro1', isStrong: 'yes' }],
      bulletKeys: ['exp.unknown', 'exp.acme.b1', 42],
      technologies: ['React.js', '', null, '  '],
    };
    const [{ roles }] = buildExperiences({ translate, experiences: [{ ...ACME, roles: [role] }] });

    expect(roles[0].intro).toEqual([{ text: 'Développement de ', isStrong: false }]);
    expect(roles[0].bullets).toEqual(['Premier point']);
    expect(roles[0].technologies).toEqual(['React.js']);
  });

  it('gives empty texts to a role without keys', () => {
    const [{ roles }] = buildExperiences({ translate, experiences: [{ roles: [{}] }] });

    expect(roles).toEqual([
      { title: '', start: '', end: '', intro: [], bullets: [], projects: [], technologies: [] },
    ]);
  });

  it.each([undefined, null, 'Acme', 42, {}])('lists no company for %j', experiences => {
    expect(buildExperiences({ translate, experiences })).toEqual([]);
  });

  it('leaves out the entries that are not objects', () => {
    expect(buildExperiences({ translate, experiences: [null, 'Acme', [ACME], ACME] })).toHaveLength(
      1,
    );
  });
});

describe('buildProjectItems', () => {
  it('keeps the name, the kind, the technologies and the link of each project', () => {
    expect(buildProjectItems(PARAMS.freelanceProjects)).toEqual([
      { name: 'Study SARL', type: 'Site web', tools: ['PHP'], url: 'https://study.fr/' },
    ]);
  });

  it('leaves out a project without name, and a link that is not a web address', () => {
    const projects = [
      { name: '', type: 'Site web' },
      { name: 'Puissance 4', type: 42, tools: 'Express', url: 'javascript:alert(1)' },
    ];

    expect(buildProjectItems(projects)).toEqual([
      { name: 'Puissance 4', type: '', tools: [], url: '' },
    ]);
  });

  it.each([undefined, null, 'Study SARL', {}])('lists no project for %j', projects => {
    expect(buildProjectItems(projects)).toEqual([]);
  });
});

describe('buildCvContent', () => {
  it('names the document after the CV and its author', () => {
    expect(buildCvContent(PARAMS).title).toBe('CV - ADAM Issoufi');
  });

  it('writes the texts of the home page in the header', () => {
    const content = buildCvContent(PARAMS);

    expect(content).toMatchObject({
      language: 'fr',
      name: 'ADAM Issoufi',
      jobTitle: 'Développeur full-stack JavaScript',
      passion: HOME_TEXTS.passion,
      subtitle: 'Je vous aide',
    });
  });

  it('lists the contact details, then the links to the site, LinkedIn and GitHub', () => {
    expect(buildCvContent(PARAMS).contacts).toEqual([
      { text: 'adam@example.com', url: 'mailto:adam@example.com' },
      { text: '06 00 00 00 00', url: 'tel:+33600000000' },
      { text: 'Massy (91)', url: '' },
      { text: 'Véhiculé', url: '' },
      { text: 'issoufi.fr', url: 'https://issoufi.fr/' },
      { text: 'linkedin.com/in/adam', url: 'https://www.linkedin.com/in/adam/' },
      { text: 'github.com/AIssoufi', url: 'https://github.com/AIssoufi' },
    ]);
  });

  it('titles the sections with the texts of the site and of the data of the CV', () => {
    const content = buildCvContent(PARAMS);

    expect(content.experiences.title).toBe('Expériences');
    expect(content.projects.title).toBe('Projets');
    expect(content.skills.title).toBe('Compétences');
    expect(content.education.title).toBe('Formation');
  });

  it('lists the freelance projects, then the personal ones', () => {
    const { items } = buildCvContent(PARAMS).projects;

    expect(items.map(({ title }) => title)).toEqual(['Projets freelance', 'Projets personnels']);
    expect(items[1].items[0].name).toBe('Calculatrice');
  });

  it('leaves out a group of projects without project', () => {
    const { items } = buildCvContent({ ...PARAMS, freelanceProjects: [] }).projects;

    expect(items.map(({ title }) => title)).toEqual(['Projets personnels']);
  });

  it('keeps the skills and the degrees that are filled', () => {
    const content = buildCvContent(PARAMS);

    expect(content.skills.items).toEqual(['Tests unitaires']);
    expect(content.education.items).toEqual([
      { degree: 'DUT Informatique', period: '2014 – 2016', school: 'IUT de Nice', description: '' },
    ]);
  });

  it.each([undefined, null, {}, { languages: { en: {} } }, { contact: 'adam@example.com' }])(
    'gives empty texts, but the links of the site and GitHub, for the data %j',
    cvData => {
      const content = buildCvContent({ ...PARAMS, cvData });

      expect(content.contacts).toEqual([
        { text: 'issoufi.fr', url: 'https://issoufi.fr/' },
        { text: 'github.com/AIssoufi', url: 'https://github.com/AIssoufi' },
      ]);
      expect(content.skills).toEqual({ title: '', items: [] });
      expect(content.education).toEqual({ title: '', items: [] });
    },
  );

  it('writes the email address without a link when it is not one', () => {
    const cvData = { ...CV_DATA, contact: { email: 'adam at example' } };

    expect(buildCvContent({ ...PARAMS, cvData }).contacts[0]).toEqual({
      text: 'adam at example',
      url: '',
    });
  });

  it('names the document after its author alone when the CV has no name', () => {
    const content = buildCvContent({
      ...PARAMS,
      translate: key => (key === 'cvLink.text' ? '' : translate(key)),
    });

    expect(content.title).toBe('ADAM Issoufi');
  });
});
