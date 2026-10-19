import { act, render, screen } from '@testing-library/react';

import i18n from '../../i18n';
import { en } from '../../i18n/en';
import { fr } from '../../i18n/fr';
import { getPage } from '../../utils/pages';
import { readPublicWebpSize } from '../../publicFileTestUtils';
import { getReadText, readBackgroundImages } from '../testUtils';
import experiencesData from './.data/experiences.json';
import { LOGO_SIZE_PX } from './JobSummary/constants';
import { Experiences } from './Experiences';

/** Names of the fields of the data that hold a translation key, or a list of them. */
const KEY_FIELD_PATTERN = /^key$|Keys?$/;

/** Lists every translation key that a value of the data names, at any depth. */
const listTranslationKeys = value => {
  if (Array.isArray(value)) return value.flatMap(listTranslationKeys);
  if (typeof value !== 'object' || value === null) return [];

  return Object.entries(value).flatMap(([name, child]) =>
    KEY_FIELD_PATTERN.test(name) ? [child].flat() : listTranslationKeys(child),
  );
};

/** Keys of the exp translations that the page reads itself rather than through its data. */
const PAGE_TEXT_KEYS = ['exp.pageTitle', 'exp.periodTo'];

/** Groups of the exp translations that the page reads itself: the plurals of the durations. */
const PAGE_TEXT_GROUPS = ['exp.duration'];

/** Lists the key of every text of a group of translations, e.g. `exp.sewan.name`. */
const listTextKeys = ({ translations, prefix }) =>
  Object.entries(translations).flatMap(([name, value]) =>
    typeof value === 'string'
      ? [`${prefix}.${name}`]
      : listTextKeys({ translations: value, prefix: `${prefix}.${name}` }),
  );

/** Reads the text of a translation key in a translations object, `undefined` when it has none. */
const getText = ({ translations, key }) =>
  key.split('.').reduce((group, part) => group?.[part], translations);

const { experiences: EXPERIENCES } = experiencesData;

/** Every role of the data, company after company, in the order of the page. */
const ROLES = EXPERIENCES.flatMap(({ roles }) => roles);

/** Every project of the data with a title, in the order of the page. */
const TITLED_PROJECTS = ROLES.flatMap(({ projects = [] }) => projects).filter(
  ({ titleKey }) => titleKey,
);

/** Whether a job or a project of the data lists technologies. */
const hasTechnologies = technologies => Array.isArray(technologies) && technologies.length > 0;

/** Level of a heading element, from its tag name: 2 for a `h2`. */
const getHeadingLevel = heading => Number(heading.tagName.slice(1));

/** Characters that only decorate the page, which screen readers must not read. */
const DECORATION_PATTERN = /[↓–›]/;

