import React from 'react';

import JobSummary from '../JobSummary';
import Project from '../Project';
import Technologies from '../Technologies';

import {
  GroupArticle,
  RoleContent,
  RoleDetails,
  RoleItem,
  RolePeriodCol,
  RolePeriodEnd,
  RolePeriodSep,
  RolePeriodStart,
  RolesList,
} from './ExperienceGroup.styled';

/** Company details shared by every {@link Role} of an {@link ExperienceGroup}. */
interface CompanyCtxValue {
  /** Company name, also used as the logo's alt text. */
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
  /** Description of the role: text, bullet lists, projects and technologies. */
  children?: React.ReactNode;
}

/**
 * One role inside an {@link ExperienceGroup}: its period on the left, then its
 * {@link JobSummary} (company details from the group, job title and computed duration) and the
 * description. Outside a group, the summary is omitted.
 */
const Role = ({ jobName, startDate, endDate, children }: RoleProps) => {
  const company = React.useContext(CompanyCtx);

  return (
    <RoleItem>
      <RolePeriodCol>
        <RolePeriodStart>{startDate}</RolePeriodStart>
        <RolePeriodSep>↓</RolePeriodSep>
        <RolePeriodEnd>{endDate}</RolePeriodEnd>
      </RolePeriodCol>
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
 * Timeline block for several successive roles at the same company. It shares the company
 * details with its `ExperienceGroup.Role` children through a context, so they are written once.
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
    <GroupArticle>
      <RolesList>{children}</RolesList>
    </GroupArticle>
  </CompanyCtx.Provider>
);

ExperienceGroup.Role = Role;

export default ExperienceGroup;
