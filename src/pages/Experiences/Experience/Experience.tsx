import { useTranslation } from 'react-i18next';

import Project from '../Project';
import Technologies from '../Technologies';
import { computeDuration, formatDuration } from '../utils/duration';

import {
  Article,
  Details,
  EntityLogo,
  JobDetails,
  JobDuration,
  JobName,
  JobSummary,
  Summary,
} from './Experience.styled';

/** Props of {@link Experience}. Every part is optional and is not rendered when missing. */
interface ExperienceProps {
  /** Job title, already translated. */
  jobName?: string;
  /** Company name, also used as the logo's alt text. */
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
  /** Description of the job: text, bullet lists, {@link Project}s and {@link Technologies}. */
  children?: React.ReactNode;
}

/**
 * Card for one job at one company: logo, job title, company details, computed duration and a
 * free-form description. For several successive roles at the same company, use
 * `ExperienceGroup` instead.
 *
 * @example
 * <Experience
 *   jobName="Full-Stack Engineer"
 *   entityName="Wibilong"
 *   startDate="sept. 2019"
 *   endDate="juin 2021"
 * >
 *   <Experience.Technologies technologies={['React.js', 'Node.js']} />
 * </Experience>
 */
const Experience = ({
  jobName,
  entityName = '',
  entityLogoUrl,
  contractType,
  city,
  startDate,
  endDate,
  children,
}: ExperienceProps) => {
  const { t } = useTranslation();
  const details = [entityName, contractType, city].filter(Boolean).join(' · ');
  const duration = formatDuration({ duration: computeDuration({ startDate, endDate }), t });

  return (
    <Article>
      <Summary>
        {entityLogoUrl && (
          <EntityLogo
            src={entityLogoUrl}
            alt={entityName}
          />
        )}
        <JobSummary>
          {jobName && <JobName>{jobName}</JobName>}
          {details && <JobDetails>{details}</JobDetails>}
          {duration && <JobDuration>{duration}</JobDuration>}
        </JobSummary>
      </Summary>
      <Details>{children}</Details>
    </Article>
  );
};

Experience.Technologies = Technologies;
Experience.Project = Project;

export default Experience;
