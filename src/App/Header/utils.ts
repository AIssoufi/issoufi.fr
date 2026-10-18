/**
 * Lists the ancestors of an element inside the page body, from its parent up to `<body>`
 * included.
 *
 * @param element - Element whose ancestors are listed.
 * @returns An empty list for `<body>` itself, and for an element outside the body or detached
 * from the document.
 */
export function getAncestorsInBody(element: Element): Element[] {
  const { body } = element.ownerDocument;
  const isInsideBody = element !== body && Boolean(body?.contains(element));
  if (!isInsideBody) return [];

  const ancestors: Element[] = [];
  for (let parent = element.parentElement; parent; parent = parent.parentElement) {
    ancestors.push(parent);
    if (parent === body) break;
  }
  return ancestors;
}

/**
 * Lists every element of the page around a container: the other children of its parent, then of
 * each ancestor up to `<body>`. Together they hold the whole page but the container, so making
 * them inert leaves only the container reachable.
 *
 * @example
 * // <body><header><a/><div id="menu"/></header><main/></body>
 * getElementsOutside(menu); // [a, main]
 *
 * @param container - Element left out, with everything inside it.
 * @returns An empty list when the container is not inside the page body (see
 * {@link getAncestorsInBody}).
 */
export function getElementsOutside(container: Element): Element[] {
  return getAncestorsInBody(container).flatMap(ancestor =>
    [...ancestor.children].filter(child => !child.contains(container)),
  );
}
