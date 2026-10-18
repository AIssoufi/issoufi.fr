import type { CDPSession } from '@playwright/test';

/**
 * DevTools protocol session of a page, from `page.context().newCDPSession(page)`. Only its `send`
 * is used, so the tests can pass a fake one.
 */
type ProtocolSession = Pick<CDPSession, 'send'>;

/** What the browser tells screen readers about an element, from its accessibility tree. */
export interface BrowserAccessibleText {
  /** Accessible name, such as the text of a tooltip that `aria-labelledby` points to. */
  name: string;
  /** Accessible description, such as the text that `aria-describedby` points to. */
  description: string;
}

/** Parameters of {@link getBrowserAccessibleText}. */
interface GetBrowserAccessibleTextParams {
  /** Session of the page to read. */
  session: ProtocolSession;
  /** CSS selector of the element to read, the first that matches. */
  selector: string;
}

/** Text of a value of the accessibility tree, or `''` when it holds no string. */
const getText = (value: unknown): string => (typeof value === 'string' ? value : '');

/**
 * Reads the accessible name and description that the browser itself computes for an element,
 * from its accessibility tree (`Accessibility.getPartialAXTree` of the DevTools protocol), which
 * screen readers read. Playwright's `toHaveAccessibleName` computes the name with its own code
 * instead, so only this shows how the browser treats, for instance, a hidden element that
 * `aria-labelledby` points to.
 *
 * @returns The name and the description, each `''` when the browser gives none, or when no
 * element matches.
 * @throws Rejects with the error of the protocol when one of its commands fails, as for an
 * invalid selector.
 *
 * @example
 * const session = await page.context().newCDPSession(page);
 * await getBrowserAccessibleText({ session, selector: 'a[download]' });
 * // { name: 'Download the CV', description: '' }
 */
export const getBrowserAccessibleText = async ({
  session,
  selector,
}: GetBrowserAccessibleTextParams): Promise<BrowserAccessibleText> => {
  const { root } = await session.send('DOM.getDocument', { depth: 0 });
  const { nodeId } = await session.send('DOM.querySelector', { nodeId: root.nodeId, selector });
  // The protocol answers 0 when no element matches
  if (!nodeId) return { name: '', description: '' };

  const { nodes } = await session.send('Accessibility.getPartialAXTree', {
    nodeId,
    fetchRelatives: false,
  });
  const [node] = nodes;
  return { name: getText(node?.name?.value), description: getText(node?.description?.value) };
};
