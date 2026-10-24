import { PLAYWRIGHT_IMAGE_PATTERN, PLAYWRIGHT_IMAGE_PREFIX } from './constants.mjs';
import {
  describeImageProblem,
  findPlaywrightImages,
  findVersionProblems,
} from './playwright-image.mjs';

const DIGEST = `sha256:${'0a'.repeat(32)}`;

/** Image of Playwright at a tag, pinned by its digest, as the WebKit job of ci.yml names it. */
const imageAt = tag => `mcr.microsoft.com/playwright:${tag}@${DIGEST}`;

/** Command that the messages give for the digest of a tag. */
const digestCommand = tag =>
  "curl -sSI -H 'Accept: application/vnd.oci.image.index.v1+json' " +
  `https://mcr.microsoft.com/v2/playwright/manifests/${tag} | grep -i '^docker-content-digest'`;

/** End of the messages that ask for a tag and its digest. */
const fixFor = tag =>
  `Write the tag ${tag} and the digest that this command prints (docs/testing.md, section ` +
  `"In WebKit"): ${digestCommand(tag)}`;

describe('PLAYWRIGHT_IMAGE_PATTERN', () => {
  it('reads the images that start with PLAYWRIGHT_IMAGE_PREFIX, and those only', () => {
    expect(
      PLAYWRIGHT_IMAGE_PATTERN.exec(`${PLAYWRIGHT_IMAGE_PREFIX}v1.64.0-noble`)?.groups,
    ).toEqual({ version: '1.64.0', distribution: '-noble' });
    expect(PLAYWRIGHT_IMAGE_PATTERN.test(`ghcr.io/${PLAYWRIGHT_IMAGE_PREFIX}v1.64.0`)).toBe(false);
    expect(PLAYWRIGHT_IMAGE_PATTERN.test('mcr.microsoft.com/playwright/python:v1.64.0')).toBe(
      false,
    );
  });
});

describe('findPlaywrightImages', () => {
  it('reads each image of Playwright with the line and the column of its image: key', () => {
    const source = [
      'jobs:',
      '  webkit:',
      '    container:',
      '      # The tag names the version of the lockfile',
      `      image: ${imageAt('v1.64.0-noble')} # pinned`,
      '    services:',
      '      redis:',
      `        image: 'redis:8@${DIGEST}'`,
      '      browsers:',
      "        image: 'mcr.microsoft.com/playwright:latest'",
      '    steps:',
      '      - run: |',
      '          image: mcr.microsoft.com/playwright:v1.0.0',
    ].join('\n');

    expect(findPlaywrightImages(source)).toEqual([
      { line: 5, column: 7, image: imageAt('v1.64.0-noble') },
      { line: 10, column: 9, image: 'mcr.microsoft.com/playwright:latest' },
    ]);
  });

  it('finds no image in a workflow without one, or in a value that is not a text', () => {
    expect(findPlaywrightImages('jobs:\n  test:\n    runs-on: ubuntu-latest\n')).toEqual([]);
    expect(findPlaywrightImages('container:\n  image:\n')).toEqual([]);
    expect(findPlaywrightImages('')).toEqual([]);
    expect(findPlaywrightImages(undefined)).toEqual([]);
    expect(findPlaywrightImages(42)).toEqual([]);
  });

  it('skips an image whose name only contains the one of Playwright', () => {
    const source = 'container:\n  image: ghcr.io/mcr.microsoft.com/playwright:v1.64.0\n';

    expect(findPlaywrightImages(source)).toEqual([]);
  });
});

