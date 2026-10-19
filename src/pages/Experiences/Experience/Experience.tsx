import JobSummary from '../JobSummary';
import Project from '../Project';
import Technologies from '../Technologies';

import { Article, Details, JobTechnologies } from './Experience.styled';

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
  /**
   * Technologies of the job, in display order, shown after its description, and under its summary
   * from the `two-job-columns` breakpoint. None are shown when the list is empty or missing.
   */
  technologies?: string[];
  /** Description of the job: text, bullet lists and {@link Project}s. */
  children?: React.ReactNode;
}

/**
 * `article` card for one job at one company: its {@link JobSummary} (logo, job title as a `h3`,
 * company details, period below the tablet breakpoint, computed duration), a free-form
 * description and the technologies of the job. Below the `two-job-columns` breakpoint they
 * follow each other; from it, the summary and the technologies stand on the left of the
 * description, whose lines stay short however wide the card. For several successive roles at the
 * same company, use `ExperienceGroup` instead.
 *
 * @example
 * <Experience
 *   jobName="Full-Stack Engineer"
 *   entityName="Wibilong"
 *   startDate="sept. 2019"
 *   endDate="juin 2021"
 *   technologies={['React.js', 'Node.js']}
 * >
 *   Full-stack development of the Wibilong SaaS solutions.
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
  technologies,
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
    <JobTechnologies technologies={technologies} />
  </Article>
);

Experience.Technologies = Technologies;
Experience.Project = Project;

export default Experience;
