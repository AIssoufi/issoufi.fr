import { render, screen } from '@testing-library/react';

import TimelinePeriod from './TimelinePeriod';

/** Color of the start of a job's period, and of a role's dimmer one. */
const JOB_START_COLOR = 'rgba(212, 160, 192, 0.95)';
const ROLE_START_COLOR = 'rgba(212, 160, 192, 0.85)';

describe('TimelinePeriod', () => {
  it('renders an empty column without any props', () => {
    const { container } = render(<TimelinePeriod />);

    expect(container.firstChild).toBeInTheDocument();
    expect(container.textContent).toBe('');
  });

  it('names the pseudo-element of its dot for the browser test of the timeline', () => {
    const { container } = render(<TimelinePeriod />);

    expect(container.firstChild).toHaveAttribute('data-timeline-dot', 'after');
  });

  it('renders the start, an arrow and the end, in this order', () => {
    const { container } = render(
      <TimelinePeriod
        start="Sept. 2019"
        end="Juin 2021"
      />,
    );

    expect(container.textContent).toBe('Sept. 2019↓Juin 2021');
  });

  it.each([
    ['only a start', { start: 'Sept. 2019' }, 'Sept. 2019'],
    ['only an end', { end: "Aujourd'hui" }, "Aujourd'hui"],
    ['an empty start', { start: '', end: 'Juin 2021' }, 'Juin 2021'],
    ['an empty end', { start: 'Sept. 2019', end: '' }, 'Sept. 2019'],
    ['empty dates', { start: '', end: '' }, ''],
    ['null dates', { start: null, end: null }, ''],
    ['falsy dates of the wrong type', { start: 0, end: NaN }, ''],
  ])('omits the arrow and the missing date with %s', (_, dates, expected) => {
    const { container } = render(<TimelinePeriod {...dates} />);

    expect(container.textContent).toBe(expected);
  });

  it('shows dates of another type as text', () => {
    const { container } = render(
      <TimelinePeriod
        start={2019}
        end={2021}
      />,
    );

    expect(container.textContent).toBe('2019↓2021');
  });

  describe('variant', () => {
    it.each([
      ['job', JOB_START_COLOR],
      ['role', ROLE_START_COLOR],
      ['unknown', JOB_START_COLOR],
      ['', JOB_START_COLOR],
    ])('colors the start of the %j variant in %s', (variant, color) => {
      render(
        <TimelinePeriod
          variant={variant}
          start="juin 2021"
          end="Aujourd'hui"
        />,
      );

      expect(screen.getByText('juin 2021')).toHaveStyle({ color });
      expect(screen.getByText('↓')).toBeInTheDocument();
    });

    it('renders the period of a job by default', () => {
      render(<TimelinePeriod start="Sept. 2019" />);

      expect(screen.getByText('Sept. 2019')).toHaveStyle({ color: JOB_START_COLOR });
    });
  });
});
