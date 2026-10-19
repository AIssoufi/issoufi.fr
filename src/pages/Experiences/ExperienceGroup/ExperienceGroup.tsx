import React from 'react';

import VisuallyHidden from '../../../components/VisuallyHidden';
import JobSummary from '../JobSummary';
import Project from '../Project';
import Technologies from '../Technologies';
import TimelinePeriod from '../TimelinePeriod';

import {
  GroupItem,
  RoleContent,
  RoleDetails,
  RoleItem,
  RolesList,
  RoleTechnologies,
} from './ExperienceGroup.styled';

/** Company details shared by every {@link Role} of an {@link ExperienceGroup}. */
interface CompanyCtxValue {
  /** Company name, the `h2` of the group and the start of the company details of each role. */
  entityName?: string;
  /** Absolute URL of the company logo. No logo when missing. */
  entityLogoUrl?: string;
  /** Contract type, e.g. "CDI". */
  contractType?: string;
  /** City and department, e.g. "Paris (75)". */
  city?: string;
}

/** Provides the company details to the roles; `null` outside an {@link ExperienceGroup}. */
const CompanyCtx = React.createContext<CompanyCtxValue | null>(null);

/** Props of {@link Role}. Every part is optional and is not rendered when missing. */
interface RoleProps {
  /** Job title for this role, already translated. */
  jobName?: string;
  /**
   * Start of the role as a month and a year, e.g. "juin 2021".
   * The duration is shown, in the active language, only when both dates are valid.
   */
  startDate?: string;
  /** End of the role in the same format, or "Aujourd'hui" / "Present". */
  endDate?: string;
  /**
   * Technologies of the role, in display order, shown after its description, and under its
   * summary from the `two-job-columns` breakpoint. None are shown when the list is empty or
   * missing.
   */
  technologies?: string[];
  /** Description of the role: text, bullet lists and projects. */
  children?: React.ReactNode;
}

/**
 * One role inside an {@link ExperienceGroup}, an item of its list: its period on the left, then
 * an `article` card with its {@link JobSummary} (company details from the group, job title as a
 * `h3` and computed duration), the description and the technologies of the role, laid out as in
 * an `Experience` card. Outside a group, the summary is omitted.
 */
const Role = ({ jobName, startDate, endDate, technologies, children }: RoleProps) => {
  const company = React.useContext(CompanyCtx);

  return (
    <RoleItem data-timeline-dot="before">
      <TimelinePeriod
        variant="role"
        start={startDate}
        end={endDate}
      />
      <RoleContent>
        {company && (
          <JobSummary
            variant="role"
            jobName={jobName}
            entityName={company.entityName}
            entityLogoUrl={company.entityLogoUrl}
            contractType={company.contractType}
            city={company.city}
            startDate={startDate}
            endDate={endDate}
          />
        )}
        <RoleDetails>{children}</RoleDetails>
        <RoleTechnologies technologies={technologies} />
      </RoleContent>
    </RoleItem>
  );
};

Role.Project = Project;
Role.Technologies = Technologies;

/** Props of {@link ExperienceGroup}. Every part is optional. */
interface ExperienceGroupProps extends CompanyCtxValue {
  /** The successive {@link Role}s at this company, most recent first. */
  children?: React.ReactNode;
}

/**
 * Timeline item for several successive roles at the same company, to put in the list of the
 * timeline: a `h2` that only screen readers read names the company, since each card already
 * writes it, then the list of the roles. It shares the company details with its
 * `ExperienceGroup.Role` children through a context, so they are written once.
 *
 * @example
 * <ExperienceGroup entityName="Sewan Groupe" entityLogoUrl="/sewan.png" contractType="CDI">
 *   <ExperienceGroup.Role
 *     jobName="Lead Frontend Engineer"
 *     startDate="août 2021"
 *     endDate="Aujourd'hui"
 *   >
 *     …
 *   </ExperienceGroup.Role>
 * </ExperienceGroup>
 */
const ExperienceGroup = ({
  entityName,
  entityLogoUrl,
  contractType,
  city,
  children,
}: ExperienceGroupProps) => (
  <CompanyCtx.Provider value={{ entityName, entityLogoUrl, contractType, city }}>
    <GroupItem data-timeline-dot="before">
      {entityName && <VisuallyHidden as="h2">{entityName}</VisuallyHidden>}
      <RolesList>{children}</RolesList>
    </GroupItem>
  </CompanyCtx.Provider>
);

ExperienceGroup.Role = Role;

export default ExperienceGroup;
