import { useTranslation } from 'react-i18next';

import { isLanguage } from '../../../i18n/utils.ts';
import Period from '../Period/index.ts';
import { computeDuration, formatDuration } from '../utils/duration.ts';

import { LOGO_SIZE_PX } from './constants.ts';
import { useToday } from './hooks/useToday/index.ts';

import {
  EntityLogo,
  JobDetails,
  JobDuration,
  JobInfo,
  JobName,
  JobPeriod,
  JobTiming,
  RoleName,
  Summary,
} from './JobSummary.styled.ts';

/** Props of {@link JobSummary}. Every part is optional and is not rendered when missing. */
interface JobSummaryProps {
  /** Job title, already translated. */
  jobName?: string;
  /**
   * Language of the job title when it differs from the language of the page, such as `en` for a
   * title kept in English on the French page: the title gets it as its `lang`, so that a screen
   * reader reads it in that language. A value that is not a language of the site is ignored.
   */
  jobNameLanguage?: string;
  /** Company name, written first in the company details. */
  entityName?: string;
  /**
   * Absolute URL of the company logo, e.g. `/wibilong.webp`, a square file of twice the size that
   * it shows at, {@link LOGO_SIZE_PX}. No logo when missing. The logo is decorative, with an empty
   * alt text, since the company name is written next to it.
   */
  entityLogoUrl?: string;
  /** Contract type, e.g. "CDI" or "Alternance". */
  contractType?: string;
  /** City and department, e.g. "Paris (75)". */
  city?: string;
  /**
   * Start of the job as a month and a year, e.g. "sept. 2019" or "Sept. 2019", shown below the
   * tablet breakpoint, where the timeline hides its period column. The duration is shown, in the
   * active language, only when both dates are valid.
   */
  startDate?: string;
  /**
   * End of the job in the same format as `startDate`, or "Aujourd'hui" / "Present", shown with
   * it below the tablet breakpoint.
   */
  endDate?: string;
  /**
   * Look of the job title, a `h3` under the `h2` of its company either way: `'job'` for a job
   * card, or `'role'` for one of several roles at the same company, smaller. Any other value
   * falls back to `'job'`.
   * @default 'job'
   */
  variant?: 'job' | 'role';
}

/**
 * Header of a job: company logo, job title, in its own language when it is not the one of the page
 * (`jobNameLanguage`), company details joined with " · ", then the period, below the tablet
 * breakpoint only, and the duration computed from the dates, in the active language, up to the
 * month of the build for an ongoing job in the page that it renders (see {@link useToday}). From
 * the tablet breakpoint, the period column of the timeline shows the period instead, so that it is
 * shown, and read, once. Shared by `Experience` and `ExperienceGroup.Role`, which add the
 * description below it.
 *
 * @example
 * <JobSummary
 *   jobName="Lead Frontend Engineer"
 *   jobNameLanguage="en"
 *   entityName="Sewan Groupe"
 *   entityLogoUrl="/sewan.webp"
 *   startDate="août 2021"
 *   endDate="Aujourd'hui"
 *   variant="role"
 * />
 */
const JobSummary = ({
  jobName,
  jobNameLanguage,
  entityName,
  entityLogoUrl,
  contractType,
  city,
  startDate,
  endDate,
  variant = 'job',
}: JobSummaryProps) => {
  const { t } = useTranslation();
  const today = useToday();
  const details = [entityName, contractType, city].filter(Boolean).join(' · ');
  const duration = formatDuration({ duration: computeDuration({ startDate, endDate, today }), t });
  const Title = variant === 'role' ? RoleName : JobName;
  // A language that the site does not know would give screen readers a wrong `lang`
  const titleLanguage = isLanguage(jobNameLanguage) ? jobNameLanguage : undefined;
  const hasPeriod = Boolean(startDate) || Boolean(endDate);
  const hasTiming = hasPeriod || Boolean(duration);

  return (
    <Summary>
      {entityLogoUrl && (
        <EntityLogo
          src={entityLogoUrl}
          alt=""
          width={LOGO_SIZE_PX}
          height={LOGO_SIZE_PX}
        />
      )}
      <JobInfo>
        {jobName && <Title lang={titleLanguage}>{jobName}</Title>}
        {details && <JobDetails>{details}</JobDetails>}
        {hasTiming && (
          <JobTiming>
            {hasPeriod && (
              <JobPeriod>
                <Period
                  variant="inline"
                  start={startDate}
                  end={endDate}
                />
              </JobPeriod>
            )}
            {duration && <JobDuration>{duration}</JobDuration>}
          </JobTiming>
        )}
      </JobInfo>
    </Summary>
  );
};

export default JobSummary;
