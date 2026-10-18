import { render, screen } from '@testing-library/react';

import i18n from '../../i18n';
import { en } from '../../i18n/en';
import { fr } from '../../i18n/fr';
import { isPublicFile } from '../testUtils';
import experiencesData from './.data/experiences.json';
import { BACKGROUND_IMAGE_URL } from './constants';
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
const PAGE_TEXT_KEYS = ['exp.pageTitle'];

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

describe('Experiences', () => {
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

    expect(screen.getAllByRole('img', { name }).length).toBeGreaterThan(0);
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
      const [logo] = screen.getAllByRole('img', { name });
      const company = logo.closest('[data-timeline-line] > *');
      expect(company).toHaveAttribute('data-timeline-dot', 'before');
    },
  );

  describe('data', () => {
    const { experiences } = experiencesData;
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

    it('serves every logo from public/', () => {
      experiences.forEach(({ logoUrl }) => expect(isPublicFile(logoUrl)).toBe(true));
    });

    it('gives the timeline period of every company with a single role', () => {
      experiences
        .filter(({ roles }) => roles.length === 1)
        .forEach(({ periodStartKey, periodEndKey }) => {
          expect(periodStartKey).toBeTruthy();
          expect(periodEndKey).toBeTruthy();
        });
    });
  });

  it('serves its background from public/', () => {
    expect(isPublicFile(BACKGROUND_IMAGE_URL)).toBe(true);
  });
});
