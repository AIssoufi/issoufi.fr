import {
  getBrowserAccessibleText,
  listBrowserHeadingLevels,
  listBrowserTexts,
} from './accessibility';

/** Node id of the document in the fake protocol. */
const DOCUMENT_NODE_ID = 1;

/** Node id of the element that the selector of these tests matches. */
const ELEMENT_NODE_ID = 7;

/** Selector of the element read in these tests. */
const SELECTOR = 'a[download]';

/** Parameters of {@link createFakeSession}. */
interface CreateFakeSessionParams {
  /** Nodes that `Accessibility.getPartialAXTree` answers, the read element first. */
  nodes?: unknown[];
  /** Whether an element matches {@link SELECTOR}. @default true */
  hasElement?: boolean;
  /** Command that rejects with `error`, as when the protocol fails. None when missing. */
  failingMethod?: string;
  /** Error of the {@link CreateFakeSessionParams.failingMethod}. */
  error?: Error;
}

/**
 * Creates a fake DevTools protocol session that answers the commands of
 * `getBrowserAccessibleText` from the accessibility nodes it is given.
 */
const createFakeSession = ({
  nodes = [],
  hasElement = true,
  failingMethod,
  error,
}: CreateFakeSessionParams = {}) => {
  const send = vi.fn(async (method: string, params: Record<string, unknown> = {}) => {
    if (method === failingMethod) throw error;

    switch (method) {
      case 'DOM.getDocument':
        return { root: { nodeId: DOCUMENT_NODE_ID } };
      case 'DOM.querySelector': {
        const isMatch = hasElement && params.selector === SELECTOR;
        return { nodeId: isMatch ? ELEMENT_NODE_ID : 0 };
      }
      case 'Accessibility.getPartialAXTree':
        return { nodes };
      default:
        throw new Error(`Unexpected command ${method}`);
    }
  });
  // The real `send` is typed by command: only its calls matter here
  return { session: { send } as never, send };
};

describe('getBrowserAccessibleText', () => {
  it('reads the name and the description that the browser computes', async () => {
    const { session, send } = createFakeSession({
      nodes: [
        {
          name: { type: 'computedString', value: 'Download the CV' },
          description: { type: 'computedString', value: 'PDF, 120 kB' },
        },
        { name: { type: 'computedString', value: 'CV' } },
      ],
    });

    expect(await getBrowserAccessibleText({ session, selector: SELECTOR })).toEqual({
      name: 'Download the CV',
      description: 'PDF, 120 kB',
    });
    expect(send).toHaveBeenCalledWith('DOM.querySelector', {
      nodeId: DOCUMENT_NODE_ID,
      selector: SELECTOR,
    });
    expect(send).toHaveBeenCalledWith('Accessibility.getPartialAXTree', {
      nodeId: ELEMENT_NODE_ID,
      fetchRelatives: false,
    });
  });

  it('gives an empty description to an element without one', async () => {
    const { session } = createFakeSession({
      nodes: [{ name: { type: 'computedString', value: 'Télécharger le CV' } }],
    });

    expect(await getBrowserAccessibleText({ session, selector: SELECTOR })).toEqual({
      name: 'Télécharger le CV',
      description: '',
    });
  });

  it('reads nothing when no element matches', async () => {
    const { session, send } = createFakeSession({ hasElement: false });

    expect(await getBrowserAccessibleText({ session, selector: SELECTOR })).toEqual({
      name: '',
      description: '',
    });
    expect(send).not.toHaveBeenCalledWith('Accessibility.getPartialAXTree', expect.anything());
  });

  describe('edge cases', () => {
    it.each([
      ['no node', []],
      ['a node without a name', [{}]],
      ['a name without a value', [{ name: { type: 'computedString' } }]],
      ['a name that is not a string', [{ name: { type: 'integer', value: 3 } }]],
      ['a null node', [null]],
    ])('reads an empty name from %s', async (_case, nodes) => {
      const { session } = createFakeSession({ nodes });

      expect(await getBrowserAccessibleText({ session, selector: SELECTOR })).toEqual({
        name: '',
        description: '',
      });
    });

    it('reads an empty description from a description that is not a string', async () => {
      const { session } = createFakeSession({
        nodes: [
          {
            name: { type: 'computedString', value: 'CV' },
            description: { type: 'integer', value: 3 },
          },
        ],
      });

      expect(await getBrowserAccessibleText({ session, selector: SELECTOR })).toEqual({
        name: 'CV',
        description: '',
      });
    });

    it('rejects with the error of the protocol', async () => {
      const error = new Error('DOM.querySelector: invalid selector');
      const { session } = createFakeSession({ failingMethod: 'DOM.querySelector', error });

      await expect(getBrowserAccessibleText({ session, selector: '[' })).rejects.toBe(error);
    });
  });
});

