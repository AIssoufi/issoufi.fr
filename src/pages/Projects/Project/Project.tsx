import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';

import LikeIcon from './icons/heart.svg?react';
import NextIcon from './icons/next.svg?react';
import PreviousIcon from './icons/previous.svg?react';

import { NO_LIKE, PAGE_SIZE } from './constants';
import { useCardTilt } from './hooks/useCardTilt';
import { useLikes } from './hooks/useLikes';
import {
  CtrlItem,
  IconBtn,
  ImageContainer,
  LikeButton,
  LikeCount,
  ProjectGrid,
  ProjectInfo,
  ProjectItem,
  ProjectLink,
  ProjectName,
  ProjectTools,
  ProjectType,
  Section,
  SectionControls,
  SectionHeader,
  SectionTitle,
  Thumbnail,
} from './Project.styled';
import type { ProjectItemData } from './types';
import { getNextPageStart, getPreviousPageStart, getProjectLinkUrl } from './utils';

/** Props of {@link Project}. */
interface ProjectProps {
  /**
   * Section heading, already translated. Also names the group of the section controls. When it is
   * missing or blank, no heading is rendered and the group has no name.
   */
  title?: string;
  /** Cards to show, three per page, or all at once after "Show all". @default [] */
  projects?: ProjectItemData[];
}

const NO_PROJECTS: ProjectItemData[] = [];

/**
 * Section of project cards with a title, paginated three at a time with previous and next
 * buttons, named for screen readers, or showing all cards after "Show all", at the size of the
 * row, on as many rows as they need. The cards form a list. The controls form a group labelled by
 * the title, rather than a navigation landmark. Cards tilt toward the mouse, and have a like
 * button, named after the project and described by its count, whose state is kept in memory only.
 * When the project has a `url` and a name, the card title is a link to it, stretched over the
 * whole card; the like button sits beside that link, never inside it. The title is a level 2
 * heading, under the `h1` of the page; without a title, the section has no heading and its
 * controls have no name.
 */
const Project = ({ title, projects = NO_PROJECTS }: ProjectProps) => {
  const { t } = useTranslation();
  // Prefix of the element ids, unique to each section since a page shows several of them
  const sectionId = useId();
  const titleId = `${sectionId}-title`;
  // A blank title would leave an empty heading, and the controls labelled by it unnamed
  const hasTitle = typeof title === 'string' && title.trim() !== '';
  const [pageStart, setPageStart] = useState(0);
  const [isShowingAll, setIsShowingAll] = useState(false);
  const { likes, animatingIds, toggleLike } = useLikes(projects);

  const visibleProjects = isShowingAll
    ? projects
    : projects.slice(pageStart, pageStart + PAGE_SIZE);

  const handleNextPage = () => {
    setPageStart(currentStart =>
      getNextPageStart({ currentStart, total: projects.length, pageSize: PAGE_SIZE }),
    );
  };

  const handlePreviousPage = () => {
    setPageStart(currentStart => getPreviousPageStart({ currentStart, pageSize: PAGE_SIZE }));
  };

  const cardTilt = useCardTilt();

  return (
    <Section>
      <SectionHeader>
        {hasTitle && <SectionTitle id={titleId}>{title}</SectionTitle>}
        <SectionControls
          role="group"
          aria-labelledby={hasTitle ? titleId : undefined}
        >
          <CtrlItem
            type="button"
            onClick={() => setIsShowingAll(!isShowingAll)}
          >
            {isShowingAll
              ? t('projects.showLess')
              : t('projects.showAll', { count: projects.length })}
          </CtrlItem>
          {!isShowingAll && (
            <>
              <IconBtn
                type="button"
                aria-label={t('projects.previousPage')}
                onClick={handlePreviousPage}
              >
                <PreviousIcon aria-hidden />
              </IconBtn>
              <IconBtn
                type="button"
                aria-label={t('projects.nextPage')}
                onClick={handleNextPage}
              >
                <NextIcon aria-hidden />
              </IconBtn>
            </>
          )}
        </SectionControls>
      </SectionHeader>
      <ProjectGrid $displayAll={isShowingAll}>
        {visibleProjects.map(({ id, name, type, imageUrl, url, tools }) => {
          const { count, liked } = likes[id] ?? NO_LIKE;
          const isAnimating = animatingIds.has(id);
          const likeCountId = `${sectionId}-like-count-${id}`;
          const linkUrl = getProjectLinkUrl({ url, name });

          return (
            <ProjectItem
              key={id}
              $displayAll={isShowingAll}
              {...cardTilt}
            >
              <ImageContainer>
                <Thumbnail
                  src={imageUrl}
                  alt={name}
                />
                <LikeButton
                  type="button"
                  aria-label={t('projects.like', { name })}
                  aria-pressed={liked}
                  aria-describedby={likeCountId}
                  $liked={liked}
                  $animating={isAnimating}
                  onClick={() => toggleLike(id)}
                >
                  <LikeIcon aria-hidden />
                  <LikeCount
                    id={likeCountId}
                    $liked={liked}
                    $animating={isAnimating}
                  >
                    {count}
                  </LikeCount>
                </LikeButton>
              </ImageContainer>
              <ProjectInfo>
                <ProjectName>
                  {linkUrl ? (
                    <ProjectLink
                      href={linkUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {name}
                    </ProjectLink>
                  ) : (
                    name
                  )}
                </ProjectName>
                <ProjectType>{type}</ProjectType>
                <ProjectTools>{(tools ?? []).join(' · ')}</ProjectTools>
              </ProjectInfo>
            </ProjectItem>
          );
        })}
      </ProjectGrid>
    </Section>
  );
};

export default Project;
