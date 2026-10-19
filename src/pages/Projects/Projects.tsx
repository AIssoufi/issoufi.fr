import { useTranslation } from 'react-i18next';

import VisuallyHidden from '../../components/VisuallyHidden';
import { PROJECTS_PAGE } from '../../utils/pages';
import Project from './Project';

import freelanceProjectsData from './.data/freelance-projects.json';
import personalProjectsData from './.data/personal-projects.json';
import { ProjectsPage } from './Projects.styled';
import { translateProjects } from './utils';

/**
 * Projects page: the personal and freelance project sections, with their data read from
 * `.data/personal-projects.json` and `.data/freelance-projects.json` and their names and kinds
 * translated into the language of the page, under a page title that only screen readers announce,
 * since the design shows only the section titles.
 * The first thumbnail of the personal section, at the top of the page, downloads before the others.
 */
export const Projects = () => {
  const { t } = useTranslation();

  return (
    <ProjectsPage backgroundPhoto={PROJECTS_PAGE.backgroundPhoto}>
      <VisuallyHidden as="h1">{t('projects.pageTitle')}</VisuallyHidden>
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
