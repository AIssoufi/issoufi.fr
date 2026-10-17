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

interface CompanyCtxValue {
  entityName: string;
  entityLogoUrl: string;
  contratType: string;
  city: string;
}

const CompanyCtx = React.createContext<CompanyCtxValue | null>(null);

interface RoleProps {
  jobName: string;
  startDate: string;
  endDate: string;
  children: React.ReactNode;
}

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
          <Summary>
            <EntityLogo
              src={company.entityLogoUrl}
              alt={company.entityName}
            />
            <JobSummary>
              <RoleName>{jobName}</RoleName>
              <JobDetails>{`${company.entityName} · ${company.contratType} · ${company.city}`}</JobDetails>
              <JobDuration>{computeDuration(startDate, endDate)}</JobDuration>
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

interface ExperienceGroupProps {
  entityName: string;
  entityLogoUrl: string;
  contratType: string;
  city: string;
  children: React.ReactNode;
}

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
