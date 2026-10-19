import type { CDPSession } from '@playwright/test';

import { NETWORK_PROTOCOLS } from './constants.ts';

/**
 * DevTools protocol session of a page, from `page.context().newCDPSession(page)`. Only its `on`
 * and `send` are used, so the tests can pass a fake one.
 */
type ProtocolSession = Pick<CDPSession, 'on' | 'send'>;

/**
 * Priority at which Chromium downloads a file, from the lowest to the highest: `VeryLow`, `Low`,
 * `Medium`, `High` or `VeryHigh`.
 */
export type DownloadPriority = 'VeryLow' | 'Low' | 'Medium' | 'High' | 'VeryHigh';

/**
 * Reads the path of the file that a request downloads from a host, e.g. `/projects.webp`.
 *
 * @returns `undefined` for a request that goes to no host, such as a `data:` URL, and for a value
 * that is not a valid absolute URL.
 */
const getRequestPath = (url: string) => {
  if (!URL.canParse(url)) return undefined;

  const { protocol, pathname } = new URL(url);
  const goesToAHost = (NETWORK_PROTOCOLS as readonly string[]).includes(protocol);
  return goesToAHost ? pathname : undefined;
};

/**
 * Records the priority at which Chromium downloads each file that a page requests, through the
 * DevTools protocol: the priority of its request, then each change of it, such as the high
 * priority that Chromium gives an image once it shows on the screen. Call it before the page
 * loads, with a session of that page.
 *
 * @param session - DevTools protocol session of the page.
 * @returns The last priority of each file, by its path (`/projects.webp`), which fills as the page
 * loads. A request that goes to no host, such as one of a `data:` URL, is left out.
 *
 * @example
 * const priorities = await recordDownloadPriorities(await page.context().newCDPSession(page));
 * await page.goto('/projects');
 * priorities.get('/projects.webp'); // 'Low'
 */
export const recordDownloadPriorities = async (
  session: ProtocolSession,
): Promise<Map<string, DownloadPriority>> => {
  const priorities = new Map<string, DownloadPriority>();
  const pathsByRequestId = new Map<string, string>();

  session.on('Network.requestWillBeSent', ({ requestId, request }) => {
    const path = getRequestPath(request.url);
    if (path === undefined) return;

    pathsByRequestId.set(requestId, path);
    priorities.set(path, request.initialPriority);
  });
  session.on('Network.resourceChangedPriority', ({ requestId, newPriority }) => {
    const path = pathsByRequestId.get(requestId);
    if (path !== undefined) priorities.set(path, newPriority);
  });
  await session.send('Network.enable');

  return priorities;
};
