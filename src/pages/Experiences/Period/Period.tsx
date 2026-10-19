import { useTranslation } from 'react-i18next';

import VisuallyHidden from '../../../components/VisuallyHidden/index.ts';
import { COLUMN_PERIOD_MARK, DEFAULT_PERIOD_VARIANT, INLINE_PERIOD_MARK } from './constants.ts';
import {
  End,
  InlineEnd,
  InlineSeparator,
  InlineStart,
  RoleEnd,
  RoleSeparator,
  RoleStart,
  Separator,
  Start,
} from './Period.styled.ts';
import type { PeriodVariant } from './types.ts';
import { isPeriodVariant } from './utils.ts';

/** Styled parts of each look of a period, with the mark that the screen shows between its dates. */
const PERIOD_PARTS = {
  job: { Start, Separator, End, mark: COLUMN_PERIOD_MARK },
  role: { Start: RoleStart, Separator: RoleSeparator, End: RoleEnd, mark: COLUMN_PERIOD_MARK },
  inline: {
    Start: InlineStart,
    Separator: InlineSeparator,
    End: InlineEnd,
    mark: INLINE_PERIOD_MARK,
  },
} satisfies Record<PeriodVariant, unknown>;

/** Props of {@link Period}. Every part is optional and is not rendered when missing. */
interface PeriodProps {
  /** Start of the period, already translated, e.g. "sept. 2019". */
  start?: string;
  /** End of the period in the same format, or "Aujourd’hui" / "Present". */
  end?: string;
  /**
   * Look of the period: `'job'` for the period column of a job, its dates stacked under each
   * other, `'role'` for the dimmer one of several roles at the same company, or
   * `'inline'` for the colors of a job on one line, sized by its parent, with a dash rather
   * than an arrow. Any other value falls back to `'job'`.
   * @default 'job'
   */
  variant?: PeriodVariant;
}

/**
 * Start and end of a job, without a wrapping element: its parent lays them out, in a column or
 * on a line. Between two dates the screen shows a mark, an arrow or a dash, that screen readers
 * skip, and they read the `exp.periodTo` word in its place: "août 2021 à Aujourd’hui". A missing
 * date is left out, with the mark and the word. Shared by `TimelinePeriod`, the period column of
 * the desktop timeline, and `JobSummary`, which shows the period in the header of the card below
 * the tablet breakpoint.
 *
 * @example
 * // In a flex column, as the one of TimelinePeriod, the dates stack under each other
 * <Column>
 *   <Period start="sept. 2019" end="juin 2021" />
 * </Column>
 *
 * @example
 * <Period variant="inline" start="août 2021" end="Aujourd’hui" />
 */
const Period = ({ start, end, variant }: PeriodProps) => {
  const { t } = useTranslation();
  const periodVariant = isPeriodVariant(variant) ? variant : DEFAULT_PERIOD_VARIANT;
  const parts = PERIOD_PARTS[periodVariant];
  const hasStart = Boolean(start);
  const hasEnd = Boolean(end);
  const hasBothDates = hasStart && hasEnd;

  // The spaces around the mark separate the words read aloud, and the dates of an inline period
  return (
    <>
      {hasStart && <parts.Start>{start}</parts.Start>}
      {hasBothDates && (
        <>
          {' '}
          <parts.Separator aria-hidden="true">{parts.mark}</parts.Separator>
          <VisuallyHidden>{t('exp.periodTo')}</VisuallyHidden>{' '}
        </>
      )}
      {hasEnd && <parts.End>{end}</parts.End>}
    </>
  );
};

export default Period;
