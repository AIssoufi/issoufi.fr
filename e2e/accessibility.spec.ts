import { countBrowserNodes, listBrowserHeadingLevels, listBrowserTexts } from './accessibility.ts';

/** Node id of the document in the fake protocol. */
const DOCUMENT_NODE_ID = 1;

/**
 * Node ids of the elements that the selector of the tree tests matches, in the order of the page.
 */
const ROW_NODE_IDS = [11, 12];

/** Selector of the elements read in the tree tests. */
const ROW_SELECTOR = 'li';

/** Parameters of {@link textNode}. */
interface TextNodeParams {
  /** Value of the name of the node, a string as the browser gives it, or any value to test. */
  value?: unknown;
  /** Whether the browser ignores the node. */
  ignored?: boolean;
}

/** A `StaticText` node of the accessibility tree, ignored by the browser or not. */
const textNode = ({ value, ignored = false }: TextNodeParams) => ({
  role: { type: 'role', value: 'StaticText' },
  name: { type: 'computedString', value },
  ignored,
});

/** Parameters of {@link headingNode}. */
interface HeadingNodeParams {
  /** Level of the heading, an integer as the browser gives it, or any value to test. */
  level?: unknown;
  /** Whether the browser ignores the node. */
  ignored?: boolean;
}

/** A heading node of the accessibility tree, at a level, ignored by the browser or not. */
const headingNode = ({ level, ignored = false }: HeadingNodeParams) => ({
  role: { type: 'role', value: 'heading' },
  properties: [{ name: 'level', value: { type: 'integer', value: level } }],
  ignored,
});

/** An image node of the accessibility tree, ignored by the browser or not. */
const imageNode = (ignored = false) => ({ role: { type: 'role', value: 'image' }, ignored });

/** Parameters of {@link createFakeTreeSession}. */
interface CreateFakeTreeSessionParams {
  /**
   * Nodes that `Accessibility.queryAXTree` answers for each node id, by node id, as they are, even
   * when not a list. An empty list for a node id missing from it.
   */
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
      case 'Accessibility.queryAXTree': {
        const nodeId = params.nodeId as number;
        return { nodes: nodeId in nodesById ? nodesById[nodeId] : [] };
      }
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
        11: [
          textNode({ value: 'août 2021' }),
          textNode({ value: '↓', ignored: true }),
          textNode({ value: 'à' }),
          textNode({ value: 'Aujourd’hui' }),
        ],
        12: [
          textNode({ value: 'sept. 2019' }),
          textNode({ value: ' ' }),
          textNode({ value: 'à' }),
          textNode({ value: 'juin 2021' }),
        ],
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
      nodesById: {
        11: [textNode({ value: '  Owner et référent\n' }), textNode({ value: '\t~15 équipes  ' })],
      },
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
      ['a node without a name', [{}, textNode({ value: 'à' })]],
      ['a name without a value', [{ name: { type: 'computedString' } }, textNode({ value: 'à' })]],
      ['a name that is not a string', [textNode({ value: 3 }), textNode({ value: 'à' })]],
      ['a null node', [null, textNode({ value: 'à' })]],
    ])('reads the other texts next to %s', async (_case, nodes) => {
      const { session } = createFakeTreeSession({ nodesById: { 11: nodes }, nodeIds: [11] });

      expect(await listBrowserTexts({ session, selector: ROW_SELECTOR })).toEqual(['à']);
    });

    it.each([
      ['missing', undefined],
      ['null', null],
      ['a node rather than a list', textNode({ value: 'à' })],
      ['a string', 'à'],
    ])('reads an empty text when the nodes are %s', async (_case, nodes) => {
      const { session } = createFakeTreeSession({ nodesById: { 11: nodes }, nodeIds: [11] });

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
        11: [
          headingNode({ level: 1 }),
          headingNode({ level: 2 }),
          headingNode({ level: 3, ignored: true }),
          headingNode({ level: 3 }),
        ],
        12: [headingNode({ level: 6 })],
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
      ['a level that is not a number', headingNode({ level: '2' })],
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

describe('countBrowserNodes', () => {
  it('counts the nodes of the role in each element, without the ignored ones', async () => {
    const { session, send } = createFakeTreeSession({
      nodesById: { 11: [imageNode(), imageNode(true), imageNode()], 12: [imageNode(true)] },
    });

    expect(await countBrowserNodes({ session, selector: ROW_SELECTOR, role: 'image' })).toEqual([
      2, 0,
    ]);
    expect(send).toHaveBeenCalledWith('Accessibility.queryAXTree', { nodeId: 12, role: 'image' });
  });

  it('counts nothing when no element matches', async () => {
    const { session, send } = createFakeTreeSession();

    expect(await countBrowserNodes({ session, selector: 'article', role: 'image' })).toEqual([]);
    expect(send).not.toHaveBeenCalledWith('Accessibility.queryAXTree', expect.anything());
  });

  describe('edge cases', () => {
    it.each([
      ['are not a list', null],
      ['are missing', undefined],
    ])('counts no node when the nodes %s', async (_case, nodes) => {
      const { session } = createFakeTreeSession({ nodesById: { 11: nodes }, nodeIds: [11] });

      expect(await countBrowserNodes({ session, selector: ROW_SELECTOR, role: 'image' })).toEqual([
        0,
      ]);
    });

    it('skips a null node', async () => {
      const { session } = createFakeTreeSession({
        nodesById: { 11: [null, imageNode()] },
        nodeIds: [11],
      });

      expect(await countBrowserNodes({ session, selector: ROW_SELECTOR, role: 'image' })).toEqual([
        1,
      ]);
    });

    it('rejects with the error of the protocol', async () => {
      const error = new Error('Accessibility.queryAXTree: no node');
      const { session } = createFakeTreeSession({
        failingMethod: 'Accessibility.queryAXTree',
        error,
      });

      await expect(
        countBrowserNodes({ session, selector: ROW_SELECTOR, role: 'image' }),
      ).rejects.toBe(error);
    });
  });
});
