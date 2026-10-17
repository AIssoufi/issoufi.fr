import { useTranslation } from 'react-i18next';

import { computeDuration, formatDuration } from '../utils/duration';

import {
  EntityLogo,
  JobDetails,
  JobDuration,
  JobInfo,
  JobName,
  RoleName,
  Summary,
} from './JobSummary.styled';

/** Props of {@link JobSummary}. Every part is optional and is not rendered when missing. */
interface JobSummaryProps {
  /** Job title, already translated. */
  jobName?: string;
  /** Company name, also used as the logo's alt text, which stays empty when it is missing. */
  entityName?: string;
  /** Absolute URL of the company logo, e.g. `/wibilong.png`. No logo when missing. */
  entityLogoUrl?: string;
  /** Contract type, e.g. "CDI" or "Alternance". */
  contractType?: string;
  /** City and department, e.g. "Paris (75)". */
  city?: string;
  /**
   * Start of the job as a month and a year, e.g. "sept. 2019" or "Sept. 2019".
   * The duration is shown, in the active language, only when both dates are valid.
   */
  startDate?: string;
  /** End of the job in the same format as `startDate`, or "Aujourd'hui" / "Present". */
  endDate?: string;
  /**
   * Look of the job title: `'job'` for a job card, as a `h2`, or `'role'` for one of several
   * roles at the same company, as a smaller `h3`. Any other value falls back to `'job'`.
   * @default 'job'
   */
  variant?: 'job' | 'role';
}

/**
 * Header of a job: company logo, job title, company details joined with " · " and the
 * duration computed from the dates, in the active language. Shared by `Experience` and
 * `ExperienceGroup.Role`, which add the description below it.
 *
 * @example
 * <JobSummary
 *   jobName="Lead Frontend Engineer"
 *   entityName="Sewan Groupe"
 *   entityLogoUrl="/sewan.png"
 *   startDate="août 2021"
 *   endDate="Aujourd'hui"
 *   variant="role"
 * />
 */
const JobSummary = ({
  jobName,
  entityName,
  entityLogoUrl,
  contractType,
  city,
  startDate,
  endDate,
  variant = 'job',
}: JobSummaryProps) => {
  const { t } = useTranslation();
  const details = [entityName, contractType, city].filter(Boolean).join(' · ');
  const duration = formatDuration({ duration: computeDuration({ startDate, endDate }), t });
  const Title = variant === 'role' ? RoleName : JobName;

  return (
    <Summary>
      {entityLogoUrl && (
        <EntityLogo
          src={entityLogoUrl}
          alt={entityName ?? ''}
        />
      )}
      <JobInfo>
        {jobName && <Title>{jobName}</Title>}
        {details && <JobDetails>{details}</JobDetails>}
        {duration && <JobDuration>{duration}</JobDuration>}
      </JobInfo>
    </Summary>
  );
};

export default JobSummary;
