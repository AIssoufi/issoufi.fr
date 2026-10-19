import { ActionButton, Code, Container, HomeLink, Message, Title } from './StatusMessage.styled.ts';

/** Props of {@link StatusMessage}. Every part is optional and is not rendered when missing. */
interface StatusMessageProps {
  /** Status code shown in large type, e.g. `404` or `403`. */
  code?: number | string;
  /** Heading that names the problem, already translated. */
  title?: string;
  /** Explanation shown under the title, already translated. */
  message?: string;
  /**
   * Label of a button under the message that lets the visitor act on the problem, e.g. reload
   * the page, already translated. The button is omitted when missing.
   */
  actionLabel?: string;
  /** Called when the action button is clicked. The button does nothing without it. */
  onAction?: () => void;
  /**
   * Label of the link back to the home page, already translated.
   * The link is omitted when missing.
   */
  homeLinkLabel?: string;
}

/**
 * Message of a status page, such as a missing page or a forbidden access: a large status code, a
 * title, an explanation, an action button and a link back to the home page, stacked and centered
 * across. `StatusPage` centers it in the height of the page. Renders an empty container when no
 * prop is provided. Needs a router when `homeLinkLabel` is set, because the home link is a router
 * link, to the home page in the language of the URL.
 *
 * @example
 * <StatusMessage
 *   code={404}
 *   title="Page not found"
 *   message="The page /skills does not exist."
 *   homeLinkLabel="Back to home"
 * />
 *
 * @example
 * <StatusMessage
 *   title="Something went wrong"
 *   actionLabel="Reload the page"
 *   onAction={() => window.location.reload()}
 * />
 */
const StatusMessage = ({
  code,
  title,
  message,
  actionLabel,
  onAction,
  homeLinkLabel,
}: StatusMessageProps) => (
  <Container>
    {code !== undefined && code !== '' && <Code>{code}</Code>}
    {title && <Title>{title}</Title>}
    {message && <Message>{message}</Message>}
    {actionLabel && (
      <ActionButton
        type="button"
        onClick={() => onAction?.()}
      >
        {actionLabel}
      </ActionButton>
    )}
    {homeLinkLabel && <HomeLink to="/">{homeLinkLabel}</HomeLink>}
  </Container>
);

export default StatusMessage;
