import { buildCvContent, buildExperiences, buildProjectItems } from './content.mjs';

/** Translations of a tiny site, by key. */
const TEXTS = {
  'cvLink.documentName': 'CV',
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
  },
  languages: {
    fr: {
      subject: 'Développeur front-end senior',
      keywords: ['React', '', '  ', 42, null, 'TypeScript'],
      labelSeparator: ' : ',
      phone: '06 00 00 00 00',
      location: 'Paris',
      profileTitle: 'Profil',
      summary: 'Développeur front-end',
      proof: 'Mon site est développé par des agents',
      proofLinks: [{ label: 'Code', url: 'https://github.com/AIssoufi/site' }],
      skillsTitle: 'Compétences',
      skills: [{ category: 'Qualité', items: ['Tests unitaires', '', 42] }, 'Tests'],
      educationTitle: 'Formation',
      education: [
        {
          degree: 'DUT Informatique',
          period: '2014 – 2016',
          school: 'IUT de Nice',
          description: 'Conception',
        },
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
  linkedInUrl: 'https://www.linkedin.com/in/adam/',
};

/** Links of the header to the site and LinkedIn that {@link PARAMS} give. */
const PROFILES = [
  { text: 'issoufi.fr', url: 'https://issoufi.fr/', icon: 'site' },
  { text: 'linkedin.com/in/adam', url: 'https://www.linkedin.com/in/adam/', icon: 'linkedin' },
];

describe('buildExperiences', () => {
  it('translates the company, its roles and their projects', () => {
    expect(buildExperiences({ translate, experiences: [ACME] })).toEqual([
      {
        company: 'Acme',
        details: 'CDI\u00a0· Paris (75)',
        roles: [
          {
            title: 'Développeur',
            titleLanguage: '',
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
      {
        title: '',
        titleLanguage: '',
        start: '',
        end: '',
        intro: [],
        bullets: [],
        projects: [],
        technologies: [],
      },
    ]);
  });

  it.each(['en', 'fr', 'pt-BR'])('keeps the language %j of a job title', titleLanguage => {
    const [{ roles }] = buildExperiences({
      translate,
      experiences: [{ roles: [{ titleKey: 'exp.acme.title', titleLanguage }] }],
    });

    expect(roles[0].titleLanguage).toBe(titleLanguage);
  });

  it.each([undefined, null, '', '  ', 'english', 'EN', 'e', 'en_US', 42, ['en'], { en: true }])(
    'gives no language to a job title whose language is %j, which is no language code',
    titleLanguage => {
      const [{ roles }] = buildExperiences({
        translate,
        experiences: [{ roles: [{ titleKey: 'exp.acme.title', titleLanguage }] }],
      });

      expect(roles[0].titleLanguage).toBe('');
    },
  );

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
  it('keeps the name and the link of each project, without its kind or its technologies', () => {
    expect(buildProjectItems(PARAMS.freelanceProjects)).toEqual([
      { name: 'Study SARL', url: 'https://study.fr/' },
    ]);
  });

  it('leaves out a project without name, and a link that is not a web address', () => {
    const projects = [
      { name: '', url: 'https://study.fr/' },
      { name: '  ', url: 'https://study.fr/' },
      { name: 42, url: 'https://study.fr/' },
      { name: 'Puissance 4', url: 'javascript:alert(1)' },
      { name: 'Calculatrice', url: 42 },
    ];

    expect(buildProjectItems(projects)).toEqual([
      { name: 'Puissance 4', url: '' },
      { name: 'Calculatrice', url: '' },
    ]);
  });

  it.each([undefined, null, 'Study SARL', {}])('lists no project for %j', projects => {
    expect(buildProjectItems(projects)).toEqual([]);
  });
});

describe('buildCvContent', () => {
  it('names the document after the CV, its author and the job title', () => {
    expect(buildCvContent(PARAMS).title).toBe(
      'CV - ADAM Issoufi - Développeur full-stack JavaScript',
    );
  });

  it('leaves an empty job title out of the name of the document', () => {
    const homeTexts = { ...HOME_TEXTS, jobTitle: '' };

    expect(buildCvContent({ ...PARAMS, homeTexts }).title).toBe('CV - ADAM Issoufi');
  });

  it('gives the subject and the filled keywords of the data of the CV', () => {
    const content = buildCvContent(PARAMS);

    expect(content.subject).toBe('Développeur front-end senior');
    expect(content.keywords).toEqual(['React', 'TypeScript']);
  });

  it.each([
    ['missing', { subject: undefined, keywords: undefined }],
    ['null', { subject: null, keywords: null }],
    ['of the wrong type', { subject: 42, keywords: 'React, TypeScript' }],
    ['empty', { subject: '', keywords: [] }],
  ])('gives no subject nor keyword when they are %s', (_case, texts) => {
    const cvData = { ...CV_DATA, languages: { fr: { ...CV_DATA.languages.fr, ...texts } } };

    const content = buildCvContent({ ...PARAMS, cvData });

    expect(content.subject).toBe('');
    expect(content.keywords).toEqual([]);
  });

  it('writes the texts of the home page in the header', () => {
    const content = buildCvContent(PARAMS);

    expect(content).toMatchObject({
      language: 'fr',
      name: 'ADAM Issoufi',
      jobTitle: 'Développeur full-stack JavaScript',
      passion: HOME_TEXTS.passion,
    });
  });

  it('leaves out the subtitle of the home page, which offers services to clients', () => {
    expect(buildCvContent(PARAMS)).not.toHaveProperty('subtitle');
  });

  it('lists the contact details with their icons, the email address and the phone as links', () => {
    expect(buildCvContent(PARAMS).contacts).toEqual([
      { text: 'adam@example.com', url: 'mailto:adam@example.com', icon: 'email' },
      { text: '06 00 00 00 00', url: 'tel:+33600000000', icon: 'phone' },
      { text: 'Paris', url: '', icon: 'location' },
    ]);
  });

  it('lists the links to the site and LinkedIn with their icons', () => {
    expect(buildCvContent(PARAMS).profiles).toEqual(PROFILES);
  });

  it('leaves the QR code out of a CV whose data does not ask for it', () => {
    expect(buildCvContent(PARAMS).qrCodeUrl).toBe('');
  });

  it('leads the QR code to the home page of the language when the data asks for it', () => {
    const cvData = { ...CV_DATA, showQrCode: true };

    expect(buildCvContent({ ...PARAMS, cvData }).qrCodeUrl).toBe('https://issoufi.fr/');
  });

  it.each([false, 'true', 1, null])(
    'leaves the QR code out when it is asked for with %j',
    value => {
      const cvData = { ...CV_DATA, showQrCode: value };

      expect(buildCvContent({ ...PARAMS, cvData }).qrCodeUrl).toBe('');
    },
  );

  it.each(['', 'issoufi.fr', 'javascript:alert(1)'])(
    'leaves the QR code out when the URL of the site is %j',
    siteUrl => {
      const cvData = { ...CV_DATA, showQrCode: true };

      expect(buildCvContent({ ...PARAMS, cvData, siteUrl }).qrCodeUrl).toBe('');
    },
  );

  it('keeps the icon of each contact detail when the one before it is left out', () => {
    const cvData = { ...CV_DATA, contact: { ...CV_DATA.contact, email: '' } };

    expect(buildCvContent({ ...PARAMS, cvData }).contacts.map(({ icon }) => icon)).toEqual([
      'phone',
      'location',
    ]);
  });

  it('titles the sections with the texts of the site and of the data of the CV', () => {
    const content = buildCvContent(PARAMS);

    expect(content.experiences.title).toBe('Expériences');
    expect(content.projects.title).toBe('Projets');
    expect(content.profile.title).toBe('Profil');
    expect(content.skills.title).toBe('Compétences');
    expect(content.education.title).toBe('Formation');
  });

  it('writes the profile and the separator of its labels from the data of the CV', () => {
    const content = buildCvContent(PARAMS);

    expect(content.labelSeparator).toBe(' : ');
    expect(content.profile).toEqual({
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
    });
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

  it('keeps the skills and the degrees that are filled, a degree without its description', () => {
    const content = buildCvContent(PARAMS);

    expect(content.skills.items).toEqual([{ category: 'Qualité', items: ['Tests unitaires'] }]);
    expect(content.education.items).toEqual([
      { degree: 'DUT Informatique', period: '2014 – 2016', school: 'IUT de Nice' },
    ]);
  });

  it.each([undefined, null, {}, { languages: { en: {} } }, { contact: 'adam@example.com' }])(
    'gives empty texts, but the links of the site and LinkedIn, for the data %j',
    cvData => {
      const content = buildCvContent({ ...PARAMS, cvData });

      expect(content.contacts).toEqual([]);
      expect(content.profiles).toEqual(PROFILES);
      expect(content.labelSeparator).toBe('');
      expect(content.profile).toEqual({ title: '', summary: '', proof: '', proofLinks: [] });
      expect(content.skills).toEqual({ title: '', items: [] });
      expect(content.education).toEqual({ title: '', items: [] });
    },
  );

  it.each([undefined, '', 'issoufi.fr', 'javascript:alert(1)'])(
    'writes the domain of the site without a link when its URL is %j',
    siteUrl => {
      expect(buildCvContent({ ...PARAMS, siteUrl }).profiles[0]).toEqual({
        text: 'issoufi.fr',
        url: '',
        icon: 'site',
      });
    },
  );

  it.each([undefined, null, 42, '', 'linkedin.com/in/adam', 'javascript:alert(1)'])(
    'leaves out the LinkedIn profile when its URL is %j',
    linkedInUrl => {
      const texts = buildCvContent({ ...PARAMS, linkedInUrl }).profiles.map(({ text }) => text);

      expect(texts).toEqual(['issoufi.fr']);
    },
  );

  it('writes the email address without a link when it is not one', () => {
    const cvData = { ...CV_DATA, contact: { email: 'adam at example' } };

    expect(buildCvContent({ ...PARAMS, cvData }).contacts[0]).toEqual({
      text: 'adam at example',
      url: '',
      icon: 'email',
    });
  });

  it('names the document after its author and the job title when the CV has no name', () => {
    const content = buildCvContent({
      ...PARAMS,
      translate: key => (key === 'cvLink.documentName' ? '' : translate(key)),
    });

    expect(content.title).toBe('ADAM Issoufi - Développeur full-stack JavaScript');
  });
});
