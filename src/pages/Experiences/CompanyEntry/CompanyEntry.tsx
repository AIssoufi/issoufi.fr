import { useTranslation } from 'react-i18next';

import { translateKey } from '../../../i18n/utils';
import Experience from '../Experience';
import ExperienceGroup from '../ExperienceGroup';
import RoleDescription from '../RoleDescription';
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
 * One company of the timeline of the Experiences page, in the active language. With several
 * roles, it is an {@link ExperienceGroup} that writes the company once and each role with its own
 * period. With a single one, it is an {@link Experience} card after the period of the company.
 * Either way, the element that draws its dot on the timeline is marked `data-timeline-dot`.
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
            startDate={translateKey({ t, key: role.startKey })}
            endDate={translateKey({ t, key: role.endKey })}
          >
            <RoleDescription role={role} />
          </ExperienceGroup.Role>
        ))}
      </ExperienceGroup>
    );
  }

  const [role] = roles;
  return (
    <TimelineEntry data-timeline-dot="before">
      <TimelinePeriod
        start={translateKey({ t, key: experience?.periodStartKey })}
        end={translateKey({ t, key: experience?.periodEndKey })}
      />
      <TimelineContent>
        <Experience
          {...company}
          jobName={translateKey({ t, key: role?.titleKey })}
          startDate={translateKey({ t, key: role?.startKey })}
          endDate={translateKey({ t, key: role?.endKey })}
        >
          <RoleDescription role={role} />
        </Experience>
      </TimelineContent>
    </TimelineEntry>
  );
};

export default CompanyEntry;