describe('describeImageProblem', () => {
  it('accepts an image whose tag names the version of the lockfile', () => {
    expect(
      describeImageProblem({ image: imageAt('v1.64.0-noble'), lockedVersion: '1.64.0' }),
    ).toBeUndefined();
    expect(
      describeImageProblem({
        image: 'mcr.microsoft.com/playwright:v1.64.0',
        lockedVersion: ' 1.64.0 ',
      }),
    ).toBeUndefined();
  });

  it('asks for the tag of the lockfile, in the same distribution, and the command of its digest', () => {
    expect(describeImageProblem({ image: imageAt('v1.63.0-noble'), lockedVersion: '1.64.0' })).toBe(
      'The tag v1.63.0-noble of this image runs Playwright 1.63.0, but pnpm-lock.yaml installs ' +
        '@playwright/test 1.64.0, whose browsers do not launch in the image of another version. ' +
        fixFor('v1.64.0-noble'),
    );
    expect(
      describeImageProblem({
        image: 'mcr.microsoft.com/playwright:v1.65.1-jammy',
        lockedVersion: '1.64.0',
      }),
    ).toContain(fixFor('v1.64.0-jammy'));
    expect(
      describeImageProblem({
        image: 'mcr.microsoft.com/playwright:v1.65.1',
        lockedVersion: '1.64.0',
      }),
    ).toContain(fixFor('v1.64.0'));
  });

  it('tells apart versions that only share their start', () => {
    expect(
      describeImageProblem({ image: imageAt('v1.64.10-noble'), lockedVersion: '1.64.1' }),
    ).toMatch(/^The tag v1\.64\.10-noble of this image runs Playwright 1\.64\.10, /);
  });

  it('asks for a tag with a version when the tag names none', () => {
    expect(
      describeImageProblem({
        image: 'mcr.microsoft.com/playwright:latest',
        lockedVersion: '1.64.0',
      }),
    ).toBe(
      'The tag of mcr.microsoft.com/playwright:latest names no version of Playwright, such as ' +
        'v1.64.0-noble, so the check cannot compare it with @playwright/test 1.64.0 in ' +
        `pnpm-lock.yaml. ${fixFor('v1.64.0-noble')}`,
    );
    expect(
      describeImageProblem({
        image: `mcr.microsoft.com/playwright@${DIGEST}`,
        lockedVersion: '1.64.0',
      }),
    ).toMatch(/^The tag of mcr\.microsoft\.com\/playwright@sha256:\w+ names no version /);
  });

  it('reports a missing image or a value that is not a text as an image without a version', () => {
    const expected = expect.stringMatching(/^The tag of this image names no version /);

    expect(describeImageProblem({ lockedVersion: '1.64.0' })).toEqual(expected);
    expect(describeImageProblem({ image: 42, lockedVersion: '1.64.0' })).toEqual(expected);
    expect(describeImageProblem({ image: '  ', lockedVersion: '1.64.0' })).toEqual(expected);
  });

  it('reports a lockfile that lists no version, without a tag to write', () => {
    const expected =
      'pnpm-lock.yaml lists no version of @playwright/test under importers:, so the check ' +
      'cannot compare the image of Playwright with it.';

    expect(describeImageProblem({ image: imageAt('v1.64.0-noble') })).toBe(expected);
    expect(describeImageProblem({ image: imageAt('v1.64.0-noble'), lockedVersion: ' ' })).toBe(
      expected,
    );
    expect(describeImageProblem({ image: imageAt('v1.64.0-noble'), lockedVersion: 1 })).toBe(
      expected,
    );
    expect(describeImageProblem()).toBe(expected);
  });
});

describe('findVersionProblems', () => {
  const file = '.github/workflows/ci.yml';

  it('finds no problem when every image runs the version of the lockfile', () => {
    const images = [
      { file, line: 229, column: 7, image: imageAt('v1.64.0-noble') },
      { file, line: 300, column: 9, image: 'mcr.microsoft.com/playwright:v1.64.0-jammy' },
    ];

    expect(findVersionProblems({ images, lockedVersion: '1.64.0' })).toEqual([]);
  });

  it('places a problem on the line of each image of another version', () => {
    const images = [
      { file, line: 229, column: 7, image: imageAt('v1.63.0-noble') },
      { file, line: 300, column: 9, image: imageAt('v1.64.0-noble') },
      { file: '.github/workflows/visual.yml', line: 12, column: 7, image: imageAt('latest') },
    ];

    expect(findVersionProblems({ images, lockedVersion: '1.64.0' })).toEqual([
      {
        file,
        line: 229,
        column: 7,
        message: expect.stringMatching(/^The tag v1\.63\.0-noble of this image runs Playwright /),
      },
      {
        file: '.github/workflows/visual.yml',
        line: 12,
        column: 7,
        message: expect.stringMatching(/^The tag of .+:latest@sha256:\w+ names no version /),
      },
    ]);
  });

  it('reports one problem on the lockfile when it lists no version of @playwright/test', () => {
    const images = [{ file, line: 229, column: 7, image: imageAt('v1.64.0-noble') }];
    const expected = [
      {
        file: 'pnpm-lock.yaml',
        message:
          'pnpm-lock.yaml lists no version of @playwright/test under importers:, so the check ' +
          'cannot compare the image of Playwright with it.',
      },
    ];

    expect(findVersionProblems({ images })).toEqual(expected);
    expect(findVersionProblems({ images, lockedVersion: '' })).toEqual(expected);
    expect(findVersionProblems()).toEqual(expected);
  });

  it('reports one problem on no file when no workflow names an image of Playwright', () => {
    expect(findVersionProblems({ images: [], lockedVersion: '1.64.0' })).toEqual([
      {
        message:
          'No image: key of .github/ names an image of Playwright ' +
          '(mcr.microsoft.com/playwright:v1.64.0-noble@sha256:…), so the check compares ' +
          'nothing: name it as the container of the WebKit job, or remove the check from the ' +
          'workflows job of ci.yml.',
      },
    ]);
    expect(findVersionProblems({ lockedVersion: '1.64.0' })).toHaveLength(1);
  });
});
