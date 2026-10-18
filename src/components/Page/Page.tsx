import type { ReactNode } from 'react';

import { Main } from './Page.styled';

/** Props of {@link Page}. Every prop is optional. */
interface PageProps {
  /**
   * URL of the image covering the screen behind the page, under a dark overlay, e.g.
   * `'/projects.webp'`. Only the overlay is drawn when missing.
   */
  backgroundImage?: string;
  /** Content of the page. */
  children?: ReactNode;
  /** Class name added by `styled(Page)`, so each page can extend the shared layout. */
  className?: string;
}

/**
 * Layout shared by every page, rendered as its `<main>` landmark: it fills the main area of the
 * app grid, with the page gutters, over a fixed background image and a dark overlay. Room is kept
 * under the content, so that its end scrolls above the site badge of the bottom left corner. Pages
 * extend it with `styled(Page)` in their own style file. A page has a single `<main>`, so the
 * content inside it never renders another one.
 *
 * @example
 * const ProjectsPage = styled(Page)`
 *   padding-left: 0;
 * `;
 *
 * <ProjectsPage backgroundImage="/projects.webp">…</ProjectsPage>
 */
const Page = ({ backgroundImage, children, className }: PageProps) => (
  <Main
    className={className}
    $backgroundImage={backgroundImage}
  >
    {children}
  </Main>
);

export default Page;
