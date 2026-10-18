import { act, render, screen } from '@testing-library/react';

import i18n from '../../../i18n';
import { getReadText } from '../../testUtils';
import Period from './Period';

/** Color of the start of a job's period, and of a role's dimmer one. */
const JOB_START_COLOR = 'rgba(212, 160, 192, 0.95)';
const ROLE_START_COLOR = 'rgba(212, 160, 192, 0.85)';

/** Renders a period in a paragraph, which stands for the element its parent lays it out in. */
const renderPeriod = props =>
  render(
    <p data-testid="period">
      <Period {...props} />
    </p>,
  );

const getPeriod = () => screen.getByTestId('period');

describe('Period', () => {
  afterEach(async () => {
    await act(() => i18n.changeLanguage('fr'));
  });

  it('renders nothing without any props', () => {
    renderPeriod();

    expect(getPeriod()).toBeEmptyDOMElement();
  });

  it('shows the start, an arrow and the end, in this order', () => {
    renderPeriod({ start: 'août 2021', end: 'Aujourd’hui' });

    const texts = [...getPeriod().children].map(part => part.textContent);
    expect(texts).toEqual(['août 2021', '↓', 'à', 'Aujourd’hui']);
  });

  it('hides the arrow from screen readers, which read "à" in its place', () => {
    renderPeriod({ start: 'août 2021', end: 'Aujourd’hui' });

    expect(screen.getByText('↓')).toHaveAttribute('aria-hidden', 'true');
    expect(getReadText(getPeriod())).toBe('août 2021 à Aujourd’hui');
  });

  it('hides the word "à" from the screen, out of the flow of the dates', () => {
    renderPeriod({ start: 'août 2021', end: 'Aujourd’hui' });

    expect(screen.getByText('à')).toHaveStyle({ position: 'absolute', clipPath: 'inset(50%)' });
  });

  it('reads the word of the active language', async () => {
    renderPeriod({ start: 'Aug. 2021', end: 'Present' });

    await act(() => i18n.changeLanguage('en'));

    expect(getReadText(getPeriod())).toBe('Aug. 2021 to Present');
  });

  it.each([
    ['only a start', { start: 'sept. 2019' }, 'sept. 2019'],
    ['only an end', { end: 'Aujourd’hui' }, 'Aujourd’hui'],
    ['an empty start', { start: '', end: 'juin 2021' }, 'juin 2021'],
    ['an empty end', { start: 'sept. 2019', end: '' }, 'sept. 2019'],
    ['empty dates', { start: '', end: '' }, ''],
    ['null dates', { start: null, end: null }, ''],
    ['falsy dates of the wrong type', { start: 0, end: NaN }, ''],
  ])('leaves out the arrow, the word and the missing date with %s', (_, dates, expected) => {
    renderPeriod(dates);

    expect(getPeriod().textContent).toBe(expected);
    expect(getReadText(getPeriod())).toBe(expected);
  });

  it('shows dates of another type as text', () => {
    renderPeriod({ start: 2019, end: 2021 });

    expect(getReadText(getPeriod())).toBe('2019 à 2021');
  });

  describe('variant', () => {
    it.each([
      ['job', '↓', JOB_START_COLOR],
      ['role', '↓', ROLE_START_COLOR],
      ['inline', '–', JOB_START_COLOR],
      ['unknown', '↓', JOB_START_COLOR],
      ['', '↓', JOB_START_COLOR],
      ['toString', '↓', JOB_START_COLOR],
      [null, '↓', JOB_START_COLOR],
    ])('draws the %j variant with a %s and colors its start in %s', (variant, mark, color) => {
      renderPeriod({ variant, start: 'juin 2021', end: 'Aujourd’hui' });

      expect(screen.getByText('juin 2021')).toHaveStyle({ color });
      expect(screen.getByText(mark)).toHaveAttribute('aria-hidden', 'true');
      expect(getReadText(getPeriod())).toBe('juin 2021 à Aujourd’hui');
    });

    it('draws the period of a job by default', () => {
      renderPeriod({ start: 'sept. 2019', end: 'juin 2021' });

      expect(screen.getByText('sept. 2019')).toHaveStyle({ color: JOB_START_COLOR });
      expect(screen.getByText('↓')).toBeInTheDocument();
    });

    it('keeps the dates of an inline period whole, breaking the line only around the dash', () => {
      renderPeriod({ variant: 'inline', start: 'sept. 2019', end: 'juin 2021' });

      expect(screen.getByText('sept. 2019')).toHaveStyle({ whiteSpace: 'nowrap' });
      expect(screen.getByText('juin 2021')).toHaveStyle({ whiteSpace: 'nowrap' });
      expect(getPeriod().textContent).toBe('sept. 2019 –à juin 2021');
    });
  });
});
