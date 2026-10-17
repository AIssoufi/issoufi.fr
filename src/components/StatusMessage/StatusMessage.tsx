import { Code, Container, HomeLink, Message, Title } from './StatusMessage.styled';

/** Props of {@link StatusMessage}. Every part is optional and is not rendered when missing. */
interface StatusMessageProps {
  /** Status code shown in large type, e.g. `404` or `403`. */
  code?: number | string;
  /** Heading that names the problem, already translated. */
  title?: string;
  /** Explanation shown under the title, already translated. */
  message?: string;
  /**
   * Label of the link back to the home page, already translated.
   * The link is omitted when missing.
   */
  homeLinkLabel?: string;
}

/**
 * Full-page message for error states such as a missing page or a forbidden access: a large
 * status code, a title, an explanation and a link back to the home page.
 * Renders an empty container when no prop is provided. Needs a router when `homeLinkLabel`
 * is set, because the home link is a router `Link`.
 *
 * @example
 * <StatusMessage
 *   code={404}
 *   title="Page not found"
 *   message="The page /skills does not exist."
 *   homeLinkLabel="Back to home"
 * />
 */
const StatusMessage = ({ code, title, message, homeLinkLabel }: StatusMessageProps) => (
  <Container>
    {code !== undefined && code !== '' && <Code>{code}</Code>}
    {title && <Title>{title}</Title>}
    {message && <Message>{message}</Message>}
    {homeLinkLabel && <HomeLink to="/">{homeLinkLabel}</HomeLink>}
  </Container>
);

export default StatusMessage;
