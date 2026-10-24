// @vitest-environment node
import { existsSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';

import type { Connect } from 'vite';

import { BUILD_FILES, OUT_DIR, serve, writeBuild } from './previewTestUtils.ts';

describe('writeBuild', () => {
  it('writes every file of the fake build in a new project', () => {
    const { projectDir, root } = writeBuild();

    try {
      expect(root).toBe(join(projectDir, OUT_DIR));
      Object.entries(BUILD_FILES).forEach(([file, content]) => {
        expect(readFileSync(join(root, file), 'utf8')).toBe(content);
      });
    } finally {
      rmSync(projectDir, { recursive: true, force: true });
    }
    expect(existsSync(projectDir)).toBe(false);
  });

  it('gives each call its own project', () => {
    const first = writeBuild();
    const second = writeBuild();

    try {
      expect(second.projectDir).not.toBe(first.projectDir);
    } finally {
      rmSync(first.projectDir, { recursive: true, force: true });
      rmSync(second.projectDir, { recursive: true, force: true });
    }
  });
});

describe('serve', () => {
  it('reads the status, the headers and the body that a middleware answers', () => {
    const middleware: Connect.NextHandleFunction = (request, response) => {
      response.statusCode += 4;
      response.setHeader('X-Method', String(request.method));
      response.setHeader('X-Url', String(request.url));
      response.end('body');
    };

    const answer = serve({ middleware, url: '/a' });

    expect(answer).toEqual({
      statusCode: 204,
      headers: new Map([
        ['X-Method', 'GET'],
        ['X-Url', '/a'],
      ]),
      body: 'body',
      isPassed: false,
    });
  });

  it('tells a request handed to the next middleware, with the method given', () => {
    const middleware: Connect.NextHandleFunction = (request, response, next) => {
      response.setHeader('X-Method', String(request.method));
      next();
    };

    const answer = serve({ middleware, method: 'HEAD' });

    expect(answer.isPassed).toBe(true);
    expect(answer.statusCode).toBe(200);
    expect(answer.headers.get('X-Method')).toBe('HEAD');
    expect(answer.body).toBeUndefined();
  });
});
