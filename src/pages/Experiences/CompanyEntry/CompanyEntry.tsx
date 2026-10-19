import { useTranslation } from 'react-i18next';

import VisuallyHidden from '../../../components/VisuallyHidden';
import { translateKey } from '../../../i18n/utils';
import Experience from '../Experience';
import ExperienceGroup from '../ExperienceGroup';
import RoleDescription from './RoleDescription';
import TimelinePeriod from '../TimelinePeriod';
import type { ExperienceData, RoleData } from '../types';
import { TimelineContent, TimelineEntry } from './CompanyEntry.styled';

/** Props of {@link CompanyEntry}. */
interface CompanyEntryProps {
  /** Company to show, from `.data/experiences.json`. Missing, it shows an empty job. */
  experience?: ExperienceData;
}

const NO_ROLES: RoleData[] = [];

/**
 * One company of the timeline of the Experiences page, in the active language: an item of its
 * list, named by a `h2` that only screen readers read, since each card already writes the
 * company. With several roles, it is an {@link ExperienceGroup} that writes the company once and
 * each role with its own period. With a single one, it is an {@link Experience} card after the
 * period of its role, from the same dates as the card. Either way, the element that draws its
 * dot on the timeline is marked `data-timeline-dot`.
 *
 * @example
 * <Timeline data-timeline-line="before">
 *   <CompanyEntry experience={experience} />
 * </Timeline>
 */
const CompanyEntry = ({ experience }: CompanyEntryProps) => {
  const { t } = useTranslation();
  const roles = experience?.roles ?? NO_ROLES;
  const company = {
    entityName: translateKey({ t, key: experience?.nameKey }),
    entityLogoUrl: experience?.logoUrl,
    contractType: translateKey({ t, key: experience?.contractKey }),
    city: translateKey({ t, key: experience?.cityKey }),
  };

  const hasSeveralRoles = roles.length > 1;
  if (hasSeveralRoles) {
    return (
      <ExperienceGroup {...company}>
        {roles.map((role, index) => (
          // The roles of a company never move, so their position is a stable key
          <ExperienceGroup.Role
            key={index}
            jobName={translateKey({ t, key: role.titleKey })}
            jobNameLanguage={role.titleLanguage}
            startDate={translateKey({ t, key: role.startKey })}
            endDate={translateKey({ t, key: role.endKey })}
            technologies={role.technologies}
          >
            <RoleDescription role={role} />
          </ExperienceGroup.Role>
        ))}
      </ExperienceGroup>
    );
  }

  const [role] = roles;
  const startDate = translateKey({ t, key: role?.startKey });
  const endDate = translateKey({ t, key: role?.endKey });
  return (
    <TimelineEntry data-timeline-dot="before">
      {company.entityName && <VisuallyHidden as="h2">{company.entityName}</VisuallyHidden>}
      <TimelinePeriod
        start={startDate}
        end={endDate}
      />
      <TimelineContent>
        <Experience
          {...company}
          jobName={translateKey({ t, key: role?.titleKey })}
          jobNameLanguage={role?.titleLanguage}
          startDate={startDate}
          endDate={endDate}
          technologies={role?.technologies}
        >
          <RoleDescription role={role} />
        </Experience>
      </TimelineContent>
    </TimelineEntry>
  );
};

export default CompanyEntry;