/** Node ids of the elements that the selector of the tree tests matches, in the order of the page. */
const ROW_NODE_IDS = [11, 12];

/** Selector of the elements read in the tree tests. */
const ROW_SELECTOR = 'li';

/** A `StaticText` node of the accessibility tree, ignored by the browser or not. */
const textNode = (value: unknown, ignored = false) => ({
  role: { type: 'role', value: 'StaticText' },
  name: { type: 'computedString', value },
  ignored,
});

/** A heading node of the accessibility tree, at a level, ignored by the browser or not. */
const headingNode = (level: unknown, ignored = false) => ({
  role: { type: 'role', value: 'heading' },
  properties: [{ name: 'level', value: { type: 'integer', value: level } }],
  ignored,
});

/** Parameters of {@link createFakeTreeSession}. */
interface CreateFakeTreeSessionParams {
  /** Nodes that `Accessibility.queryAXTree` answers for each node id, by node id. */
  nodesById?: Record<number, unknown>;
  /** Node ids that `DOM.querySelectorAll` answers for {@link ROW_SELECTOR}. */
  nodeIds?: number[];
  /** Command that rejects with `error`, as when the protocol fails. None when missing. */
  failingMethod?: string;
  /** Error of the {@link CreateFakeTreeSessionParams.failingMethod}. */
  error?: Error;
}

/**
 * Creates a fake DevTools protocol session that answers the commands of `listBrowserTexts` and
 * `listBrowserHeadingLevels` from the accessibility nodes it is given for each element.
 */
const createFakeTreeSession = ({
  nodesById = {},
  nodeIds = ROW_NODE_IDS,
  failingMethod,
  error,
}: CreateFakeTreeSessionParams = {}) => {
  const send = vi.fn(async (method: string, params: Record<string, unknown> = {}) => {
    if (method === failingMethod) throw error;

    switch (method) {
      case 'DOM.getDocument':
        return { root: { nodeId: DOCUMENT_NODE_ID } };
      case 'DOM.querySelectorAll':
        return { nodeIds: params.selector === ROW_SELECTOR ? nodeIds : [] };
      case 'Accessibility.queryAXTree':
        return { nodes: nodesById[params.nodeId as number] ?? [] };
      default:
        throw new Error(`Unexpected command ${method}`);
    }
  });
  // The real `send` is typed by command: only its calls matter here
  return { session: { send } as never, send };
};

