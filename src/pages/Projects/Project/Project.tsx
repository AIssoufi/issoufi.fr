import { useState } from 'react';
import { useTranslation } from 'react-i18next';

// SVG
import LikeIcon from './icons/heart.svg?react';
import NextIcon from './icons/next.svg?react';
import PreviousIcon from './icons/previous.svg?react';

import {
  CtrlItem,
  IconBtn,
  ImageContainer,
  LikeButton,
  LikeCount,
  NavCtrl,
  ProjectGrid,
  ProjectInfo,
  ProjectItem,
  ProjectName,
  ProjectTools,
  ProjectType,
  Section,
  SectionHeader,
  SectionTitle,
  Thumbnail,
} from './Project.styled';

/** One project card, as stored in `.data/*-projects.json`. */
interface ProjectItemData {
  /** Unique id: the React key and the key of the like state. */
  id: number;
  /** Project name, shown as the card title and the thumbnail alt text. */
  name: string;
  /** Kind of project, e.g. "Application web" or "Site vitrine". */
  type: string;
  /** Absolute URL of the screenshot in `public/`, e.g. `/chess.png`. */
  imageUrl: string;
  /** Page opened in a new tab when the card is clicked. The card is not a link when missing. */
  url?: string;
  /** Technologies, shown under the name separated by ` · `. */
  tools: string[];
  /** Initial number of likes. */
  likeCount: number;
  /** Whether the visitor's like is initially set. */
  isLikedByOwnUser: boolean;
}

/** Props of {@link Project}. */
interface ProjectProps {
  /** Section heading, already translated. */
  title?: string;
  /** Cards to show, three per page, or all at once after "Show all". @default [] */
  projects?: ProjectItemData[];
}

/** Like count and liked flag of each card, by project id. Kept in memory only, never saved. */
type LikeState = Record<number, { count: number; liked: boolean }>;

/**
 * Section of project cards with a title, paginated three at a time with previous and next
 * buttons, or showing all cards after "Show all". Cards tilt toward the mouse, link to the
 * project when it has a `url`, and have a like button whose state is kept in memory only.
 */
const Project = ({ title, projects = [] }: ProjectProps) => {
  const { t } = useTranslation();
  const [currentPage, setCurrentPage] = useState(0);
  const [displayAllPages, setDisplayAllPages] = useState(false);
  const step = 3;

  const [likes, setLikes] = useState<LikeState>(() =>
    Object.fromEntries(
      projects.map(p => [p.id, { count: p.likeCount, liked: p.isLikedByOwnUser }]),
    ),
  );
  const [animating, setAnimating] = useState<Set<number>>(new Set());

  const handleLike = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setLikes(prev => ({
      ...prev,
      [id]: {
        count: prev[id].liked ? prev[id].count - 1 : prev[id].count + 1,
        liked: !prev[id].liked,
      },
    }));
    setAnimating(prev => new Set(prev).add(id));
    setTimeout(() => {
      setAnimating(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 450);
  };

  const handleNextPage = () => {
    const nextPage = currentPage + step;
    setCurrentPage(nextPage >= projects.length ? step : nextPage);
  };

  const handlePreviousPage = () => {
    const previousPage = currentPage - step;
    setCurrentPage(previousPage <= 0 ? 0 : previousPage);
  };

  const handleDisplayAllPage = () => {
    setDisplayAllPages(!displayAllPages);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const rotateX = ((y - cy) / cy) * -6;
    const rotateY = ((x - cx) / cx) * 6;
    el.style.setProperty('--mouse-x', `${x}px`);
    el.style.setProperty('--mouse-y', `${y}px`);
    el.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.transform = '';
  };

  return (
    <Section>
      <SectionHeader>
        <SectionTitle>{title}</SectionTitle>
        <NavCtrl>
          <CtrlItem onClick={handleDisplayAllPage}>
            {displayAllPages
              ? t('projects.showLess')
              : t('projects.showAll', { count: projects.length })}
          </CtrlItem>
          {displayAllPages ? null : (
            <IconBtn onClick={handlePreviousPage}>
              <PreviousIcon />
            </IconBtn>
          )}
          {displayAllPages ? null : (
            <IconBtn onClick={handleNextPage}>
              <NextIcon />
            </IconBtn>
          )}
        </NavCtrl>
      </SectionHeader>
      <ProjectGrid $displayAll={displayAllPages}>
        {(displayAllPages ? projects : projects.slice(currentPage, currentPage + step)).map(
          ({ id, name, type, imageUrl, url, tools }) => (
            <ProjectItem
              key={id}
              $displayAll={displayAllPages}
              as={url ? 'a' : 'div'}
              {...(url ? { href: url, target: '_blank', rel: 'noreferrer' } : {})}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            >
              <ImageContainer>
                <Thumbnail
                  src={imageUrl}
                  alt={name}
                />
                <LikeButton
                  $liked={likes[id]?.liked ?? false}
                  $animating={animating.has(id)}
                  onClick={e => handleLike(id, e)}
                >
                  <LikeIcon />
                  <LikeCount
                    $liked={likes[id]?.liked ?? false}
                    $animating={animating.has(id)}
                  >
                    {likes[id]?.count ?? 0}
                  </LikeCount>
                </LikeButton>
              </ImageContainer>
              <ProjectInfo>
                <ProjectName>{name}</ProjectName>
                <ProjectType>{type}</ProjectType>
                <ProjectTools>{tools.join(' · ')}</ProjectTools>
              </ProjectInfo>
            </ProjectItem>
          ),
        )}
      </ProjectGrid>
    </Section>
  );
};

export default Project;
