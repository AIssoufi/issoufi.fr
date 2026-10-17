import Project from '../Project';
import Technologies from '../Technologies';
import { computeDuration } from '../duration';

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

interface ExperienceProps {
  jobName: string;
  entityName: string;
  entityLogoUrl: string;
  contratType: string;
  city: string;
  startDate: string;
  endDate: string;
  children: React.ReactNode;
}

const Experience = ({
  jobName,
  entityName,
  entityLogoUrl,
  contratType,
  city,
  startDate,
  endDate,
  children,
}: ExperienceProps) => {
  return (
    <Article>
      <Summary>
        <EntityLogo
          src={entityLogoUrl}
          alt={entityName}
        />
        <JobSummary>
          <JobName>{jobName}</JobName>
          <JobDetails>{`${entityName} · ${contratType} · ${city}`}</JobDetails>
          <JobDuration>{computeDuration(startDate, endDate)}</JobDuration>
        </JobSummary>
      </Summary>
      <Details>{children}</Details>
    </Article>
  );
};

Experience.Technologies = Technologies;
Experience.Project = Project;

export default Experience;
