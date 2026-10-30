// @vitest-environment node
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import type { ServerResponse } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { NOT_FOUND_PAGE_MEDIA_TYPE, NOT_FOUND_STATUS } from '../constants.ts';
import { sendNotFoundResponse, sendRedirectResponse, setResponseHeaders } from './responses.ts';

/** Files of the fake build, from its root, each holding its own path. */
const BUILD_FILES = ['404.html', 'en/404.html'];

/** Headers of the preview that the tests give the responses. */
const HEADERS = { 'X-Frame-Options': 'DENY', 'X-Content-Type-Options': 'nosniff' };

/** Response that records what a helper writes, in place of the one of Node.js. */
interface FakeResponse {
  /** Response handed to the helper. */
  response: ServerResponse;
  /** Headers it was given, by name. */
  headers: Map<string, unknown>;
  /** Text of the body it ended with, `undefined` until it ends or when it ends without one. */
  readBody: () => string | undefined;
  /** Whether it was ended. */
  isEnded: () => boolean;
}

/** Creates a response that records its status, headers and body. */
const createFakeResponse = (): FakeResponse => {
  const headers = new Map<string, unknown>();
  let body: Buffer | undefined;
  let isEnded = false;
  const response = {
    statusCode: 200,
    setHeader: (name: string, value: unknown) => headers.set(name, value),
    end: (chunk?: Buffer) => {
      body = chunk;
      isEnded = true;
    },
  } as unknown as ServerResponse;

  return { response, headers, readBody: () => body?.toString(), isEnded: () => isEnded };
};

describe('setResponseHeaders', () => {
  it('gives the response every header', () => {
    const { response, headers } = createFakeResponse();
    setResponseHeaders({ response, headers: HEADERS });
    expect(Object.fromEntries(headers)).toEqual(HEADERS);
  });

  it('leaves out an undefined header', () => {
    const { response, headers } = createFakeResponse();
    setResponseHeaders({ response, headers: { ...HEADERS, 'X-Missing': undefined } });
    expect(headers.has('X-Missing')).toBe(false);
    expect(headers.size).toBe(Object.keys(HEADERS).length);
  });

  it('keeps a header given as a list or a number', () => {
    const { response, headers } = createFakeResponse();
    setResponseHeaders({ response, headers: { 'Set-Cookie': ['a=1', 'b=2'], 'X-Count': 2 } });
    expect(headers.get('Set-Cookie')).toEqual(['a=1', 'b=2']);
    expect(headers.get('X-Count')).toBe(2);
  });

  it('gives no header for none', () => {
    const { response, headers } = createFakeResponse();
    setResponseHeaders({ response, headers: {} });
    expect(headers.size).toBe(0);
  });
});

describe('sendRedirectResponse', () => {
  it('answers with its status, its location, the headers of the preview and no body', () => {
    const { response, headers, readBody, isEnded } = createFakeResponse();

    sendRedirectResponse({ response, status: 302, location: '/en/', headers: HEADERS });

    expect(response.statusCode).toBe(302);
    expect(Object.fromEntries(headers)).toEqual({ ...HEADERS, Location: '/en/' });
    expect(readBody()).toBeUndefined();
    expect(isEnded()).toBe(true);
  });

  it('sends only its location without headers', () => {
    const { response, headers } = createFakeResponse();

    sendRedirectResponse({ response, status: 308, location: 'https://example.com/a' });

    expect(Object.fromEntries(headers)).toEqual({ Location: 'https://example.com/a' });
  });

  it('keeps its location over a header of the preview of that name', () => {
    const { response, headers } = createFakeResponse();

    sendRedirectResponse({
      response,
      status: 301,
      location: '/a',
      headers: { Location: '/preview' },
    });

    expect(headers.get('Location')).toBe('/a');
  });
});

describe('sendNotFoundResponse', () => {
  let root = '';

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'preview-responses-'));
    BUILD_FILES.forEach(file => {
      mkdirSync(join(root, file, '..'), { recursive: true });
      writeFileSync(join(root, file), file);
    });
  });

  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
  });

  it('answers with the not found page, its status and its media type', () => {
    const { response, headers, readBody, isEnded } = createFakeResponse();
    sendNotFoundResponse({ response, root, notFoundPage: '404.html', headers: HEADERS });

    expect(response.statusCode).toBe(NOT_FOUND_STATUS);
    expect(headers.get('Content-Type')).toBe(NOT_FOUND_PAGE_MEDIA_TYPE);
    expect(readBody()).toBe('404.html');
    expect(isEnded()).toBe(true);
  });

  it('sends the headers of the preview', () => {
    const { response, headers } = createFakeResponse();
    sendNotFoundResponse({ response, root, notFoundPage: '404.html', headers: HEADERS });
    expect(headers.get('X-Frame-Options')).toBe('DENY');
    expect(headers.get('X-Content-Type-Options')).toBe('nosniff');
  });

  it('reads a not found page of a folder', () => {
    const { response, readBody } = createFakeResponse();
    sendNotFoundResponse({ response, root, notFoundPage: 'en/404.html' });
    expect(readBody()).toBe('en/404.html');
  });

  it('sends only its media type without headers', () => {
    const { response, headers } = createFakeResponse();
    sendNotFoundResponse({ response, root, notFoundPage: '404.html' });
    expect([...headers.keys()]).toEqual(['Content-Type']);
  });

  it('ends with no body and no media type without a not found page', () => {
    const { response, headers, readBody, isEnded } = createFakeResponse();
    sendNotFoundResponse({ response, root, headers: HEADERS });

    expect(response.statusCode).toBe(NOT_FOUND_STATUS);
    expect(headers.has('Content-Type')).toBe(false);
    expect(headers.get('X-Frame-Options')).toBe('DENY');
    expect(readBody()).toBeUndefined();
    expect(isEnded()).toBe(true);
  });

  it('throws for a not found page that names no file of the build', () => {
    const { response, isEnded } = createFakeResponse();
    const sendMissingPage = () =>
      sendNotFoundResponse({ response, root, notFoundPage: 'nope.html' });
    const sendFolder = () => sendNotFoundResponse({ response, root, notFoundPage: 'en' });

    expect(sendMissingPage).toThrow(expect.objectContaining({ code: 'ENOENT' }));
    expect(sendFolder).toThrow(expect.objectContaining({ code: 'EISDIR' }));
    expect(isEnded()).toBe(false);
  });

  it('ends with no body for an empty not found page', () => {
    const { response, readBody, isEnded } = createFakeResponse();
    sendNotFoundResponse({ response, root, notFoundPage: '' });
    expect(readBody()).toBeUndefined();
    expect(isEnded()).toBe(true);
  });
});
