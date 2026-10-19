import { act, render, screen, within } from '@testing-library/react';

import i18n from '../../../i18n/index.ts';
import { getReadText } from '../../testUtils.js';
import CompanyEntry from './CompanyEntry.tsx';

/** A company with a single role, shown as one card after its period. */
const WIBILONG = {
  id: 'wibilong',
  nameKey: 'exp.wibilong.name',
  contractKey: 'exp.wibilong.contract',
  cityKey: 'exp.wibilong.city',
  logoUrl: '/wibilong.webp',
  roles: [
    {
      titleKey: 'exp.wibilong.title',
      startKey: 'exp.wibilong.start',
      endKey: 'exp.wibilong.end',
      bulletKeys: ['exp.wibilong.b3'],
    },
  ],
};

/** A company with two roles, shown as a group that writes the company once. */
const SEWAN = {
  id: 'sewan',
  nameKey: 'exp.sewan.name',
  contractKey: 'exp.sewan.contract',
  cityKey: 'exp.sewan.city',
  logoUrl: '/sewan.webp',
  roles: [
    {
      titleKey: 'exp.sewanLead.title',
      startKey: 'exp.sewanLead.start',
      endKey: 'exp.sewanLead.end',
    },
    {
      titleKey: 'exp.sewanSenior.title',
      startKey: 'exp.sewanSenior.start',
      endKey: 'exp.sewanSenior.end',
    },
  ],
};

