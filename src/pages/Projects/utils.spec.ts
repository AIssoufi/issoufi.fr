import i18n from '../../i18n/index.ts';
import type { ProjectData } from './types.ts';
import { translateProjects } from './utils.ts';

/** A project of the JSON data, with the keys of its texts. */
const CHESS: ProjectData = {
  id: 1,
  nameKey: 'chess',
  typeKey: 'webApp',
  thumbnails: [{ url: '/chess-480.webp', width: 480, height: 300 }],
  url: 'https://aissoufi.github.io/chess/',
  tools: ['HTML 5', 'CSS 3'],
};

/** A freelance project, named after its client. */
const TROUILLET_DECORS: ProjectData = {
  id: 7,
  nameKey: 'trouilletDecors',
  typeKey: 'showcaseWebsite',
  thumbnails: [{ url: '/trouillet-decors-480.webp', width: 480, height: 300 }],
  tools: ['WordPress'],
};

/**
 * Translation function of a fresh i18next instance holding only `resources`, in English with
 * French as fallback.
 */
const createT = async (resources: Record<string, object>) => {
  const instance = i18n.createInstance();
  await instance.init({
    resources: Object.fromEntries(
      Object.entries(resources).map(([language, translation]) => [language, { translation }]),
    ),
    lng: 'en',
    fallbackLng: 'fr',
  });
  return instance.t;
};

describe('translateProjects', () => {
  it.each([
    ['fr', 'Jeu d’échecs', 'Application web'],
    ['en', 'Chess game', 'Web application'],
  ])('names the project and its kind in %s', (language, name, type) => {
    const [project] = translateProjects({ projects: [CHESS], t: i18n.getFixedT(language) });

    expect(project).toMatchObject({ name, type });
  });

  it('keeps a client name as it is in English', () => {
    const [project] = translateProjects({
      projects: [TROUILLET_DECORS],
      t: i18n.getFixedT('en'),
    });

    expect(project).toMatchObject({ name: 'Trouillet Décors', type: 'Brochure website' });
  });

  it('replaces the keys with the texts, and keeps every other field and the order', () => {
    expect(
      translateProjects({ projects: [CHESS, TROUILLET_DECORS], t: i18n.getFixedT('fr') }),
    ).toEqual([
      {
        id: 1,
        name: 'Jeu d’échecs',
        type: 'Application web',
        thumbnails: [{ url: '/chess-480.webp', width: 480, height: 300 }],
        url: 'https://aissoufi.github.io/chess/',
        tools: ['HTML 5', 'CSS 3'],
      },
      {
        id: 7,
        name: 'Trouillet Décors',
        type: 'Site vitrine',
        thumbnails: [{ url: '/trouillet-decors-480.webp', width: 480, height: 300 }],
        tools: ['WordPress'],
      },
    ]);
  });

  it('shows the French text when the language lacks it', async () => {
    const t = await createT({
      fr: { projects: { names: { chess: 'Jeu d’échecs' }, types: { webApp: 'Application web' } } },
      en: { projects: { names: {}, types: { webApp: 'Web application' } } },
    });

    const [project] = translateProjects({ projects: [CHESS], t });

    expect(project).toMatchObject({ name: 'Jeu d’échecs', type: 'Web application' });
  });

  describe('edge cases', () => {
    const t = i18n.getFixedT('en');

    it('returns no card for an empty list', () => {
      expect(translateProjects({ projects: [], t })).toEqual([]);
    });

    it.each([undefined, null, 'chess', 42, { projects: [CHESS] }])(
      'returns no card when the projects are %j',
      projects => {
        expect(translateProjects({ projects: projects as unknown as ProjectData[], t })).toEqual(
          [],
        );
      },
    );

    it.each(['unknown', 'chess.name', 'chess.', '..', 'Chess', ' chess'])(
      'gives an empty text, never the key, for the key %j that no translation has',
      key => {
        const [project] = translateProjects({
          projects: [{ ...CHESS, nameKey: key, typeKey: key }],
          t,
        });

        expect(project).toMatchObject({ name: '', type: '' });
      },
    );

    it.each([undefined, null, 42, '', '   ', ['chess'], { key: 'chess' }])(
      'gives an empty text for the key %j, which is not a filled string',
      key => {
        const [project] = translateProjects({
          projects: [{ ...CHESS, nameKey: key, typeKey: key } as unknown as ProjectData],
          t,
        });

        expect(project).toMatchObject({ name: '', type: '' });
      },
    );

    it.each(['constructor', 'toString', 'hasOwnProperty', '__proto__'])(
      'gives an empty text for the key %j, which every object inherits',
      key => {
        const [project] = translateProjects({
          projects: [{ ...CHESS, nameKey: key, typeKey: key }],
          t,
        });

        expect(project).toMatchObject({ name: '', type: '' });
      },
    );

    it.each([null, undefined, 42, 'chess', ['chess'], []])(
      'leaves out the item %j, which is not a project, and keeps the others',
      item => {
        const projects = translateProjects({
          projects: [item, TROUILLET_DECORS] as unknown as ProjectData[],
          t,
        });

        expect(projects.map(({ name }) => name)).toEqual(['Trouillet Décors']);
      },
    );

    it('translates the other projects of the list when one has a bad key', () => {
      const projects = translateProjects({
        projects: [{ ...CHESS, nameKey: 'unknown' }, TROUILLET_DECORS],
        t,
      });

      expect(projects.map(({ name }) => name)).toEqual(['', 'Trouillet Décors']);
    });
  });
});
