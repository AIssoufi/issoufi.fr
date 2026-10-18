import {
  Column,
  End,
  RoleColumn,
  RoleEnd,
  RoleSeparator,
  RoleStart,
  Separator,
  Start,
} from './TimelinePeriod.styled';

/** Styled parts of a job's period. */
const JOB_PARTS = { Column, Start, Separator, End };

/** Styled parts of a role's period, smaller and dimmer than a job's. */
const ROLE_PARTS = { Column: RoleColumn, Start: RoleStart, Separator: RoleSeparator, End: RoleEnd };

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
 * against the timeline line, and the row's dot on that line. On mobile it is hidden and the row's
 * card takes the full width. The arrow is shown only between two dates. Shared by the job rows of
 * the `Experiences` page and the roles of `ExperienceGroup`.
 *
 * @example
 * <TimelinePeriod start="Sept. 2019" end="Juin 2021" />
 * <TimelinePeriod variant="role" start="juin 2021" end="Aujourd'hui" />
 */
const TimelinePeriod = ({ start, end, variant = 'job' }: TimelinePeriodProps) => {
  const parts = variant === 'role' ? ROLE_PARTS : JOB_PARTS;
  const hasStart = Boolean(start);
  const hasEnd = Boolean(end);
  const hasBothDates = hasStart && hasEnd;

  return (
    <parts.Column>
      {hasStart && <parts.Start>{start}</parts.Start>}
      {hasBothDates && <parts.Separator>↓</parts.Separator>}
      {hasEnd && <parts.End>{end}</parts.End>}
    </parts.Column>
  );
};

export default TimelinePeriod;
