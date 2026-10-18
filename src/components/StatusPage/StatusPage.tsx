import type { ComponentProps } from 'react';

import { BACKGROUND_IMAGE_URL } from './constants';
import StatusMessage from './StatusMessage';
import { StatusPageMain } from './StatusPage.styled';

/**
 * Props of {@link StatusPage}: those of its {@link StatusMessage}, every one optional and not
 * rendered when missing.
 */
type StatusPageProps = ComponentProps<typeof StatusMessage>;

/**
 * Page that shows a status, such as a missing page, a forbidden access or an unexpected error:
 * its `<main>` landmark, a `Page` over the photo of the status pages ({@link BACKGROUND_IMAGE_URL})
 * and its dark overlay, with a {@link StatusMessage} centered in its height. A message taller than
 * the screen makes the page grow, so none of it is cut off. Renders an empty page when no prop is
 * provided. Needs a router when `homeLinkLabel` is set, because the home link is a router
 * link.
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
  <StatusPageMain backgroundImage={BACKGROUND_IMAGE_URL}>
    <StatusMessage {...props} />
  </StatusPageMain>
);

export default StatusPage;
