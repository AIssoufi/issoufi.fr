import type { CDPSession } from '@playwright/test';

/**
 * DevTools protocol session of a page, from `page.context().newCDPSession(page)`. Only its `send`
 * is used, so the tests can pass a fake one.
 */
type ProtocolSession = Pick<CDPSession, 'send'>;

/** Text of a value of the accessibility tree, or `''` when it holds no string. */
const getText = (value: unknown): string => (typeof value === 'string' ? value : '');

/** One or more white space characters, line breaks included. */
const WHITE_SPACE_PATTERN = /\s+/g;

/** Parameters of {@link listBrowserTexts} and {@link listBrowserHeadingLevels}. */
interface ReadBrowserTreeParams {
  /** Session of the page to read. */
  session: ProtocolSession;
  /** CSS selector of the elements to read. */
  selector: string;
}

/** Parameters of {@link queryBrowserNodes}. */
interface QueryBrowserNodesParams {
  /** Session of the page to read. */
  session: ProtocolSession;
  /** Node id of the element whose descendants are queried, in the DOM domain of the protocol. */
  nodeId: number;
  /** Role of the nodes to return, such as `StaticText` or `heading`. */
  role: string;
}

/**
 * Lists the nodes of a role that the accessibility tree of the browser holds inside an element,
 * in the order of the page, without the nodes it ignores, such as a part hidden by `aria-hidden`.
 */
const queryBrowserNodes = async ({ session, nodeId, role }: QueryBrowserNodesParams) => {
  const { nodes } = await session.send('Accessibility.queryAXTree', { nodeId, role });
  // The nodes are checked, as the other answers of the protocol, rather than trusted
  const isReadNode = (node?: { ignored?: boolean } | null) => Boolean(node) && !node?.ignored;
  return (Array.isArray(nodes) ? nodes : []).filter(isReadNode);
};

/** Node ids of the elements of the page that match a CSS selector, in the order of the page. */
const querySelectorAll = async ({ session, selector }: ReadBrowserTreeParams) => {
  const { root } = await session.send('DOM.getDocument', { depth: 0 });
  const { nodeIds } = await session.send('DOM.querySelectorAll', {
    nodeId: root.nodeId,
    selector,
  });
  return nodeIds;
};

/**
 * Reads the text that the browser gives screen readers in each element that matches a selector:
 * the `StaticText` nodes of its accessibility tree (`Accessibility.queryAXTree` of the DevTools
 * protocol), the generated content of its pseudo-elements included, without what the browser
 * ignores: a part hidden by `aria-hidden` or by `display: none`, or a pseudo-element whose
 * alternative text is empty. jsdom computes no accessibility tree, and ignores the media queries
 * that hide a part on some screens.
 *
 * @returns One text per matching element, in the order of the page: its texts joined with a space,
 * each run of white space collapsed into one, and trimmed. An empty list when no element matches.
 * @throws Rejects with the error of the protocol when one of its commands fails, as for an
 * invalid selector.
 *
 * @example
 * await listBrowserTexts({ session, selector: 'li' });
 * // ['oct. 2025 à Aujourd’hui Développeur Front-End Senior…', …]
 */
export const listBrowserTexts = async ({
  session,
  selector,
}: ReadBrowserTreeParams): Promise<string[]> => {
  const nodeIds = await querySelectorAll({ session, selector });

  return Promise.all(
    nodeIds.map(async nodeId => {
      const nodes = await queryBrowserNodes({ session, nodeId, role: 'StaticText' });
      return nodes
        .map(node => getText(node.name?.value))
        .join(' ')
        .replace(WHITE_SPACE_PATTERN, ' ')
        .trim();
    }),
  );
};

/** Parameters of {@link countBrowserNodes}. */
interface CountBrowserNodesParams extends ReadBrowserTreeParams {
  /** Role of the nodes to count, as the protocol names it, such as `image` or `listitem`. */
  role: string;
}

/**
 * Counts the nodes of a role that the browser gives screen readers in each element that matches a
 * selector, from its accessibility tree (`Accessibility.queryAXTree` of the DevTools protocol),
 * without the nodes it ignores: an image with an empty alternative text, or a part hidden by
 * `aria-hidden` or by `display: none`. The element itself counts when it has the role, as a list
 * item among the items of its own list would.
 *
 * @returns One count per matching element, in the order of the page. An empty list when no
 * element matches.
 * @throws Rejects with the error of the protocol when one of its commands fails, as for an
 * invalid selector.
 *
 * @example
 * await countBrowserNodes({ session, selector: 'section > ul > li', role: 'image' }); // [0, 0]
 */
export const countBrowserNodes = async ({
  session,
  selector,
  role,
}: CountBrowserNodesParams): Promise<number[]> => {
  const nodeIds = await querySelectorAll({ session, selector });

  return Promise.all(
    nodeIds.map(async nodeId => (await queryBrowserNodes({ session, nodeId, role })).length),
  );
};

/**
 * Reads the level of each heading that the browser gives screen readers in the first element that
 * matches a selector, from its accessibility tree, without the headings that it ignores, such as
 * one hidden by `display: none`.
 *
 * @returns The levels in the order of the page, `0` for a heading without one. An empty list when
 * no element matches.
 * @throws Rejects with the error of the protocol when one of its commands fails, as for an
 * invalid selector.
 *
 * @example
 * await listBrowserHeadingLevels({ session, selector: 'main' }); // [1, 2, 3, 4, 3, 2, 3]
 */
export const listBrowserHeadingLevels = async ({
  session,
  selector,
}: ReadBrowserTreeParams): Promise<number[]> => {
  const [nodeId] = await querySelectorAll({ session, selector });
  if (nodeId === undefined) return [];

  const headings = await queryBrowserNodes({ session, nodeId, role: 'heading' });
  return headings.map(heading => {
    const level = heading.properties?.find(property => property?.name === 'level')?.value?.value;
    return typeof level === 'number' ? level : 0;
  });
};