describe('CompanyEntry', () => {
  afterEach(async () => {
    await act(() => i18n.changeLanguage('fr'));
  });

  it('renders without any props', () => {
    expect(() => render(<CompanyEntry />)).not.toThrow();
  });

  it('renders a company without roles', () => {
    render(<CompanyEntry experience={{ ...WIBILONG, roles: [] }} />);

    expect(screen.getByRole('heading', { level: 2, name: 'Wibilong' })).toBeInTheDocument();
    expect(document.querySelector('img')).toHaveAttribute('src', '/wibilong.webp');
  });

  it.each([
    ['a single role', WIBILONG],
    ['several roles', SEWAN],
  ])('is an item of the list of the timeline with %s', (_, experience) => {
    const { container } = render(<CompanyEntry experience={experience} />);

    expect(container.firstChild.tagName).toBe('LI');
  });

  it.each([
    ['a single role', WIBILONG, 'Wibilong'],
    ['several roles', SEWAN, 'Sewan Groupe'],
  ])(
    'names the company with %s once, with a level 2 heading hidden from the screen',
    (_, experience, name) => {
      const { container } = render(<CompanyEntry experience={experience} />);
      const [heading, ...otherHeadings] = screen.getAllByRole('heading', { level: 2 });

      expect(otherHeadings).toEqual([]);
      expect(heading).toHaveTextContent(name);
      expect(heading).toHaveStyle({ position: 'absolute', clipPath: 'inset(50%)' });
      expect(container.firstChild.firstChild).toBe(heading);
    },
  );

  it.each(['exp.unknown', undefined])(
    'renders no empty heading for a company whose name key is %j',
    nameKey => {
      render(<CompanyEntry experience={{ ...WIBILONG, nameKey }} />);

      expect(screen.queryByRole('heading', { level: 2 })).not.toBeInTheDocument();
    },
  );

  describe('with a single role', () => {
    it('shows the company, the job and its description', () => {
      render(<CompanyEntry experience={WIBILONG} />);

      expect(document.querySelector('img')).toHaveAttribute('src', '/wibilong.webp');
      expect(
        screen.getByRole('heading', {
          level: 3,
          name: 'Full-Stack JavaScript Engineer — React, Node.js, AWS',
        }),
      ).toBeVisible();
      expect(screen.getByText('Wibilong · CDI · Paris (75)')).toBeInTheDocument();
      expect(
        screen.getByText(
          'Maintien en condition opérationnelle (MCO) et résolution de bugs en production',
        ),
      ).toBeInTheDocument();
    });

    it('marks the job title with the language of its data', () => {
      const [role] = WIBILONG.roles;
      render(
        <CompanyEntry experience={{ ...WIBILONG, roles: [{ ...role, titleLanguage: 'en' }] }} />,
      );

      expect(screen.getByRole('heading', { level: 3 })).toHaveAttribute('lang', 'en');
    });

    it('gives the job title no language of its own when its data has none', () => {
      render(<CompanyEntry experience={WIBILONG} />);

      expect(screen.getByRole('heading', { level: 3 })).not.toHaveAttribute('lang');
    });

    it('lists the technologies of its role in its card', () => {
      const [role] = WIBILONG.roles;
      render(
        <CompanyEntry
          experience={{ ...WIBILONG, roles: [{ ...role, technologies: ['React.js'] }] }}
        />,
      );

      // After the list of its bullet points
      const lists = within(screen.getByRole('article')).getAllByRole('list');
      expect(lists[lists.length - 1].textContent).toBe('React.js');
    });

    it('writes the period of its role on the timeline, read "sept. 2019 à juin 2021"', () => {
      const { container } = render(<CompanyEntry experience={WIBILONG} />);
      const column = container.querySelector('[data-timeline-dot="after"]');

      expect(getReadText(column)).toBe('sept. 2019 à juin 2021');
    });

    it.each([
      ['without dates', {}, ''],
      ['with a start only', { startKey: 'exp.wibilong.start' }, 'sept. 2019'],
      ['with an end only', { endKey: 'exp.wibilong.end' }, 'juin 2021'],
      [
        'with a date key without translation',
        { startKey: 'exp.unknown', endKey: 'exp.wibilong.end' },
        'juin 2021',
      ],
    ])('writes only the dates it has of a role %s', (_, dates, expected) => {
      const role = { titleKey: 'exp.wibilong.title', ...dates };
      const { container } = render(<CompanyEntry experience={{ ...WIBILONG, roles: [role] }} />);
      const column = container.querySelector('[data-timeline-dot="after"]');

      expect(getReadText(column)).toBe(expected);
    });

    it('writes the period of the job in its card too, for the screens without the column', () => {
      render(<CompanyEntry experience={WIBILONG} />);

      expect(getReadText(screen.getByRole('article'))).toContain('sept. 2019 à juin 2021');
    });

    it('names the pseudo-element of its dot for the browser test of the timeline', () => {
      const { container } = render(<CompanyEntry experience={WIBILONG} />);

      expect(container.firstChild).toHaveAttribute('data-timeline-dot', 'before');
    });

    it('writes its texts in the active language', async () => {
      render(<CompanyEntry experience={WIBILONG} />);

      await act(() => i18n.changeLanguage('en'));

      expect(screen.getByText('Wibilong · Permanent · Paris (75)')).toBeInTheDocument();
    });
  });

  describe('with several roles', () => {
    it('shows each job, in order', () => {
      render(<CompanyEntry experience={SEWAN} />);

      const jobs = screen.getAllByText(/Engineer/).map(node => node.textContent);
      expect(jobs).toEqual([
        'Lead Frontend Engineer — UI Kit Owner & Architect',
        'Senior Full-Stack Engineer — Core Platform (React, Node.js, GraphQL)',
      ]);
    });

    it('lists the technologies of each role in its own card', () => {
      const [lead, senior] = SEWAN.roles;
      const roles = [
        { ...lead, technologies: ['React.js', 'Storybook'] },
        { ...senior, technologies: ['GraphQL'] },
      ];
      render(<CompanyEntry experience={{ ...SEWAN, roles }} />);

      const cardTechnologies = screen.getAllByRole('article').map(card =>
        within(card)
          .getAllByRole('listitem')
          .map(({ textContent }) => textContent),
      );
      expect(cardTechnologies).toEqual([['React.js', 'Storybook'], ['GraphQL']]);
    });

    it('marks the job title of each role with the language of its own data', () => {
      const [lead, senior] = SEWAN.roles;
      render(
        <CompanyEntry
          experience={{ ...SEWAN, roles: [{ ...lead, titleLanguage: 'en' }, senior] }}
        />,
      );
      const [leadTitle, seniorTitle] = screen.getAllByRole('heading', { level: 3 });

      expect(leadTitle).toHaveAttribute('lang', 'en');
      expect(seniorTitle).not.toHaveAttribute('lang');
    });

    it('writes the company with each job', () => {
      render(<CompanyEntry experience={SEWAN} />);

      expect(screen.getAllByText('Sewan Groupe · CDI · Paris (75)')).toHaveLength(2);
      expect(document.querySelectorAll('img[src="/sewan.webp"]')).toHaveLength(2);
    });

    it('gives each job a level 3 heading under the level 2 one of the company', () => {
      render(<CompanyEntry experience={SEWAN} />);
      const levels = screen.getAllByRole('heading').map(heading => heading.tagName);

      expect(levels).toEqual(['H2', 'H3', 'H3']);
    });

    it('names the pseudo-element of the dot of the group for the browser test of the timeline', () => {
      const { container } = render(<CompanyEntry experience={SEWAN} />);

      expect(container.firstChild).toHaveAttribute('data-timeline-dot', 'before');
    });
  });
});
