import { act, render, screen, within } from '@testing-library/react';

import i18n from '../../../i18n/index.ts';
import { mediaDeclaringStyle } from '../../../styleTestUtils.js';
import { FULL_MOTION_QUERY, HOVER_POINTER_QUERY } from '../../../theme/constants.ts';
import { getReadText } from '../../testUtils.js';
import ExperienceGroup from './ExperienceGroup.tsx';

/** Any duration text, in French or in English. */
const DURATION_TEXT = /\d+ (an|ans|mois|years?|months?)/;

describe('ExperienceGroup', () => {
  afterEach(async () => {
    await act(() => i18n.changeLanguage('fr'));
  });

  it('renders without any props', () => {
    expect(() => render(<ExperienceGroup />)).not.toThrow();
  });

  it('lists its roles with an explicit list role, which Safari drops from lists without bullets', () => {
    render(
      <ExperienceGroup entityName="Sewan Groupe">
        <ExperienceGroup.Role jobName="Lead Frontend Engineer" />
        <ExperienceGroup.Role jobName="Senior Frontend Engineer" />
      </ExperienceGroup>,
    );
    const list = screen.getByRole('list');

    expect(list).toHaveAttribute('role', 'list');
    expect(within(list).getAllByRole('listitem')).toHaveLength(2);
  });

  it('keeps the list role of a group without roles', () => {
    render(<ExperienceGroup />);
    const list = screen.getByRole('list');

    expect(list).toHaveAttribute('role', 'list');
    expect(list).toBeEmptyDOMElement();
  });

  it('shares the company details with its roles', () => {
    render(
      <ExperienceGroup
        entityName="Sewan Groupe"
        entityLogoUrl="/sewan.webp"
        contractType="CDI"
        city="Paris (75)"
      >
        <ExperienceGroup.Role
          jobName="Lead Frontend Engineer"
          startDate="juin 2021"
          endDate="juin 2023"
        >
          Owner de l'UI Kit
        </ExperienceGroup.Role>
      </ExperienceGroup>,
    );

    expect(screen.getByText('Lead Frontend Engineer')).toBeInTheDocument();
    expect(screen.getByText('Sewan Groupe · CDI · Paris (75)')).toBeInTheDocument();
    expect(screen.getByText('2 ans 1 mois')).toBeInTheDocument();
    expect(document.querySelector('img')).toHaveAttribute('src', '/sewan.webp');
    expect(screen.getByText("Owner de l'UI Kit")).toBeInTheDocument();
  });

  it('names the company with a level 2 heading, hidden from the screen, before its roles', () => {
    render(
      <ExperienceGroup entityName="Sewan Groupe">
        <ExperienceGroup.Role jobName="Lead Frontend Engineer" />
      </ExperienceGroup>,
    );
    const heading = screen.getByRole('heading', { level: 2, name: 'Sewan Groupe' });

    expect(heading).toHaveStyle({ position: 'absolute', clipPath: 'inset(50%)' });
    expect(heading.nextElementSibling).toBe(screen.getByRole('list'));
  });

  it.each(['', undefined, null])(
    'renders no empty heading when the company name is %j',
    entityName => {
      render(
        <ExperienceGroup entityName={entityName}>
          <ExperienceGroup.Role jobName="Lead Frontend Engineer" />
        </ExperienceGroup>,
      );

      expect(screen.queryByRole('heading', { level: 2 })).not.toBeInTheDocument();
    },
  );

  it('is an item of the list of the timeline', () => {
    const { container } = render(<ExperienceGroup entityName="Sewan Groupe" />);

    expect(container.firstChild.tagName).toBe('LI');
  });

  // GlobalStyle makes the transition instant with reduced motion: the card would jump
  it('raises the card of a role on hover only without reduced motion, while its shadow grows for every visitor', () => {
    render(
      <ExperienceGroup entityName="Sewan Groupe">
        <ExperienceGroup.Role jobName="Lead Frontend Engineer" />
      </ExperienceGroup>,
    );
    const hoverMedia = property =>
      mediaDeclaringStyle({ element: screen.getByRole('article'), property, pseudo: ':hover' });

    expect(hoverMedia('transform')).toEqual([`${HOVER_POINTER_QUERY} and ${FULL_MOTION_QUERY}`]);
    expect(hoverMedia('box-shadow')).toEqual([HOVER_POINTER_QUERY]);
  });

  it('shows each role in an article, under its level 3 heading', () => {
    render(
      <ExperienceGroup entityName="Sewan Groupe">
        <ExperienceGroup.Role jobName="Lead Frontend Engineer" />
        <ExperienceGroup.Role jobName="Senior Full-Stack Engineer" />
      </ExperienceGroup>,
    );
    const articles = screen.getAllByRole('article');

    expect(articles).toHaveLength(2);
    expect(articles.map(article => within(article).getByRole('heading').textContent)).toEqual([
      'Lead Frontend Engineer',
      'Senior Full-Stack Engineer',
    ]);
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(2);
  });

  it('marks the job title of each role with its own language', () => {
    render(
      <ExperienceGroup entityName="Sewan Groupe">
        <ExperienceGroup.Role
          jobName="Lead Frontend Engineer"
          jobNameLanguage="en"
        />
        <ExperienceGroup.Role jobName="Développeur React.js" />
      </ExperienceGroup>,
    );
    const [english, french] = screen.getAllByRole('heading', { level: 3 });

    expect(english).toHaveAttribute('lang', 'en');
    expect(french).not.toHaveAttribute('lang');
  });

  it('reads the period of a role once in its column and once in its card, each one for its screens', () => {
    render(
      <ExperienceGroup entityName="Sewan Groupe">
        <ExperienceGroup.Role
          jobName="Lead Frontend Engineer"
          startDate="août 2021"
          endDate="Aujourd’hui"
        />
      </ExperienceGroup>,
    );
    const role = within(screen.getByRole('list')).getByRole('listitem');
    const [column, card] = role.children;

    expect(getReadText(column)).toBe('août 2021 à Aujourd’hui');
    expect(getReadText(card)).toContain('août 2021 à Aujourd’hui');
  });

  it('lists the technologies of a role after its description', () => {
    render(
      <ExperienceGroup entityName="Sewan Groupe">
        <ExperienceGroup.Role
          jobName="Lead Frontend Engineer"
          technologies={['React.js', 'Storybook']}
        >
          Description du rôle
        </ExperienceGroup.Role>
      </ExperienceGroup>,
    );
    const card = screen.getByRole('article');
    const details = screen.getByText('Description du rôle');
    const technologies = within(card).getByRole('list');

    expect(
      within(technologies)
        .getAllByRole('listitem')
        .map(({ textContent }) => textContent),
    ).toEqual(['React.js', 'Storybook']);
    expect(details.compareDocumentPosition(technologies)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });

  it('lists no technologies for a role without them', () => {
    render(
      <ExperienceGroup entityName="Sewan Groupe">
        <ExperienceGroup.Role jobName="Lead Frontend Engineer" />
      </ExperienceGroup>,
    );

    expect(within(screen.getByRole('article')).queryByRole('list')).not.toBeInTheDocument();
  });

  it("shows a role's duration in the active language", async () => {
    render(
      <ExperienceGroup entityName="Sewan Groupe">
        <ExperienceGroup.Role
          startDate="juin 2021"
          endDate="sept. 2022"
        />
      </ExperienceGroup>,
    );
    expect(screen.getByText('1 an 4 mois')).toBeInTheDocument();

    await act(() => i18n.changeLanguage('en'));

    expect(screen.getByText('1 year 4 months')).toBeInTheDocument();
  });

  it.each(['fr', 'en'])(
    'omits the duration of a role with an invalid date in %s',
    async language => {
      await act(() => i18n.changeLanguage(language));
      render(
        <ExperienceGroup entityName="Sewan Groupe">
          <ExperienceGroup.Role
            startDate="juin 2021"
            endDate="foo 2022"
          />
        </ExperienceGroup>,
      );

      expect(screen.queryByText(DURATION_TEXT)).not.toBeInTheDocument();
    },
  );

  it('names the pseudo-element of the dots of the group and its roles for the browser test of the timeline', () => {
    const { container } = render(
      <ExperienceGroup entityName="Sewan Groupe">
        <ExperienceGroup.Role jobName="Lead Frontend Engineer" />
        <ExperienceGroup.Role jobName="Senior Frontend Engineer" />
      </ExperienceGroup>,
    );

    expect(container.firstChild).toHaveAttribute('data-timeline-dot', 'before');
    const roles = within(screen.getByRole('list')).getAllByRole('listitem');
    expect(roles).toHaveLength(2);
    roles.forEach(role => expect(role).toHaveAttribute('data-timeline-dot', 'before'));
  });

  it('renders a role without any props', () => {
    expect(() => render(<ExperienceGroup.Role />)).not.toThrow();
  });

  it('renders a role outside a group with its period but no company summary', () => {
    render(
      <ExperienceGroup.Role
        jobName="Développeur"
        startDate="juin 2021"
        endDate="juin 2022"
      />,
    );

    expect(screen.getByText('juin 2021')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});
