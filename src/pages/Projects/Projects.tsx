import { useTranslation } from 'react-i18next';

import Project from './Project';

import freelanceProjectsData from './.data/freelance-projects.json';
import personalProjectsData from './.data/personal-projects.json';
import { PageTitle, ProjectsPage } from './Projects.styled';
import { BACKGROUND_IMAGE_URL } from './constants';
import { translateProjects } from './utils';

/**
 * Projects page: the personal and freelance project sections, with their data read from
 * `.data/personal-projects.json` and `.data/freelance-projects.json` and their names and kinds
 * translated into the language of the page, under a page title that only screen readers announce.
 * The first thumbnail of the personal section, at the top of the page, downloads before the others.
 */
export const Projects = () => {
  const { t } = useTranslation();

  return (
    <ProjectsPage backgroundImage={BACKGROUND_IMAGE_URL}>
      <PageTitle>{t('projects.pageTitle')}</PageTitle>
      <Project
        priority
        title={t('projects.personal')}
        projects={translateProjects({ projects: personalProjectsData.projects, t })}
      />
      <Project
        title={t('projects.freelance')}
        projects={translateProjects({ projects: freelanceProjectsData.projects, t })}
      />
    </ProjectsPage>
  );
};
