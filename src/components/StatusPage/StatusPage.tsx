import type { ComponentProps } from 'react';

import { STATUS_PAGE_BACKGROUND_PHOTO } from '../../utils/pages.ts';
import StatusMessage from './StatusMessage/index.ts';
import { StatusPageMain } from './StatusPage.styled.ts';

/**
 * Props of {@link StatusPage}: those of its {@link StatusMessage}, every one optional and not
 * rendered when missing.
 */
type StatusPageProps = ComponentProps<typeof StatusMessage>;

/**
 * Page that shows a status, such as a missing page, a forbidden access or an unexpected error:
 * its `<main>` landmark, a `Page` over the photo of the status pages
 * (`STATUS_PAGE_BACKGROUND_PHOTO`, `src/utils/pages.ts`) and its dark overlay, with a
 * {@link StatusMessage} centered in its height. A message taller than the screen makes the page
 * grow, so none of it is cut off. Renders an empty page when no prop is provided. Needs a router
 * when `homeLinkLabel` is set, because the home link is a router link.
 *
 * @example
 * <StatusPage
 *   code={404}
 *   title="Page not found"
 *   message="The page /skills does not exist."
 *   homeLinkLabel="Back to home"
 * />
 */
const StatusPage = (props: StatusPageProps) => (
  <StatusPageMain backgroundPhoto={STATUS_PAGE_BACKGROUND_PHOTO}>
    <StatusMessage {...props} />
  </StatusPageMain>
);

export default StatusPage;
