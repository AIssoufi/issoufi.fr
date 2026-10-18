import { useTranslation } from 'react-i18next';

import Project from './Project';

import freelanceProjectsData from './.data/freelance-projects.json';
import personalProjectsData from './.data/personal-projects.json';
import { ProjectsPage } from './Projects.styled';
import { BACKGROUND_IMAGE_URL } from './constants';

/**
 * Projects page: the personal and freelance project sections, with their data read from
 * `.data/personal-projects.json` and `.data/freelance-projects.json`.
 */
export const Projects = () => {
  const { t } = useTranslation();

  return (
    <ProjectsPage backgroundImage={BACKGROUND_IMAGE_URL}>
      <Project
        title={t('projects.personal')}
        projects={personalProjectsData.projects}
      />
      <Project
        title={t('projects.freelance')}
        projects={freelanceProjectsData.projects}
      />
    </ProjectsPage>
  );
};
