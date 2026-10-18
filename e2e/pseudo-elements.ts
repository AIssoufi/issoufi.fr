import type { CDPSession } from '@playwright/test';

import { PSEUDO_ELEMENT_TYPES } from './constants';

/**
 * DevTools protocol session of a page, from `page.context().newCDPSession(page)`. Only its `send`
 * is used, so the tests can pass a fake one.
 */
type ProtocolSession = Pick<CDPSession, 'send'>;

/** Pseudo-element that can draw a part of the timeline, one of {@link PSEUDO_ELEMENT_TYPES}. */
type PseudoType = (typeof PSEUDO_ELEMENT_TYPES)[number];

/** Parameters of {@link getPseudoElementBorderQuads}. */
interface GetPseudoElementBorderQuadsParams {
  /** Session of the page to measure. */
  session: ProtocolSession;
  /** Node id of the document, from `DOM.getDocument`, in which to look for the elements. */
  documentNodeId: number;
  /** CSS selector of the elements whose pseudo-element to measure. */
  selector: string;
  /** Pseudo-element to measure on each of them. */
  pseudoType: PseudoType;
}

/**
 * Measures one pseudo-element of each element that matches a selector. An element whose
 * pseudo-element is not drawn, as with `display: none`, has none in the protocol and is skipped.
 *
 * @returns The `border` quad of each pseudo-element drawn, in the order of the elements in the
 * page.
 */
const getPseudoElementBorderQuads = async ({
  session,
  documentNodeId,
  selector,
  pseudoType,
}: GetPseudoElementBorderQuadsParams): Promise<number[][]> => {
  const { nodeIds } = await session.send('DOM.querySelectorAll', {
    nodeId: documentNodeId,
    selector,
  });
  const descriptions = await Promise.all(
    nodeIds.map(nodeId => session.send('DOM.describeNode', { nodeId })),
  );
  const pseudoElements = descriptions.flatMap(({ node }) =>
    (node.pseudoElements ?? []).filter(child => child.pseudoType === pseudoType),
  );
  const boxModels = await Promise.all(
    pseudoElements.map(({ backendNodeId }) => session.send('DOM.getBoxModel', { backendNodeId })),
  );
  return boxModels.map(({ model }) => model.border);
};

/** Parameters of {@link getMarkedPseudoElementQuads}. */
interface GetMarkedPseudoElementQuadsParams {
  /** Session of the page to measure. */
  session: ProtocolSession;
  /**
   * Attribute that marks the elements to measure, such as `data-timeline-dot`. Its value names the
   * pseudo-element to measure on each one, one of {@link PSEUDO_ELEMENT_TYPES}.
   */
  attribute: string;
}

/**
 * Measures, through the DevTools protocol, the pseudo-element that each element marked with an
 * attribute names in its value, such as the `::before` of `<div data-timeline-dot="before">`. The
 * DOM gives no box for a pseudo-element, but the protocol does (`DOM.getBoxModel`), CSS transforms
 * included. Marked elements whose pseudo-element is not drawn are skipped, and other values of the
 * attribute are ignored.
 *
 * @returns The `border` quad of each pseudo-element drawn, those of `::before` first, then those
 * of `::after`, each in the order of the elements in the page. It rejects when the protocol does,
 * as for an attribute that makes an invalid selector.
 *
 * @example
 * const session = await page.context().newCDPSession(page);
 * await getMarkedPseudoElementQuads({ session, attribute: 'data-timeline-dot' });
 * // [[22, 180, 38, 180, 38, 196, 22, 196], …]
 */
export const getMarkedPseudoElementQuads = async ({
  session,
  attribute,
}: GetMarkedPseudoElementQuadsParams): Promise<number[][]> => {
  // Each call to DOM.getDocument forgets the node ids given before, so it runs once
  const { root } = await session.send('DOM.getDocument', { depth: 0 });
  const quadsByPseudoType = await Promise.all(
    PSEUDO_ELEMENT_TYPES.map(pseudoType =>
      getPseudoElementBorderQuads({
        session,
        documentNodeId: root.nodeId,
        selector: `[${attribute}="${pseudoType}"]`,
        pseudoType,
      }),
    ),
  );
  return quadsByPseudoType.flat();
};
