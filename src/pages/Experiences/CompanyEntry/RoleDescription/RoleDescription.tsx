import { useTranslation } from 'react-i18next';

import { translateKey } from '../../../../i18n/utils.ts';
import Project from '../../Project/index.ts';
import type { ProjectData, RoleData } from '../../types.ts';
import BulletPoints from './BulletPoints/index.ts';
import TextSegments from './TextSegments/index.ts';

/** Props of {@link RoleDescription}. */
interface RoleDescriptionProps {
  /** Role to describe, from `.data/experiences.json`. Nothing is rendered when it is missing. */
  role?: RoleData;
}

const NO_PROJECTS: ProjectData[] = [];

/**
 * Description of a role of the Experiences page, in the active language and without a wrapping
 * element, to put inside an `Experience` or an `ExperienceGroup.Role`: its introduction, its
 * bullet points, then a {@link Project} block for each of its projects. The technologies of the
 * role are not part of it: the card shows them apart, next to its summary on a wide screen.
 *
 * @example
 * <Experience jobName="Full-Stack JavaScript Engineer" technologies={role.technologies}>
 *   <RoleDescription role={role} />
 * </Experience>
 */
const RoleDescription = ({ role }: RoleDescriptionProps) => {
  const { t } = useTranslation();
  const projects = role?.projects ?? NO_PROJECTS;

  return (
    <>
      <TextSegments segments={role?.intro} />
      <BulletPoints textKeys={role?.bulletKeys} />
      {projects.map((project, index) => (
        // The projects of a role never move, so their position is a stable key
        <Project
          key={index}
          title={translateKey({ t, key: project.titleKey })}
          state={translateKey({ t, key: project.stateKey })}
          technologies={project.technologies}
        >
          <TextSegments segments={project.description} />
          <BulletPoints textKeys={project.bulletKeys} />
        </Project>
      ))}
    </>
  );
};

export default RoleDescription;
