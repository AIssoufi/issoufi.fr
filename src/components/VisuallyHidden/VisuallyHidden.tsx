import { DEFAULT_VISUALLY_HIDDEN_ELEMENT } from './constants.ts';
import type { VisuallyHiddenElement } from './types.ts';
import { isVisuallyHiddenElement } from './utils.ts';
import { Hidden } from './VisuallyHidden.styled.ts';

/** Props of {@link VisuallyHidden}. */
interface VisuallyHiddenProps {
  /**
   * Element of the text: a `span` within a line, or a heading. Any other value falls back to a
   * `span`.
   * @default 'span'
   */
  as?: VisuallyHiddenElement;
  /** Text read by screen readers. An empty element is rendered when it is missing. */
  children?: React.ReactNode;
}

/**
 * Text that screen readers read but the screen does not show: a heading that the design leaves
 * out, or a word read in place of a decoration hidden from them, such as the "to" of a period
 * drawn with an arrow. It takes no room on the page, out of the flow of its container.
 *
 * @example
 * <VisuallyHidden as="h2">Sewan Groupe</VisuallyHidden>
 *
 * @example
 * <span aria-hidden="true">–</span>
 * <VisuallyHidden>to</VisuallyHidden>
 */
const VisuallyHidden = ({ as, children }: VisuallyHiddenProps) => {
  const element = isVisuallyHiddenElement(as) ? as : DEFAULT_VISUALLY_HIDDEN_ELEMENT;

  return <Hidden as={element}>{children}</Hidden>;
};

export default VisuallyHidden;