describe('Experiences', () => {
  afterEach(async () => {
    await act(() => i18n.changeLanguage('fr'));
  });

  it('renders the page title', () => {
    render(<Experiences />);

    expect(screen.getByRole('heading', { name: 'Expériences', level: 1 })).toBeInTheDocument();
  });

  it('has a single main landmark and a single level 1 heading', () => {
    render(<Experiences />);

    expect(screen.getAllByRole('main')).toHaveLength(1);
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  });

  it('gives every list, bullet lists included, an explicit list role, which Safari drops from lists without bullets', () => {
    render(<Experiences />);
    // b3 has no non-breaking space, so its translated text matches the text of the page exactly
    const bulletList = screen.getByText(i18n.t('exp.wibilong.b3')).closest('ul');
    const lists = screen.getAllByRole('list', { hidden: true });

    expect(lists).toContain(bulletList);
    lists.forEach(list => expect(list).toHaveAttribute('role', 'list'));
  });

  it.each(['Sewan Groupe', 'Wibilong', 'Supralog', 'Beepeers'])('shows the %s experience', name => {
    render(<Experiences />);

    expect(screen.getByRole('heading', { level: 2, name })).toBeInTheDocument();
  });

  it('lists the companies in the timeline, one item each, most recent first', () => {
    const { container } = render(<Experiences />);
    const timeline = container.querySelector('[data-timeline-line]');

    expect(timeline).toHaveAttribute('role', 'list');
    const companies = [...timeline.children];
    expect(companies.map(company => company.tagName)).toEqual(EXPERIENCES.map(() => 'LI'));
    expect(companies.map(company => company.querySelector('h2').textContent)).toEqual(
      EXPERIENCES.map(({ nameKey }) => i18n.t(nameKey)),
    );
  });

  describe('headings', () => {
    it('gives every company a level 2 heading, in the order of the data', () => {
      render(<Experiences />);

      const names = screen
        .getAllByRole('heading', { level: 2 })
        .map(({ textContent }) => textContent);
      expect(names).toEqual(EXPERIENCES.map(({ nameKey }) => i18n.t(nameKey)));
    });

    it('gives every job a level 3 heading, in the order of the data', () => {
      render(<Experiences />);

      const titles = screen
        .getAllByRole('heading', { level: 3 })
        .map(({ textContent }) => textContent);
      expect(titles).toEqual(ROLES.map(({ titleKey }) => i18n.t(titleKey)));
    });

    it('gives every project a level 4 heading, in the order of the data', () => {
      render(<Experiences />);

      const titles = screen
        .getAllByRole('heading', { level: 4 })
        .map(({ textContent }) => textContent);
      expect(titles.length).toBeGreaterThan(0);
      expect(titles).toEqual(TITLED_PROJECTS.map(({ titleKey }) => i18n.t(titleKey)));
    });

    it('never skips a level from one heading to the next, as axe-core checks', () => {
      render(<Experiences />);

      const levels = screen.getAllByRole('heading').map(getHeadingLevel);
      const skipsALevel = (level, index) => {
        const isFirstHeading = index === 0;
        return !isFirstHeading && level > levels[index - 1] + 1;
      };
      const skippedLevels = levels.filter(skipsALevel);
      expect(levels[0]).toBe(1);
      expect(skippedLevels).toEqual([]);
      expect(new Set(levels)).toEqual(new Set([1, 2, 3, 4]));
    });
  });

  describe('periods', () => {
    it.each(['fr', 'en'])(
      'reads the period of every job, in its column and in its card, as "start to end" in %s',
      async language => {
        await act(() => i18n.changeLanguage(language));
        const { container } = render(<Experiences />);
        const articles = screen.getAllByRole('article');
        const columns = container.querySelectorAll('[data-timeline-dot="after"]');
        const expectedPeriods = ROLES.map(
          ({ startKey, endKey }) =>
            `${i18n.t(startKey)} ${i18n.t('exp.periodTo')} ${i18n.t(endKey)}`,
        );

        expect([...columns].map(getReadText)).toEqual(expectedPeriods);
        expect(articles).toHaveLength(ROLES.length);
        articles.forEach((article, index) =>
          expect(getReadText(article)).toContain(expectedPeriods[index]),
        );
      },
    );

    it('reads no arrow nor dash of the periods, which only decorate them', () => {
      const { container } = render(<Experiences />);

      expect(getReadText(container)).not.toMatch(DECORATION_PATTERN);
      expect(container.textContent).toMatch(DECORATION_PATTERN);
    });
  });

  it('lists the technologies of every job and every project', () => {
    render(<Experiences />);
    const technologyLists = [
      ...ROLES.map(({ technologies }) => technologies),
      ...ROLES.flatMap(({ projects = [] }) => projects).map(({ technologies }) => technologies),
    ].filter(hasTechnologies);
    const listedTexts = screen
      .getAllByRole('list')
      .map(list => [...list.children].map(({ textContent }) => textContent));

    expect(technologyLists.length).toBeGreaterThan(1);
    expect(listedTexts).toEqual(expect.arrayContaining(technologyLists));
  });

  it('names the pseudo-element of its timeline line for the browser test of the timeline', () => {
    const { container } = render(<Experiences />);

    expect(container.querySelectorAll('[data-timeline-line="before"]')).toHaveLength(1);
  });

  it.each(['Sewan Groupe', 'Wibilong', 'Supralog', 'Beepeers'])(
    'names the pseudo-element of the dot of the %s experience for the browser test of the timeline',
    name => {
      render(<Experiences />);

      // Each company is a child of the timeline, a single job or the group of its roles
      const heading = screen.getByRole('heading', { level: 2, name });
      const company = heading.closest('[data-timeline-line] > *');
      expect(company).toHaveAttribute('data-timeline-dot', 'before');
    },
  );

  describe('data', () => {
    const experiences = EXPERIENCES;
    const translationKeys = listTranslationKeys(experiences);

    it('names texts of the exp translations', () => {
      expect(translationKeys.length).toBeGreaterThan(0);
      translationKeys.forEach(key => expect(key).toMatch(/^exp\./));
    });

    it.each([
      ['French', fr],
      ['English', en],
    ])('names only texts that the %s translations hold', (_language, translations) => {
      const missingKeys = translationKeys.filter(
        key => typeof getText({ translations, key }) !== 'string',
      );
      expect(missingKeys).toEqual([]);
    });

    it.each([
      ['French', fr],
      ['English', en],
    ])(
      'uses every text of the %s exp translations, so that none is left behind',
      (_language, translations) => {
        const usedKeys = new Set([...translationKeys, ...PAGE_TEXT_KEYS]);
        const isReadByThePage = key =>
          usedKeys.has(key) || PAGE_TEXT_GROUPS.some(group => key.startsWith(`${group}.`));

        const unusedKeys = listTextKeys({ translations: translations.exp, prefix: 'exp' }).filter(
          key => !isReadByThePage(key),
        );

        expect(unusedKeys).toEqual([]);
      },
    );

    it('gives every company its own id', () => {
      const ids = experiences.map(({ id }) => id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('serves every logo from public/ as a square WebP image twice as big as it shows', () => {
      const logoFileSizePx = 2 * LOGO_SIZE_PX;
      experiences.forEach(({ logoUrl }) =>
        expect(readPublicWebpSize(logoUrl), logoUrl).toEqual({
          width: logoFileSizePx,
          height: logoFileSizePx,
        }),
      );
    });

    it('gives every role its start and its end, which the timeline and its card both write', () => {
      expect(ROLES.length).toBeGreaterThan(0);
      ROLES.forEach(({ startKey, endKey }) => {
        expect(startKey).toBeTruthy();
        expect(endKey).toBeTruthy();
      });
    });
  });

  it('shows the background photo of its entry in PAGES, over its placeholder', () => {
    const { url, portraitUrl, placeholderUrl } = getPage('/experiences').backgroundPhoto;
    render(<Experiences />);

    expect(readBackgroundImages(screen.getByRole('main'))).toEqual({
      image: `url("${url}"), url("${placeholderUrl}")`,
      portraitImage: `url("${portraitUrl}"), url("${placeholderUrl}")`,
    });
  });
});
