import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import type { IncomingMessage, OutgoingHttpHeaders, ServerResponse } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import type { Connect } from 'vite';

/** Folder of the build in the fake project, as `build.outDir` names it. */
export const OUT_DIR = 'dist';

/** Prefix of the temporary folder of the fake project. */
const PROJECT_DIR_PREFIX = 'preview-build-';

/** Contents of the files of the fake build, by their path from its root. */
export const BUILD_FILES: Record<string, string> = {
  'index.html': '<title>Accueil</title>',
  'projects.html': '<title>Projets</title>',
  '404.html': '<title>Page introuvable</title>',
  'en/index.html': '<title>Home</title>',
  'en/404.html': '<title>Page not found</title>',
  'assets/index-a1b2.js': 'console.log(1);',
  _headers: '/*\n  X-Frame-Options: DENY\n',
};

/** HTTP headers that the fake preview sends with every file. */
export const HEADERS: OutgoingHttpHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'Content-Security-Policy': "default-src 'self'",
};

/** Folders of a fake project written by {@link writeBuild}. */
interface FakeBuild {
  /** Absolute path of the temporary project, to remove after the test. */
  projectDir: string;
  /** Absolute path of its build, `<projectDir>/dist`. */
  root: string;
}

/**
 * Writes the files of {@link BUILD_FILES} into the build of a new temporary project.
 *
 * @returns The folders of the project and of its build; the caller removes the project.
 * @example
 * const { projectDir, root } = writeBuild();
 * rmSync(projectDir, { recursive: true, force: true });
 */
export const writeBuild = (): FakeBuild => {
  const projectDir = mkdtempSync(join(tmpdir(), PROJECT_DIR_PREFIX));
  const root = join(projectDir, OUT_DIR);
  Object.entries(BUILD_FILES).forEach(([file, content]) => {
    mkdirSync(join(root, file, '..'), { recursive: true });
    writeFileSync(join(root, file), content);
  });
  return { projectDir, root };
};

/** Parameters of {@link serve}. */
interface ServeParams {
  /** The middleware under test. */
  middleware: Connect.NextHandleFunction;
  /** URL of the request, as Node.js gives it. */
  url?: unknown;
  /** Method of the request. */
  method?: string;
}

/** What a middleware answered to {@link serve}. */
interface ServeAnswer {
  /** Status of the response, 200 when the middleware set none. */
  statusCode: number;
  /** Headers that the middleware set, by their name. */
  headers: Map<string, unknown>;
  /** Body that the middleware ended the response with, if any. */
  body: unknown;
  /** Whether the middleware handed the request to the next one. */
  isPassed: boolean;
}

/**
 * Runs a middleware on a fake request, and reads what it answered.
 *
 * @example
 * const answer = serve({ middleware, url: '/nope' });
 * expect(answer.statusCode).toBe(404);
 */
export const serve = ({ middleware, url, method = 'GET' }: ServeParams): ServeAnswer => {
  const headers = new Map<string, unknown>();
  const answer = { statusCode: 200, headers, body: undefined as unknown, isPassed: false };
  const response = {
    get statusCode() {
      return answer.statusCode;
    },
    set statusCode(statusCode: number) {
      answer.statusCode = statusCode;
    },
    setHeader: (name: string, value: unknown) => headers.set(name, value),
    end: (body: unknown) => {
      answer.body = body;
    },
  };
  middleware({ url, method } as IncomingMessage, response as unknown as ServerResponse, () => {
    answer.isPassed = true;
  });
  return answer;
};
