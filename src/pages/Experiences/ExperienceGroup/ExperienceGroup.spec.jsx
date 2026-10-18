import { act, render, screen, within } from '@testing-library/react';

import i18n from '../../../i18n';
import ExperienceGroup from './ExperienceGroup';

/** Any duration text, in French or in English. */
const DURATION_TEXT = /\d+ (an|ans|mois|years?|months?)|< 1 (mois|month)/;

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
        entityLogoUrl="/sewan.png"
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
    expect(screen.getByText('2 ans')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Sewan Groupe' })).toHaveAttribute('src', '/sewan.png');
    expect(screen.getByText("Owner de l'UI Kit")).toBeInTheDocument();
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
    expect(screen.getByText('1 an 3 mois')).toBeInTheDocument();

    await act(() => i18n.changeLanguage('en'));

    expect(screen.getByText('1 year 3 months')).toBeInTheDocument();
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
