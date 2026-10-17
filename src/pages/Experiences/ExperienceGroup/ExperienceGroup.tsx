import React from 'react';
import Project from '../Project';
import Technologies from '../Technologies';
import {
  EntityLogo,
  JobDetails,
  JobDuration,
  JobSummary,
  Summary,
} from '../Experience/Experience.styled';
import { computeDuration } from '../duration';

import {
  GroupArticle,
  RoleContent,
  RoleDetails,
  RoleItem,
  RoleName,
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
  contratType?: string;
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
   * The duration is shown only when both dates are provided.
   */
  startDate?: string;
  /** End of the role in the same format, or "Aujourd'hui" / "Present". */
  endDate?: string;
  /** Description of the role: text, bullet lists, projects and technologies. */
  children?: React.ReactNode;
}

/**
 * One role inside an {@link ExperienceGroup}: its period on the left, then the company summary
 * (from the group), the job title, the computed duration and the description.
 * Outside a group, the company summary is omitted.
 */
const Role = ({ jobName, startDate, endDate, children }: RoleProps) => {
  const company = React.useContext(CompanyCtx);
  const details = [company?.entityName, company?.contratType, company?.city]
    .filter(Boolean)
    .join(' · ');

  return (
    <RoleItem>
      <RolePeriodCol>
        <RolePeriodStart>{startDate}</RolePeriodStart>
        <RolePeriodSep>↓</RolePeriodSep>
        <RolePeriodEnd>{endDate}</RolePeriodEnd>
      </RolePeriodCol>
      <RoleContent>
        {company && (
          <Summary>
            {company.entityLogoUrl && (
              <EntityLogo
                src={company.entityLogoUrl}
                alt={company.entityName ?? ''}
              />
            )}
            <JobSummary>
              {jobName && <RoleName>{jobName}</RoleName>}
              {details && <JobDetails>{details}</JobDetails>}
              {startDate && endDate && (
                <JobDuration>{computeDuration(startDate, endDate)}</JobDuration>
              )}
            </JobSummary>
          </Summary>
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
 * <ExperienceGroup entityName="Sewan Groupe" entityLogoUrl="/sewan.png" contratType="CDI">
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
  contratType,
  city,
  children,
}: ExperienceGroupProps) => (
  <CompanyCtx.Provider value={{ entityName, entityLogoUrl, contratType, city }}>
    <GroupArticle>
      <RolesList>{children}</RolesList>
    </GroupArticle>
  </CompanyCtx.Provider>
);

ExperienceGroup.Role = Role;

export default ExperienceGroup;
