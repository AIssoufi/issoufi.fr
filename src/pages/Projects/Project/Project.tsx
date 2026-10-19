import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';

import LikeIcon from './icons/heart.svg?react';
import NextIcon from './icons/next.svg?react';
import PreviousIcon from './icons/previous.svg?react';

import { isNonBlankString, listUniqueNonBlankStrings } from '../../../utils/strings';
import { ROW_CARD_COUNT, THUMBNAIL_SIZES } from './constants';
import { useCardTilt } from './hooks/useCardTilt';
import { useLikes } from './hooks/useLikes';
import { usePreloadThumbnails } from './hooks/usePreloadThumbnails';
import { useWholeCardCount } from './hooks/useWholeCardCount';
import {
  CtrlItem,
  IconBtn,
  ImageContainer,
  LikeButton,
  ProjectGrid,
  ProjectInfo,
  ProjectItem,
  ProjectLink,
  ProjectName,
  ProjectTool,
  ProjectTools,
  ProjectType,
  Section,
  SectionControls,
  SectionHeader,
  SectionTitle,
  Thumbnail,
} from './Project.styled';
import type { ProjectItemData } from './types';
import {
  getLastPageStart,
  getNextPageStart,
  getPageProjects,
  getPreviousPageStart,
  getProjectLinkUrl,
  getThumbnailSources,
} from './utils';

/** Props of {@link Project}. */
interface ProjectProps {
  /**
   * Section heading, already translated. Also names the group of the section controls. When it is
   * missing or blank, no heading is rendered and the group has no name.
   */
  title?: string;
  /**
   * Cards to show, three at a time in a row that the arrows move, or all at once after "Show
   * all". @default []
   */
  projects?: ProjectItemData[];
  /**
   * Whether the section is the first of the page, whose first thumbnail is the largest image that
   * the page paints first: it is downloaded at once, before the other images. Every other
   * thumbnail is downloaded once the screen nears it.
   * @default false
   */
  priority?: boolean;
}

const NO_PROJECTS: ProjectItemData[] = [];

/**
 * Section of project cards with a title. Its row holds three cards, and its previous and next
 * buttons, named for screen readers, move it by the number of cards it shows whole: one on a
 * phone, where the next card starts at the right edge and the row scrolls to it, up to three on a
 * wide screen. At the first and the last page, the button that would go past them is
 * `aria-disabled` and dimmed, and keeps its focus. "Show all" shows every card instead, at the
 * size of the row, on as many rows as they need. The cards form a list. The controls form a
 * group labelled by the title, rather than a navigation landmark, with its buttons in the order
 * that the screen shows them. Cards tilt toward the mouse, and have a like button, named after the
 * project, whose pressed state is the visitor's own like, without a count, kept in their browser
 * by {@link useLikes}: no project is liked on a first visit. The name of each card is a level 3
 * heading, so that screen readers can go from card to card, and a card without a name has none.
 * When the project has a `url` and a name, that heading holds a `NewTabLink` to it, stretched over
 * the whole card, which screen readers announce as opening a new tab; the like button sits beside
 * that link, never inside it.
 * The tools of the card are a list, shown as one line of text with dots that screen readers skip.
 * The title is a level 2 heading, under the `h1` of the page; without a title, the section has no
 * heading and its controls have no name. The thumbnail is decorative, with an empty alt text,
 * since the name follows it, and a card without a valid file shows none. Each thumbnail downloads
 * the file of its `srcset` that its width needs on the screen, once the screen nears it, but the
 * first one of a `priority` section, at once; hovering or focusing an arrow downloads the
 * thumbnails of the page it would show, so that they never show empty.
 */
