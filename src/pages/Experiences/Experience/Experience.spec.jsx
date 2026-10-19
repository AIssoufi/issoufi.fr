import { act, render, screen, within } from '@testing-library/react';

import i18n from '../../../i18n';
import { declaredStyle, serializeCssValue } from '../../../styleTestUtils';
import { theme } from '../../../theme';
import Experience from './Experience';

/** Media query from which a job card shows two columns. */
const TWO_JOB_COLUMNS_MEDIA = `(min-width: ${theme.screens['two-job-columns']})`;

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

  it('lists the technologies of the job after its description, in the order of the page', () => {
    render(
      <Experience
        jobName="Full-Stack Engineer"
        technologies={['React.js', 'Node.js']}
      >
        Description du poste
      </Experience>,
    );
    const technologies = within(screen.getByRole('article')).getByRole('list');

    expect(
      within(technologies)
        .getAllByRole('listitem')
        .map(({ textContent }) => textContent),
    ).toEqual(['React.js', 'Node.js']);
    // Screen readers, and the narrow screens that stack the card, read them after the description
    expect(screen.getByText('Description du poste').compareDocumentPosition(technologies)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
  });

  it.each([
    ['an empty list', []],
    ['no list', undefined],
  ])('lists no technologies with %s', (_case, technologies) => {
    render(<Experience technologies={technologies}>Description du poste</Experience>);

    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('puts its summary and its technologies on the left of its description on a wide screen', () => {
    render(
      <Experience
        jobName="Full-Stack Engineer"
        technologies={['React.js']}
      >
        Description du poste
      </Experience>,
    );
    const wideStyle = ({ element, property }) =>
      declaredStyle({ element, property, media: TWO_JOB_COLUMNS_MEDIA });
    const details = screen.getByText('Description du poste');
    const technologies = screen.getByRole('list');

    expect(wideStyle({ element: screen.getByRole('article'), property: 'display' })).toBe('grid');
    // The description column is as wide as its lines, and the summary column takes the rest
    expect(
      wideStyle({ element: screen.getByRole('article'), property: 'grid-template-columns' }),
    ).toBe(
      serializeCssValue({
        property: 'grid-template-columns',
        value: `minmax(${theme.sizes[240]}, 1fr) auto`,
      }),
    );
    expect(wideStyle({ element: details, property: 'grid-column' })).toBe('2');
    // styled-components writes the slash without spaces
    expect(wideStyle({ element: details, property: 'grid-row' })).toMatch(/^1 ?\/ ?span 2$/);
    expect(wideStyle({ element: technologies, property: 'grid-column' })).toBe('1');
    expect(wideStyle({ element: technologies, property: 'grid-row' })).toBe('2');
  });

  it('keeps the lines of its description short on a wide screen only, where it has a column', () => {
    render(<Experience>Description du poste</Experience>);
    const details = screen.getByText('Description du poste');

    expect(
      declaredStyle({ element: details, property: 'max-width', media: TWO_JOB_COLUMNS_MEDIA }),
    ).toBe(theme.sizes['text-measure']);
    expect(declaredStyle({ element: details, property: 'max-width' })).toBe('');
  });

  it('renders the job summary with the computed duration', () => {
    render(
      <Experience
        jobName="Full-Stack Engineer"
        entityName="Wibilong"
        entityLogoUrl="/wibilong.webp"
        contractType="CDI"
        city="Paris (75)"
        startDate="sept. 2019"
        endDate="juin 2021"
      >
        Description du poste
      </Experience>,
    );

    expect(screen.getByRole('heading', { level: 3, name: 'Full-Stack Engineer' })).toBeVisible();
    expect(screen.getByText('Wibilong · CDI · Paris (75)')).toBeInTheDocument();
    expect(screen.getByText('1 an 9 mois')).toBeInTheDocument();
    expect(document.querySelector('img')).toHaveAttribute('src', '/wibilong.webp');
    expect(screen.getByText('Description du poste')).toBeInTheDocument();
  });

  it('marks the job title with the language it is written in', () => {
    render(
      <Experience
        jobName="Full-Stack JavaScript Engineer"
        jobNameLanguage="en"
      />,
    );

    expect(screen.getByRole('heading', { level: 3 })).toHaveAttribute('lang', 'en');
  });

  it('is an article holding the level 3 heading of the job', () => {
    render(<Experience jobName="Full-Stack Engineer" />);
    const article = screen.getByRole('article');

    expect(article).toContainElement(screen.getByRole('heading', { level: 3 }));
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
