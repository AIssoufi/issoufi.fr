import { describeImagePinProblem, findJobImages } from './image-pins.mjs';

const DIGEST = 'f2a5f9e1c3d4b5a6978877665544332211009988aabbccddeeff001122334455';

describe('findJobImages', () => {
  it('reads the image of a container written as a string or under its image: key', () => {
    const source = [
      'jobs:',
      '  build:',
      '    container: node:24',
      '  webkit:',
      '    runs-on: ubuntu-latest',
      '    container:',
      '      # Holds the browsers',
      `      image: mcr.microsoft.com/playwright:v1.64.0-noble@sha256:${DIGEST} # v1.64.0`,
      '      options: --user 1001',
    ].join('\n');

    expect(findJobImages(source)).toEqual([
      { job: 'build', line: 3, column: 5, image: 'node:24' },
      {
        job: 'webkit',
        line: 8,
        column: 7,
        image: `mcr.microsoft.com/playwright:v1.64.0-noble@sha256:${DIGEST}`,
      },
    ]);
  });

  it('reads the image of each service, written as a string or under its image: key', () => {
    const source = [
      'jobs:',
      '  test:',
      '    services:',
      "      redis: 'redis:8'",
      '      db:',
      '        image: "postgres:17"',
      '        ports:',
      '          - 5432:5432',
    ].join('\n');

    expect(findJobImages(source)).toEqual([
      { job: 'test', service: 'redis', line: 4, column: 7, image: 'redis:8' },
      { job: 'test', service: 'db', line: 6, column: 9, image: 'postgres:17' },
    ]);
  });

  it('gives an empty image, on the line of its key, to a container or a service that names none', () => {
    const source = [
      'jobs:',
      '  build:',
      '    container:',
      '      options: --user 1001',
      '    services:',
      '      db:',
      '        ports:',
      '          - 5432:5432',
      '  test:',
      '    container:',
      '      image: >-',
      '        node:24',
      '    steps:',
      '      - run: echo',
    ].join('\n');

    expect(findJobImages(source)).toEqual([
      { job: 'build', line: 3, column: 5, image: '' },
      { job: 'build', service: 'db', line: 6, column: 7, image: '' },
      { job: 'test', line: 11, column: 7, image: '' },
    ]);
  });

  it('reads no image of another job, nor an image: key out of a container or a service', () => {
    const source = [
      'runs:',
      '  using: docker',
      '  image: docker://alpine:3.20',
      'jobs:',
      '  build:',
      '    container:',
      '      image: node:24',
      '    steps:',
      '      - uses: owner/build-image@v1',
      '        with:',
      '          image: alpine:3.20',
      '  test:',
      '    services:',
      '      db:',
      '        env:',
      '          image: postgres:17',
      '        image: postgres:18',
    ].join('\n');

    expect(findJobImages(source)).toEqual([
      { job: 'build', line: 7, column: 7, image: 'node:24' },
      { job: 'test', service: 'db', line: 17, column: 9, image: 'postgres:18' },
    ]);
  });

  it('skips the container: lines of a script', () => {
    const source = [
      'jobs:',
      '  build:',
      '    steps:',
      '      - run: |',
      '          container: node:24',
    ].join('\n');

    expect(findJobImages(source)).toEqual([]);
  });

  it.each(['', 'name: CI\n', undefined, null, 42, ['jobs:']])('reads no image from %o', source => {
    expect(findJobImages(source)).toEqual([]);
  });
});

describe('describeImagePinProblem', () => {
  it.each([
    `node:24@sha256:${DIGEST}`,
    `node@sha256:${DIGEST}`,
    `mcr.microsoft.com/playwright:v1.64.0-noble@sha256:${DIGEST}`,
    `  ghcr.io/owner/image:1.2.3@sha256:${DIGEST}  `,
  ])('accepts %s, pinned by its digest', image => {
    expect(describeImagePinProblem({ image, job: 'test' })).toBeUndefined();
  });

  it.each([
    'node:24',
    'node',
    'mcr.microsoft.com/playwright:v1.64.0-noble',
    `node:24@sha256:${DIGEST.slice(1)}`,
    `node:24@sha256:${DIGEST}1`,
    `node:24@sha256:${DIGEST.toUpperCase()}`,
    `node:24@sha256:${DIGEST}:latest`,
    '${{ matrix.image }}',
  ])('refuses %s, to be pinned by its digest, and names its job', image => {
    const problem = describeImagePinProblem({ image, job: 'test' });

    expect(problem).toContain(
      `${image}, the image of the container of the job test, is not pinned`,
    );
    expect(problem).toContain('SHA-256 digest');
  });

  it('names the service whose image is not pinned', () => {
    expect(describeImagePinProblem({ image: 'redis:8', job: 'test', service: 'redis' })).toContain(
      'redis:8, the image of the service redis of the job test, is not pinned',
    );
  });

  it.each(['', '   ', undefined, null, 42, {}, ['node:24']])(
    'asks for an image on the line of its key for %o',
    image => {
      expect(describeImagePinProblem({ image, job: 'test', service: 'db' })).toContain(
        'No image of the service db of the job test stands on the line of its key',
      );
    },
  );

  it.each([undefined, null, 42, '', ['test']])(
    'names a job without its key for the job %o',
    job => {
      expect(describeImagePinProblem({ image: 'node:24', job, service: 7 })).toContain(
        'node:24, the image of the container of a job, is not pinned',
      );
    },
  );

  it('asks for an image without parameters', () => {
    expect(describeImagePinProblem()).toContain(
      'No image of the container of a job stands on the line of its key',
    );
  });
});
