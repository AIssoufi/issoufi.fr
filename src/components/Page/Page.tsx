import type { ReactNode } from 'react';

import type { BackgroundPhoto } from '../../utils/pages';
import { Main } from './Page.styled';
import { getBackgroundImages } from './utils';

/** Props of {@link Page}. Every prop is optional. */
interface PageProps {
  /**
   * Photo covering the screen behind the page, under a dark overlay: the `backgroundPhoto` of the
   * entry of the page in `PAGES` (`src/utils/pages.ts`), which the app preloads as soon as it
   * starts (`src/preloadBackgroundPhoto.ts`). Narrow portrait screens show its portrait version,
   * the others the whole photo, each over its placeholder until it is downloaded; a version without
   * a URL shows the other one. Only the overlay is drawn when it is missing.
   */
  backgroundPhoto?: Partial<BackgroundPhoto>;
  /** Content of the page. */
  children?: ReactNode;
  /** Class name added by `styled(Page)`, so each page can extend the shared layout. */
  className?: string;
}

/**
 * Layout shared by every page, rendered as its `<main>` landmark: it fills the main area of the
 * app grid, with the same page gutter on both sides, over a fixed background photo and a dark
 * overlay. Pages extend it with `styled(Page)` in their own style file. A page has a single
 * `<main>`, so the content inside it never renders another one.
 *
 * @example
 * const ProjectsPage = styled(Page)`
 *   padding-left: 0;
 * `;
 *
 * <ProjectsPage backgroundPhoto={PROJECTS_PAGE.backgroundPhoto}>…</ProjectsPage>
 */
const Page = ({ backgroundPhoto, children, className }: PageProps) => {
  const { image, portraitImage } = getBackgroundImages(backgroundPhoto);

  return (
    <Main
      className={className}
      $backgroundImage={image}
      $portraitBackgroundImage={portraitImage}
    >
      {children}
    </Main>
  );
};

export default Page;
