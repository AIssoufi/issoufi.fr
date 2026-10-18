import JobSummary from '../JobSummary';
import Project from '../Project';
import Technologies from '../Technologies';

import { Article, Details } from './Experience.styled';

/** Props of {@link Experience}. Every part is optional and is not rendered when missing. */
interface ExperienceProps {
  /** Job title, already translated. */
  jobName?: string;
  /** Company name, written first in the company details. */
  entityName?: string;
  /** Absolute URL of the company logo, e.g. `/wibilong.png`, decorative. No logo when missing. */
  entityLogoUrl?: string;
  /** Contract type, e.g. "CDI" or "Alternance". */
  contractType?: string;
  /** City and department, e.g. "Paris (75)". */
  city?: string;
  /**
   * Start of the job as a month and a year, e.g. "sept. 2019" or "Sept. 2019", shown in the
   * header below the tablet breakpoint. The duration is shown, in the active language, only
   * when both dates are valid.
   */
  startDate?: string;
  /**
   * End of the job in the same format as `startDate`, or "Aujourd'hui" / "Present", shown with
   * it below the tablet breakpoint.
   */
  endDate?: string;
  /** Description of the job: text, bullet lists, {@link Project}s and {@link Technologies}. */
  children?: React.ReactNode;
}

/**
 * `article` card for one job at one company: its {@link JobSummary} (logo, job title as a `h3`,
 * company details, period below the tablet breakpoint, computed duration) and a free-form
 * description. For several successive roles at the same company, use `ExperienceGroup` instead.
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
  entityName,
  entityLogoUrl,
  contractType,
  city,
  startDate,
  endDate,
  children,
}: ExperienceProps) => (
  <Article>
    <JobSummary
      jobName={jobName}
      entityName={entityName}
      entityLogoUrl={entityLogoUrl}
      contractType={contractType}
      city={city}
      startDate={startDate}
      endDate={endDate}
    />
    <Details>{children}</Details>
  </Article>
);

Experience.Technologies = Technologies;
Experience.Project = Project;

export default Experience;
