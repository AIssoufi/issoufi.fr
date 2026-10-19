import JobSummary from '../JobSummary/index.ts';
import Project from '../Project/index.ts';
import Technologies from '../Technologies/index.ts';

import { Article, Details } from './Experience.styled.ts';

/** Props of {@link Experience}. Every part is optional and is not rendered when missing. */
interface ExperienceProps {
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
  /** Absolute URL of the company logo, e.g. `/wibilong.webp`, decorative. No logo when missing. */
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
   * Technologies of the job, in display order, shown under its description. None are shown when
   * the list is empty or missing.
   */
  technologies?: string[];
  /** Description of the job: text, bullet lists and {@link Project}s. */
  children?: React.ReactNode;
}

/**
 * `article` card for one job at one company: its {@link JobSummary} (logo, job title as a `h3`,
 * company details, period below the tablet breakpoint, computed duration), a free-form
 * description and the technologies of the job, stacked at every width, each as wide as the
 * card. For several successive roles at the same company, use `ExperienceGroup` instead.
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
  jobNameLanguage,
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
      jobNameLanguage={jobNameLanguage}
      entityName={entityName}
      entityLogoUrl={entityLogoUrl}
      contractType={contractType}
      city={city}
      startDate={startDate}
      endDate={endDate}
    />
    <Details>{children}</Details>
    <Technologies technologies={technologies} />
  </Article>
);

Experience.Project = Project;

export default Experience;