describe('listBrowserTexts', () => {
  it('reads the texts of each element, without the ignored ones, in the order of the page', async () => {
    const { session, send } = createFakeTreeSession({
      nodesById: {
        11: [textNode('août 2021'), textNode('↓', true), textNode('à'), textNode('Aujourd’hui')],
        12: [textNode('sept. 2019'), textNode(' '), textNode('à'), textNode('juin 2021')],
      },
    });

    expect(await listBrowserTexts({ session, selector: ROW_SELECTOR })).toEqual([
      'août 2021 à Aujourd’hui',
      'sept. 2019 à juin 2021',
    ]);
    expect(send).toHaveBeenCalledWith('DOM.querySelectorAll', {
      nodeId: DOCUMENT_NODE_ID,
      selector: ROW_SELECTOR,
    });
    expect(send).toHaveBeenCalledWith('Accessibility.queryAXTree', {
      nodeId: 11,
      role: 'StaticText',
    });
  });

  it('collapses the runs of white space of the texts, and trims them', async () => {
    const { session } = createFakeTreeSession({
      nodesById: { 11: [textNode('  Owner et référent\n'), textNode('\t~15 équipes  ')] },
      nodeIds: [11],
    });

    expect(await listBrowserTexts({ session, selector: ROW_SELECTOR })).toEqual([
      'Owner et référent ~15 équipes',
    ]);
  });

  it('reads an empty text in an element without texts', async () => {
    const { session } = createFakeTreeSession({ nodeIds: [11] });

    expect(await listBrowserTexts({ session, selector: ROW_SELECTOR })).toEqual(['']);
  });

  it('reads nothing when no element matches', async () => {
    const { session, send } = createFakeTreeSession();

    expect(await listBrowserTexts({ session, selector: 'article' })).toEqual([]);
    expect(send).not.toHaveBeenCalledWith('Accessibility.queryAXTree', expect.anything());
  });

  describe('edge cases', () => {
    it.each([
      ['a node without a name', [{}, textNode('à')]],
      ['a name without a value', [{ name: { type: 'computedString' } }, textNode('à')]],
      ['a name that is not a string', [textNode(3), textNode('à')]],
      ['a null node', [null, textNode('à')]],
    ])('reads the other texts next to %s', async (_case, nodes) => {
      const { session } = createFakeTreeSession({ nodesById: { 11: nodes }, nodeIds: [11] });

      expect(await listBrowserTexts({ session, selector: ROW_SELECTOR })).toEqual(['à']);
    });

    it('reads an empty text when the nodes are not a list', async () => {
      const { session } = createFakeTreeSession({ nodesById: { 11: null }, nodeIds: [11] });

      expect(await listBrowserTexts({ session, selector: ROW_SELECTOR })).toEqual(['']);
    });

    it('rejects with the error of the protocol', async () => {
      const error = new Error('DOM.querySelectorAll: invalid selector');
      const { session } = createFakeTreeSession({ failingMethod: 'DOM.querySelectorAll', error });

      await expect(listBrowserTexts({ session, selector: '[' })).rejects.toBe(error);
    });
  });
});

describe('listBrowserHeadingLevels', () => {
  it('reads the levels of the headings of the first element, without the ignored ones', async () => {
    const { session, send } = createFakeTreeSession({
      nodesById: {
        11: [headingNode(1), headingNode(2), headingNode(3, true), headingNode(3)],
        12: [headingNode(6)],
      },
    });

    expect(await listBrowserHeadingLevels({ session, selector: ROW_SELECTOR })).toEqual([1, 2, 3]);
    expect(send).toHaveBeenCalledWith('Accessibility.queryAXTree', { nodeId: 11, role: 'heading' });
    expect(send).not.toHaveBeenCalledWith('Accessibility.queryAXTree', {
      nodeId: 12,
      role: 'heading',
    });
  });

  it('reads no level when no element matches', async () => {
    const { session, send } = createFakeTreeSession();

    expect(await listBrowserHeadingLevels({ session, selector: 'main' })).toEqual([]);
    expect(send).not.toHaveBeenCalledWith('Accessibility.queryAXTree', expect.anything());
  });

  describe('edge cases', () => {
    it.each([
      ['no properties', { role: { type: 'role', value: 'heading' } }],
      ['no level property', { properties: [{ name: 'busy', value: { value: false } }] }],
      ['a level without a value', { properties: [{ name: 'level' }] }],
      ['a level that is not a number', headingNode('2')],
      ['a null property', { properties: [null] }],
    ])('reads level 0 for a heading with %s', async (_case, heading) => {
      const { session } = createFakeTreeSession({ nodesById: { 11: [heading] }, nodeIds: [11] });

      expect(await listBrowserHeadingLevels({ session, selector: ROW_SELECTOR })).toEqual([0]);
    });

    it('rejects with the error of the protocol', async () => {
      const error = new Error('Accessibility.queryAXTree: no node');
      const { session } = createFakeTreeSession({
        failingMethod: 'Accessibility.queryAXTree',
        error,
      });

      await expect(listBrowserHeadingLevels({ session, selector: ROW_SELECTOR })).rejects.toBe(
        error,
      );
    });
  });
});
