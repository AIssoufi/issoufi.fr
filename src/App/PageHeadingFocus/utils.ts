import { PAGE_HEADING_SELECTOR, SCRIPT_ONLY_TAB_INDEX } from './constants';

/** Parameters of {@link focusPageHeading}. */
interface FocusPageHeadingParams {
  /** Element or document holding the page. Nothing is focused when `null`. @default document */
  root?: ParentNode | null;
}

/**
 * Moves the focus to the main heading of the page, the first `h1` of `root`, so that keyboard and
 * screen reader users start on the new page after a navigation. A heading cannot take the focus
 * by itself: it gets `tabindex="-1"`, which lets this script focus it without adding it to the
 * `Tab` order, unless it already has a `tabindex`. Does nothing when `root` holds no `h1`.
 *
 * @example
 * focusPageHeading(); // the first h1 of the document has the focus
 */
export function focusPageHeading({ root = document }: FocusPageHeadingParams = {}): void {
  const heading = root?.querySelector<HTMLElement>(PAGE_HEADING_SELECTOR);
  if (!heading) return;

  const hasOwnTabIndex = heading.hasAttribute('tabindex');
  if (!hasOwnTabIndex) heading.tabIndex = SCRIPT_ONLY_TAB_INDEX;
  heading.focus();
}
