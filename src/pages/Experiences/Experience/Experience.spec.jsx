import { act, render, screen } from '@testing-library/react';

import i18n from '../../../i18n';
import Experience from './Experience';

/** Any duration text, in French or in English. */
const DURATION_TEXT = /\d+ (an|ans|mois|years?|months?)|< 1 (mois|month)/;

describe('Experience', () => {
  afterEach(async () => {
    await act(() => i18n.changeLanguage('fr'));
  });

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

  it('shows the duration in the active language', async () => {
    render(
      <Experience
        startDate="sept. 2019"
        endDate="juin 2021"
      />,
    );
    expect(screen.getByText('1 an 9 mois')).toBeInTheDocument();

    await act(() => i18n.changeLanguage('en'));

    expect(screen.getByText('1 year 9 months')).toBeInTheDocument();
  });

  it('omits the duration when a date is missing', () => {
    render(
      <Experience
        jobName="Développeur"
        startDate="sept. 2019"
      />,
    );

    expect(screen.queryByText(DURATION_TEXT)).not.toBeInTheDocument();
  });

  it.each(['fr', 'en'])('omits the duration when a date is invalid in %s', async language => {
    await act(() => i18n.changeLanguage(language));
    render(
      <Experience
        jobName="Développeur"
        startDate="foo 2019"
        endDate="juin 2021"
      />,
    );

    expect(screen.queryByText(DURATION_TEXT)).not.toBeInTheDocument();
  });
});
