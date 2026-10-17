import { render, screen } from '@testing-library/react';

import ExperienceGroup from './ExperienceGroup';

describe('ExperienceGroup', () => {
  it('renders without any props', () => {
    expect(() => render(<ExperienceGroup />)).not.toThrow();
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
