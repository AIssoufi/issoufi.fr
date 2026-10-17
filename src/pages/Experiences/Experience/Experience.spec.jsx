import { render, screen } from '@testing-library/react';

import Experience from './Experience';

describe('Experience', () => {
  it('renders without any props', () => {
    expect(() => render(<Experience />)).not.toThrow();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('renders the job summary with the computed duration', () => {
    render(
      <Experience
        jobName="Full-Stack Engineer"
        entityName="Wibilong"
        entityLogoUrl="/wibilong.png"
        contractType="CDI"
        city="Paris (75)"
        startDate="sept. 2019"
        endDate="juin 2021"
      >
        Description du poste
      </Experience>,
    );

    expect(screen.getByText('Full-Stack Engineer')).toBeInTheDocument();
    expect(screen.getByText('Wibilong · CDI · Paris (75)')).toBeInTheDocument();
    expect(screen.getByText('1 an 9 mois')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Wibilong' })).toHaveAttribute('src', '/wibilong.png');
    expect(screen.getByText('Description du poste')).toBeInTheDocument();
  });

  it('omits the duration when a date is missing', () => {
    render(
      <Experience
        jobName="Développeur"
        startDate="sept. 2019"
      />,
    );

    expect(screen.queryByText(/\d+ (an|ans|mois)/)).not.toBeInTheDocument();
  });

  it('omits the duration when a date is invalid', () => {
    render(
      <Experience
        jobName="Développeur"
        startDate="foo 2019"
        endDate="juin 2021"
      />,
    );

    expect(screen.queryByText(/\d+ (an|ans|mois)|< 1 mois/)).not.toBeInTheDocument();
  });
});
