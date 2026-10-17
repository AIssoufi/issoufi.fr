import { act, render, screen } from '@testing-library/react';

import i18n from '../../../i18n';
import JobSummary from './JobSummary';

/** Any duration text, in French or in English. */
const DURATION_TEXT = /\d+ (an|ans|mois|years?|months?)|< 1 (mois|month)/;

/** Texts that must never reach the screen. */
const BROKEN_TEXT = /undefined|null|NaN|Invalid Date/;

describe('JobSummary', () => {
  afterEach(async () => {
    await act(() => i18n.changeLanguage('fr'));
  });

  it('renders without any props', () => {
    const { container } = render(<JobSummary />);

    expect(container.querySelector('header')).toBeInTheDocument();
    expect(container.querySelector('img')).not.toBeInTheDocument();
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    expect(container.textContent).toBe('');
  });

  it('renders the logo, job title, company details and computed duration', () => {
    render(
      <JobSummary
        jobName="Full-Stack Engineer"
        entityName="Wibilong"
        entityLogoUrl="/wibilong.png"
        contractType="CDI"
        city="Paris (75)"
        startDate="sept. 2019"
        endDate="juin 2021"
      />,
    );

    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Full-Stack Engineer');
    expect(screen.getByText('Wibilong · CDI · Paris (75)')).toBeInTheDocument();
    expect(screen.getByText('1 an 9 mois')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Wibilong' })).toHaveAttribute('src', '/wibilong.png');
  });

  describe('variant', () => {
    it.each([
      ['job', 2],
      ['role', 3],
      ['unknown', 2],
      ['', 2],
    ])('renders the job title of the %j variant as a level %i heading', (variant, level) => {
      render(
        <JobSummary
          jobName="Lead Frontend Engineer"
          variant={variant}
        />,
      );

      expect(screen.getByRole('heading', { level })).toHaveTextContent('Lead Frontend Engineer');
    });

    it('renders the job title as a level 2 heading by default', () => {
      render(<JobSummary jobName="Lead Frontend Engineer" />);

      expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
    });
  });

  describe('company details', () => {
    it.each([
      [{ entityName: 'Wibilong' }, 'Wibilong'],
      [{ contractType: 'CDI' }, 'CDI'],
      [{ entityName: 'Sewan Groupe', city: 'Paris (75)' }, 'Sewan Groupe · Paris (75)'],
      [{ entityName: '', contractType: 'CDI', city: 'Paris (75)' }, 'CDI · Paris (75)'],
    ])('joins only the given parts of %j', (props, expected) => {
      render(<JobSummary {...props} />);

      expect(screen.getByText(expected)).toBeInTheDocument();
    });

    it('omits the details when every part is empty', () => {
      const { container } = render(
        <JobSummary
          entityName=""
          contractType=""
          city=""
        />,
      );

      expect(container.textContent).toBe('');
    });
  });

  describe('logo', () => {
    it('gives the logo an empty alt text when the company name is missing', () => {
      const { container } = render(<JobSummary entityLogoUrl="/sewan.png" />);

      expect(container.querySelector('img')).toHaveAttribute('alt', '');
    });

    it('omits the logo when its URL is empty', () => {
      const { container } = render(
        <JobSummary
          entityName="Wibilong"
          entityLogoUrl=""
        />,
      );

      expect(container.querySelector('img')).not.toBeInTheDocument();
    });
  });

  it('omits the job title when it is empty', () => {
    render(<JobSummary jobName="" />);

    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });

  describe('duration', () => {
    it('shows the duration in the active language', async () => {
      render(
        <JobSummary
          startDate="sept. 2019"
          endDate="juin 2021"
        />,
      );
      expect(screen.getByText('1 an 9 mois')).toBeInTheDocument();

      await act(() => i18n.changeLanguage('en'));

      expect(screen.getByText('1 year 9 months')).toBeInTheDocument();
    });

    it.each([
      ['a missing start date', { endDate: 'juin 2021' }],
      ['a missing end date', { startDate: 'sept. 2019' }],
      ['an invalid start date', { startDate: 'foo 2019', endDate: 'juin 2021' }],
      ['an invalid end date', { startDate: 'sept. 2019', endDate: '31/02/2021' }],
      ['an end before the start', { startDate: 'juin 2021', endDate: 'sept. 2019' }],
      ['dates of the wrong type', { startDate: 2019, endDate: null }],
    ])('omits the duration with %s', (_, dates) => {
      const { container } = render(
        <JobSummary
          jobName="Développeur"
          {...dates}
        />,
      );

      expect(screen.queryByText(DURATION_TEXT)).not.toBeInTheDocument();
      expect(container).not.toHaveTextContent(BROKEN_TEXT);
    });

    it.each(['fr', 'en'])('omits the duration of an invalid date in %s', async language => {
      await act(() => i18n.changeLanguage(language));
      render(
        <JobSummary
          startDate="foo 2019"
          endDate="juin 2021"
        />,
      );

      expect(screen.queryByText(DURATION_TEXT)).not.toBeInTheDocument();
    });
  });
});
