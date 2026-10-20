import { recordDownloadPriorities } from './priorities.ts';

/** Listener of an event of the DevTools protocol, as the fake session keeps it. */
type Listener = (payload: never) => void;

/** Parameters of the `emit` of {@link createFakeSession}. */
interface EmitParams {
  /** Name of the event, e.g. `Network.requestWillBeSent`. */
  event: string;
  /** Data of the event, as Chromium sends it. */
  payload: unknown;
}

/**
 * Creates a fake DevTools protocol session that keeps the listeners of each event, and `emit`,
 * which calls them as Chromium would send the event.
 */
const createFakeSession = () => {
  const listeners = new Map<string, Listener[]>();
  const session = {
    on: vi.fn((event: string, listener: Listener) => {
      listeners.set(event, [...(listeners.get(event) ?? []), listener]);
      return session;
    }),
    send: vi.fn(async () => ({})),
  };
  const emit = ({ event, payload }: EmitParams) =>
    listeners.get(event)?.forEach(listener => listener(payload as never));

  return { session, emit };
};

/** Parameters of {@link sendRequest}. */
interface SendRequestParams {
  /** Emits an event of the fake session. */
  emit: (params: EmitParams) => void;
  /** Id of the request. */
  requestId: string;
  /** Absolute URL of the request. */
  url: string;
  /** Priority of the request when the browser sends it. */
  initialPriority: string;
}

/** Emits the event of a request that the browser sends. */
const sendRequest = ({ emit, requestId, url, initialPriority }: SendRequestParams) =>
  emit({
    event: 'Network.requestWillBeSent',
    payload: { requestId, request: { url, initialPriority } },
  });

describe('recordDownloadPriorities', () => {
  it('turns on the network events of the session, then records each request by its path', async () => {
    const { session, emit } = createFakeSession();
    const priorities = await recordDownloadPriorities(session as never);
    sendRequest({
      emit,
      requestId: '1',
      url: 'http://localhost:4173/en/projects',
      initialPriority: 'VeryHigh',
    });
    sendRequest({
      emit,
      requestId: '2',
      url: 'http://localhost:4173/projects.webp?v=2',
      initialPriority: 'Low',
    });

    expect(session.send).toHaveBeenCalledWith('Network.enable');
    expect(Object.fromEntries(priorities)).toEqual({
      '/en/projects': 'VeryHigh',
      '/projects.webp': 'Low',
    });
  });

  it('keeps the last priority of a request, as the browser changes it', async () => {
    const { session, emit } = createFakeSession();
    const priorities = await recordDownloadPriorities(session as never);
    sendRequest({
      emit,
      requestId: '1',
      url: 'https://issoufi.fr/chess-720.webp',
      initialPriority: 'Low',
    });
    emit({
      event: 'Network.resourceChangedPriority',
      payload: { requestId: '1', newPriority: 'High' },
    });

    expect(priorities.get('/chess-720.webp')).toBe('High');
  });

  it('keeps the priority of the last request of a file requested twice', async () => {
    const { session, emit } = createFakeSession();
    const priorities = await recordDownloadPriorities(session as never);
    sendRequest({ emit, requestId: '1', url: 'http://localhost/a.js', initialPriority: 'High' });
    sendRequest({ emit, requestId: '2', url: 'http://localhost/a.js', initialPriority: 'Low' });

    expect(priorities.get('/a.js')).toBe('Low');
  });

  describe('edge cases', () => {
    it.each([
      ['a data URL', 'data:image/webp;base64,UklGR'],
      ['a blob URL', 'blob:http://localhost/1a2b'],
      ['a value that is not a URL', 'not a url'],
      ['an empty URL', ''],
    ])('leaves out %s, which goes to no host', async (_, url) => {
      const { session, emit } = createFakeSession();
      const priorities = await recordDownloadPriorities(session as never);
      sendRequest({ emit, requestId: '1', url, initialPriority: 'Low' });
      emit({
        event: 'Network.resourceChangedPriority',
        payload: { requestId: '1', newPriority: 'High' },
      });

      expect(priorities.size).toBe(0);
    });

    it('ignores a change of priority of a request that it did not record', async () => {
      const { session, emit } = createFakeSession();
      const priorities = await recordDownloadPriorities(session as never);
      emit({
        event: 'Network.resourceChangedPriority',
        payload: { requestId: 'unknown', newPriority: 'High' },
      });

      expect(priorities.size).toBe(0);
    });
  });
});
