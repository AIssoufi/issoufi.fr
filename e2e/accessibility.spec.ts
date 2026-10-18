import { getBrowserAccessibleText } from './accessibility';

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
