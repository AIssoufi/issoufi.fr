import { act, render, screen } from '@testing-library/react';

import i18n from '../../../i18n';
import { declaredStyle } from '../../../styleTestUtils';
import { theme } from '../../../theme/theme';
import { getReadText } from '../../testUtils';
import JobSummary from './JobSummary';

/** Any duration text, in French or in English. */
const DURATION_TEXT = /\d+ (an|ans|mois|years?|months?)|< 1 (mois|month)/;

/** Texts that must never reach the screen. */
const BROKEN_TEXT = /undefined|null|NaN|Invalid Date/;

/** Media query from which the desktop layout, with the period column of the timeline, is used. */
const TABLET_MEDIA = `(min-width: ${theme.screens.tablet})`;

/** The element that holds the period of the header, from the text of its start. */
const getPeriod = start => screen.getByText(start).parentElement;

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

    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Full-Stack Engineer');
    expect(screen.getByText('Wibilong · CDI · Paris (75)')).toBeInTheDocument();
    expect(getReadText(getPeriod('sept. 2019'))).toBe('sept. 2019 à juin 2021');
    expect(screen.getByText('1 an 9 mois')).toBeInTheDocument();
    expect(document.querySelector('img')).toHaveAttribute('src', '/wibilong.png');
  });

  describe('variant', () => {
    it.each([
      ['job', theme.fontSizes[15]],
      ['role', theme.fontSizes[14]],
      ['unknown', theme.fontSizes[15]],
      ['', theme.fontSizes[15]],
    ])(
      'renders the job title of the %j variant as a level 3 heading, in %s',
      (variant, fontSize) => {
        render(
          <JobSummary
            jobName="Lead Frontend Engineer"
            variant={variant}
          />,
        );

        const title = screen.getByRole('heading', { level: 3 });
        expect(title).toHaveTextContent('Lead Frontend Engineer');
        expect(title).toHaveStyle({ fontSize });
      },
    );

    it('renders the job title as a level 3 heading, under the level 2 one of its company, by default', () => {
      render(<JobSummary jobName="Lead Frontend Engineer" />);

      expect(screen.getByRole('heading', { level: 3 })).toHaveStyle({
        fontSize: theme.fontSizes[15],
      });
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
    it.each(['Sewan Groupe', '', undefined, null])(
      'gives the logo an empty alt text, since the company name %j is written next to it',
      entityName => {
        const { container } = render(
          <JobSummary
            entityName={entityName}
            entityLogoUrl="/sewan.png"
          />,
        );

        expect(container.querySelector('img')).toHaveAttribute('alt', '');
        expect(screen.queryByRole('img')).not.toBeInTheDocument();
      },
    );

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

  describe('period', () => {
    it('shows the start, a dash and the end, read "à" in place of the dash', () => {
      render(
        <JobSummary
          startDate="août 2021"
          endDate="Aujourd’hui"
        />,
      );
      const period = getPeriod('août 2021');

      expect(period).toHaveTextContent(/^août 2021 –à Aujourd’hui$/);
      expect(screen.getByText('–')).toHaveAttribute('aria-hidden', 'true');
      expect(getReadText(period)).toBe('août 2021 à Aujourd’hui');
    });

    it('reads the period in the active language', async () => {
      render(
        <JobSummary
          startDate="Aug. 2021"
          endDate="Present"
        />,
      );

      await act(() => i18n.changeLanguage('en'));

      expect(getReadText(getPeriod('Aug. 2021'))).toBe('Aug. 2021 to Present');
    });

    it('shows the period below the tablet breakpoint only, where the timeline hides its own', () => {
      render(
        <JobSummary
          startDate="sept. 2019"
          endDate="juin 2021"
        />,
      );
      const period = getPeriod('sept. 2019');

      expect(declaredStyle({ element: period, property: 'display' })).toBe('');
      expect(declaredStyle({ element: period, property: 'display', media: TABLET_MEDIA })).toBe(
        'none',
      );
    });

    it('shows the period before the duration, on the same line', () => {
      render(
        <JobSummary
          startDate="sept. 2019"
          endDate="juin 2021"
        />,
      );
      const period = getPeriod('sept. 2019');
      const timing = period.parentElement;

      expect(timing.children).toHaveLength(2);
      expect(timing.lastElementChild).toHaveTextContent('1 an 9 mois');
      expect(timing).toHaveStyle({ display: 'flex', flexWrap: 'wrap' });
    });

    it.each([
      ['a missing start date', { endDate: 'juin 2021' }, 'juin 2021'],
      ['a missing end date', { startDate: 'sept. 2019' }, 'sept. 2019'],
      [
        'an invalid start date',
        { startDate: 'foo 2019', endDate: 'juin 2021' },
        'foo 2019 à juin 2021',
      ],
    ])('shows the dates it has with %s, without a duration', (_, dates, expected) => {
      const { container } = render(<JobSummary {...dates} />);

      expect(getReadText(container.firstChild)).toBe(expected);
      expect(screen.queryByText(DURATION_TEXT)).not.toBeInTheDocument();
    });

    it.each([
      ['no dates', {}],
      ['empty dates', { startDate: '', endDate: '' }],
      ['null dates', { startDate: null, endDate: null }],
    ])('leaves out the period and the duration with %s', (_, dates) => {
      const { container } = render(
        <JobSummary
          jobName="Développeur"
          {...dates}
        />,
      );

      expect(container.textContent).toBe('Développeur');
      expect(screen.getByRole('heading').nextElementSibling).toBeNull();
    });
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
