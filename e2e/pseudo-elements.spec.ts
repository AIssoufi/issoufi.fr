import { getMarkedPseudoElementQuads } from './pseudo-elements';

/** Attribute that marks the measured elements in these tests. */
const ATTRIBUTE = 'data-timeline-dot';

/** Node id of the document in the fake protocol. */
const DOCUMENT_NODE_ID = 1;

/** Pseudo-element of an element of the fake page, as `DOM.describeNode` describes it. */
interface FakePseudoElement {
  /** Type of the pseudo-element, e.g. `before`. */
  pseudoType: string;
  /** Backend node id of the pseudo-element, the key of its quad in the fake page. */
  backendNodeId: number;
}

/** Element of the fake page. */
interface FakeElement {
  /** Value of its {@link ATTRIBUTE}, or `undefined` when it has none. */
  marker?: string;
  /** Its drawn pseudo-elements. Missing when it has none, as the protocol does. */
  pseudoElements?: FakePseudoElement[];
}

/** Parameters of {@link createFakeSession}. */
interface CreateFakeSessionParams {
  /** Elements of the page, in the order of the page. Their node id is their index plus 2. */
  elements?: FakeElement[];
  /** Border quad of each pseudo-element, by backend node id. */
  quads?: Record<number, number[]>;
  /** Command that rejects with `error`, as when the protocol fails. None when missing. */
  failingMethod?: string;
  /** Error of the {@link CreateFakeSessionParams.failingMethod}. */
  error?: Error;
}

/** Selector of the elements that {@link ATTRIBUTE} marks with a value. */
const getSelector = (value: string) => `[${ATTRIBUTE}="${value}"]`;

/**
 * Creates a fake DevTools protocol session that answers the commands of
 * `getMarkedPseudoElementQuads` from a description of the page.
 */
const createFakeSession = ({
  elements = [],
  quads = {},
  failingMethod,
  error,
}: CreateFakeSessionParams = {}) => {
  const getNodeId = (index: number) => index + DOCUMENT_NODE_ID + 1;
  const send = vi.fn(async (method: string, params: Record<string, unknown> = {}) => {
    if (method === failingMethod) throw error;

    switch (method) {
      case 'DOM.getDocument':
        return { root: { nodeId: DOCUMENT_NODE_ID } };
      case 'DOM.querySelectorAll': {
        const nodeIds = elements
          .map((element, index) => ({ element, nodeId: getNodeId(index) }))
          .filter(({ element }) => getSelector(element.marker ?? '') === params.selector)
          .map(({ nodeId }) => nodeId);
        return { nodeIds };
      }
      case 'DOM.describeNode': {
        const element = elements.find((_element, index) => getNodeId(index) === params.nodeId);
        return { node: { pseudoElements: element?.pseudoElements } };
      }
      case 'DOM.getBoxModel':
        return { model: { border: quads[params.backendNodeId as number] } };
      default:
        throw new Error(`Unexpected command ${method}`);
    }
  });
  return { send };
};

/** Parameters of {@link measure}. */
interface MeasureParams {
  /** Fake session, from {@link createFakeSession} or a mock of its own. */
  session: { send: unknown };
  /** Attribute that marks the elements to measure. */
  attribute?: string;
}

/** Calls `getMarkedPseudoElementQuads` with a fake session. */
const measure = ({ session, attribute = ATTRIBUTE }: MeasureParams) =>
  getMarkedPseudoElementQuads({ session: session as never, attribute });

/** Border quads of three pseudo-elements, by backend node id. */
const QUADS = {
  10: [22, 180, 38, 180, 38, 196, 22, 196],
  11: [24, 400, 36, 400, 36, 412, 24, 412],
  12: [106, 200, 122, 200, 122, 216, 106, 216],
};

describe('getMarkedPseudoElementQuads', () => {
  it('measures the pseudo-element that the attribute of each element names', async () => {
    const session = createFakeSession({
      elements: [
        { marker: 'before', pseudoElements: [{ pseudoType: 'before', backendNodeId: 10 }] },
        { marker: 'after', pseudoElements: [{ pseudoType: 'after', backendNodeId: 12 }] },
        { marker: 'before', pseudoElements: [{ pseudoType: 'before', backendNodeId: 11 }] },
      ],
      quads: QUADS,
    });

    await expect(measure({ session })).resolves.toEqual([QUADS[10], QUADS[11], QUADS[12]]);
  });

  it('measures only the named pseudo-element of an element that has both', async () => {
    const session = createFakeSession({
      elements: [
        {
          marker: 'after',
          pseudoElements: [
            { pseudoType: 'before', backendNodeId: 10 },
            { pseudoType: 'after', backendNodeId: 12 },
          ],
        },
      ],
      quads: QUADS,
    });

    await expect(measure({ session })).resolves.toEqual([QUADS[12]]);
  });

  it('looks for the elements in the document, through the attribute and each pseudo-element', async () => {
    const session = createFakeSession();

    await measure({ session });

    expect(session.send).toHaveBeenCalledTimes(3);
    expect(session.send).toHaveBeenCalledWith('DOM.getDocument', { depth: 0 });
    expect(session.send).toHaveBeenCalledWith('DOM.querySelectorAll', {
      nodeId: DOCUMENT_NODE_ID,
      selector: '[data-timeline-dot="before"]',
    });
    expect(session.send).toHaveBeenCalledWith('DOM.querySelectorAll', {
      nodeId: DOCUMENT_NODE_ID,
      selector: '[data-timeline-dot="after"]',
    });
  });

  describe('edge cases', () => {
    it('returns no quads when no element is marked', async () => {
      const session = createFakeSession({
        elements: [{ pseudoElements: [{ pseudoType: 'before', backendNodeId: 10 }] }],
        quads: QUADS,
      });

      await expect(measure({ session })).resolves.toEqual([]);
    });

    it.each([
      ['no pseudo-elements, as with display: none', undefined],
      ['an empty list of pseudo-elements', []],
      ['only the other pseudo-element', [{ pseudoType: 'after', backendNodeId: 12 }]],
      ['only a pseudo-element of another type', [{ pseudoType: 'marker', backendNodeId: 11 }]],
    ])('skips a marked element with %s', async (_case, pseudoElements) => {
      const session = createFakeSession({
        elements: [
          { marker: 'before', pseudoElements },
          { marker: 'before', pseudoElements: [{ pseudoType: 'before', backendNodeId: 10 }] },
        ],
        quads: QUADS,
      });

      await expect(measure({ session })).resolves.toEqual([QUADS[10]]);
    });

    it.each(['', 'marker', 'BEFORE', 'before after'])(
      'ignores an element whose attribute has the value %j',
      async marker => {
        const session = createFakeSession({
          elements: [{ marker, pseudoElements: [{ pseudoType: 'before', backendNodeId: 10 }] }],
          quads: QUADS,
        });

        await expect(measure({ session })).resolves.toEqual([]);
      },
    );

    it('rejects when the protocol does, as for an invalid selector', async () => {
      const error = new Error('DOM Error while querying');
      const session = createFakeSession({ failingMethod: 'DOM.querySelectorAll', error });

      await expect(measure({ session, attribute: '' })).rejects.toBe(error);
    });

    it('rejects when a pseudo-element has no box', async () => {
      const error = new Error('Could not compute box model.');
      const session = createFakeSession({
        elements: [
          { marker: 'before', pseudoElements: [{ pseudoType: 'before', backendNodeId: 10 }] },
        ],
        failingMethod: 'DOM.getBoxModel',
        error,
      });

      await expect(measure({ session })).rejects.toBe(error);
    });
  });
});