const Project = ({ title, projects = NO_PROJECTS, priority = false }: ProjectProps) => {
  const { t } = useTranslation();
  // Prefix of the element ids, unique to each section since a page shows several of them
  const sectionId = useId();
  const titleId = `${sectionId}-title`;
  // A blank title would leave an empty heading, and the controls labelled by it unnamed
  const hasTitle = typeof title === 'string' && title.trim() !== '';
  const [requestedPageStart, setPageStart] = useState(0);
  const [isShowingAll, setIsShowingAll] = useState(false);
  const { likedIds, animatingIds, toggleLike } = useLikes();
  const { listRef, wholeCardCount } = useWholeCardCount({ maxCount: ROW_CARD_COUNT });

  const total = projects.length;
  const lastPageStart = getLastPageStart({ total, pageSize: wholeCardCount });
  // A wider screen, which shows more cards whole, or fewer projects can end the pages sooner
  const pageStart = Math.min(requestedPageStart, lastPageStart);
  const isFirstPage = pageStart === 0;
  const isLastPage = pageStart === lastPageStart;
  const nextPageStart = getNextPageStart({
    currentStart: pageStart,
    total,
    pageSize: wholeCardCount,
  });
  const previousPageStart = getPreviousPageStart({
    currentStart: pageStart,
    pageSize: wholeCardCount,
  });
  // Its thumbnail is the largest image that the page paints first, which nothing should delay
  const priorityProject = priority ? projects[0] : undefined;

  const visibleProjects = isShowingAll ? projects : getPageProjects({ projects, pageStart });

  const preloadThumbnails = usePreloadThumbnails();
  const preloadNextPage = () =>
    preloadThumbnails(getPageProjects({ projects, pageStart: nextPageStart }));
  const preloadPreviousPage = () =>
    preloadThumbnails(getPageProjects({ projects, pageStart: previousPageStart }));

  const handleNextPage = () => {
    if (isLastPage) return;

    setPageStart(nextPageStart);
  };

  const handlePreviousPage = () => {
    if (isFirstPage) return;

    setPageStart(previousPageStart);
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
          {/* In the order of the screen, so that Tab follows it: the arrows, then "Show all" */}
          {!isShowingAll && (
            <>
              <IconBtn
                type="button"
                aria-label={t('projects.previousPage')}
                aria-disabled={isFirstPage}
                onClick={handlePreviousPage}
                onPointerEnter={preloadPreviousPage}
                onFocus={preloadPreviousPage}
              >
                <PreviousIcon aria-hidden />
              </IconBtn>
              <IconBtn
                type="button"
                aria-label={t('projects.nextPage')}
                aria-disabled={isLastPage}
                onClick={handleNextPage}
                onPointerEnter={preloadNextPage}
                onFocus={preloadNextPage}
              >
                <NextIcon aria-hidden />
              </IconBtn>
            </>
          )}
          <CtrlItem
            type="button"
            onClick={() => setIsShowingAll(!isShowingAll)}
          >
            {isShowingAll ? t('projects.showLess') : t('projects.showAll', { count: total })}
          </CtrlItem>
        </SectionControls>
      </SectionHeader>
      <ProjectGrid
        ref={listRef}
        $displayAll={isShowingAll}
      >
        {visibleProjects.map(project => {
          const { id, name, type, thumbnails, url, tools } = project;
          const isLiked = likedIds.has(id);
          const isAnimating = animatingIds.has(id);
          const linkUrl = getProjectLinkUrl({ url, name });
          const thumbnail = getThumbnailSources(thumbnails);
          const isPriorityThumbnail = project === priorityProject;
          // A blank name would leave an empty heading, which screen readers announce as such
          const hasName = isNonBlankString(name);
          const toolNames = listUniqueNonBlankStrings(tools);

          return (
            <ProjectItem
              key={id}
              {...cardTilt}
            >
              <ImageContainer>
                {/* Decorative, since the name of the card follows it */}
                {thumbnail && (
                  <Thumbnail
                    alt=""
                    loading={isPriorityThumbnail ? 'eager' : 'lazy'}
                    fetchPriority={isPriorityThumbnail ? 'high' : undefined}
                    decoding="async"
                    sizes={THUMBNAIL_SIZES}
                    srcSet={thumbnail.srcSet}
                    src={thumbnail.src}
                    width={thumbnail.width}
                    height={thumbnail.height}
                  />
                )}
                <LikeButton
                  type="button"
                  aria-label={t('projects.like', { name })}
                  aria-pressed={isLiked}
                  $liked={isLiked}
                  $animating={isAnimating}
                  onClick={() => toggleLike(id)}
                >
                  <LikeIcon aria-hidden />
                </LikeButton>
              </ImageContainer>
              <ProjectInfo>
                {hasName && (
                  <ProjectName>
                    {linkUrl ? <ProjectLink href={linkUrl}>{name}</ProjectLink> : name}
                  </ProjectName>
                )}
                <ProjectType>{type}</ProjectType>
                {toolNames.length > 0 && (
                  <ProjectTools>
                    {toolNames.map(toolName => (
                      <ProjectTool key={toolName}>{toolName}</ProjectTool>
                    ))}
                  </ProjectTools>
                )}
              </ProjectInfo>
            </ProjectItem>
          );
        })}
      </ProjectGrid>
    </Section>
  );
};

export default Project;
