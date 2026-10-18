import Period from '../Period';
import { Column, RoleColumn } from './TimelinePeriod.styled';

/** Props of {@link TimelinePeriod}. Every part is optional and is not rendered when missing. */
interface TimelinePeriodProps {
  /** Start of the period, already translated, e.g. "Sept. 2019". */
  start?: string;
  /** End of the period in the same format, or "Aujourd'hui" / "Present". */
  end?: string;
  /**
   * Look of the period: `'job'` for a job's row, or `'role'` for one of several roles at the
   * same company, smaller and dimmer. Any other value falls back to `'job'`.
   * @default 'job'
   */
  variant?: 'job' | 'role';
}

/**
 * Period column of a timeline row, on desktop only: the start, an arrow and the end, aligned
 * against the timeline line, and the row's dot on that line. Screen readers skip the arrow and
 * read "août 2021 à Aujourd’hui" (see {@link Period}). Below the tablet breakpoint it is hidden,
 * from screen readers too, and the header of the row's card shows the period instead. Shared by
 * the job rows of the `Experiences` page and the roles of `ExperienceGroup`.
 *
 * @example
 * <TimelinePeriod start="Sept. 2019" end="Juin 2021" />
 * <TimelinePeriod variant="role" start="juin 2021" end="Aujourd'hui" />
 */
const TimelinePeriod = ({ start, end, variant = 'job' }: TimelinePeriodProps) => {
  const isRole = variant === 'role';
  const PeriodColumn = isRole ? RoleColumn : Column;

  return (
    <PeriodColumn data-timeline-dot="after">
      <Period
        start={start}
        end={end}
        variant={isRole ? 'role' : 'job'}
      />
    </PeriodColumn>
  );
};

export default TimelinePeriod;
