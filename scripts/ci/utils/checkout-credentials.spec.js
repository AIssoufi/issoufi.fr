import { describeCredentialsProblem, findCheckoutSteps } from './checkout-credentials.mjs';

const SHA = '58ff9ea0c3f4e1b2a9d8c7b6a5f4e3d2c1b0a9f8';

/** End of the messages that ask a checkout step for a setting. */
const FIX = [
  'write persist-credentials: false under with:, or true with a comment, on its line or right',
  'above it, that names the later step that uses git with the credentials.',
].join(' ');

describe('findCheckoutSteps', () => {
  it('reads each checkout step with the line and the column of its uses: key and its input', () => {
    const source = [
      'jobs:',
      '  build:',
      '    steps:',
      '      - uses: actions/checkout@v7',
      '        with:',
      '          fetch-depth: 0',
      '          persist-credentials: false',
      `      - uses: pnpm/action-setup@${SHA}`,
      '        with:',
      '          persist-credentials: true',
      '      - name: Check out the tag',
      '        uses: actions/checkout@v7',
    ].join('\n');

    expect(findCheckoutSteps(source)).toEqual([
      {
        line: 4,
        column: 9,
        persistCredentials: expect.objectContaining({
          line: 7,
          column: 11,
          key: 'persist-credentials',
          value: 'false',
        }),
      },
      { line: 12, column: 9, persistCredentials: undefined },
    ]);
  });

  it('reads a checkout in another case or pinned by a SHA, not the other actions', () => {
    const source = [
      'steps:',
      `  - uses: Actions/Checkout@${SHA} # v7.0.0`,
      '  - uses: actions/checkout-extra@v1',
      '  - uses: ./.github/actions/checkout',
      '  - uses: owner/actions/checkout@v1',
      '  - run: echo "uses: actions/checkout@v7"',
    ].join('\n');

    expect(findCheckoutSteps(source)).toEqual([
      { line: 2, column: 5, persistCredentials: undefined },
    ]);
  });

  it('reads the input of a step whose with: key comes before its uses: key', () => {
    const source = [
      'steps:',
      '  - name: Check out',
      '    with:',
      '      persist-credentials: false',
      '    uses: actions/checkout@v7',
    ].join('\n');

    expect(findCheckoutSteps(source)).toEqual([
      {
        line: 5,
        column: 5,
        persistCredentials: expect.objectContaining({ line: 4, value: 'false' }),
      },
    ]);
  });

  it('does not take the input of the step before or after a checkout', () => {
    const source = [
      'steps:',
      `  - uses: owner/repo@${SHA}`,
      '    with:',
      '      persist-credentials: false',
      '  - uses: actions/checkout@v7',
      '  - with:',
      '      persist-credentials: false',
      `    uses: owner/repo@${SHA}`,
    ].join('\n');

    expect(findCheckoutSteps(source)).toEqual([
      { line: 5, column: 5, persistCredentials: undefined },
    ]);
  });

  it('tells apart the steps whose - stands alone on the line above their first key', () => {
    const source = [
      'steps:',
      '  -',
      `    uses: owner/repo@${SHA}`,
      '    with:',
      '      persist-credentials: false',
      '  -',
      '    uses: actions/checkout@v7',
      '  -',
      '    with:',
      '      persist-credentials: false',
      '    uses: actions/checkout@v7',
    ].join('\n');

    expect(findCheckoutSteps(source)).toEqual([
      { line: 7, column: 5, persistCredentials: undefined },
      {
        line: 11,
        column: 5,
        persistCredentials: expect.objectContaining({ line: 10, value: 'false' }),
      },
    ]);
  });

  it('does not take the inputs of the keys above a mapping outside a sequence', () => {
    const source = [
      'jobs:',
      '  build:',
      '    with:',
      '      persist-credentials: false',
      '  checkout:',
      '    uses: actions/checkout@v7',
    ].join('\n');

    expect(findCheckoutSteps(source)).toEqual([
      { line: 6, column: 5, persistCredentials: undefined },
    ]);
  });

  it('reads the input right under with: only, not one nested deeper or set beside it', () => {
    const source = [
      'steps:',
      '  - uses: actions/checkout@v7',
      '    persist-credentials: false',
      '    with:',
      '      sparse-checkout:',
      '        persist-credentials: false',
      '    env:',
      '      persist-credentials: false',
    ].join('\n');

    expect(findCheckoutSteps(source)).toEqual([
      { line: 2, column: 5, persistCredentials: undefined },
    ]);
  });

  it('reads the comment of the input, above it and at the end of its line', () => {
    const source = [
      '      - uses: actions/checkout@v7',
      '        with:',
      '          ssh-key: ${{ secrets.DEPLOY_KEY }}',
      '          # The push to main',
      '          persist-credentials: true # needs the key',
    ].join('\n');

    expect(findCheckoutSteps(source)).toEqual([
      expect.objectContaining({
        persistCredentials: expect.objectContaining({
          value: 'true',
          comment: 'The push to main needs the key',
        }),
      }),
    ]);
  });

  it('reads the checkout of a composite action, after a block scalar', () => {
    const source = [
      'runs:',
      '  using: composite',
      '  steps:',
      '    - run: |',
      '        - uses: actions/checkout@v7',
      '    - uses: actions/checkout@v7',
      '      with:',
      "        persist-credentials: 'false'",
    ].join('\n');

    expect(findCheckoutSteps(source)).toEqual([
      {
        line: 6,
        column: 7,
        persistCredentials: expect.objectContaining({ line: 8, value: 'false' }),
      },
    ]);
  });

  it('reads no input in a flow mapping', () => {
    const source =
      'steps:\n  - uses: actions/checkout@v7\n    with: { persist-credentials: false }\n';

    expect(findCheckoutSteps(source)).toEqual([
      { line: 2, column: 5, persistCredentials: undefined },
    ]);
  });

  it('reads a with: key that holds no input', () => {
    const source = 'steps:\n  - uses: actions/checkout@v7\n    with:\n  - run: pnpm test\n';

    expect(findCheckoutSteps(source)).toEqual([
      { line: 2, column: 5, persistCredentials: undefined },
    ]);
  });

  it('reads the checkout of a file with Windows line breaks', () => {
    const source = [
      'steps:',
      '  - uses: actions/checkout@v7',
      '    with:',
      '      persist-credentials: false',
      '',
    ].join('\r\n');

    expect(findCheckoutSteps(source)).toEqual([
      {
        line: 2,
        column: 5,
        persistCredentials: expect.objectContaining({ line: 4, value: 'false' }),
      },
    ]);
  });

  it.each([undefined, null, '', '\n\n', '# uses: actions/checkout@v7', 42, NaN, {}, []])(
    'reads no checkout step in %o',
    source => {
      expect(findCheckoutSteps(source)).toEqual([]);
    },
  );
});

describe('describeCredentialsProblem', () => {
  /** Checkout step whose persist-credentials input holds a value and a comment. */
  const stepWithInput = ({ value, comment = '' }) => ({
    line: 2,
    column: 5,
    persistCredentials: {
      line: 4,
      column: 7,
      key: 'persist-credentials',
      value,
      startsItem: false,
      comment,
    },
  });

  it.each(['false', 'False', 'FALSE'])('accepts persist-credentials: %s', value => {
    expect(describeCredentialsProblem(stepWithInput({ value }))).toBeUndefined();
  });

  it.each(['true', 'True', 'TRUE'])('accepts persist-credentials: %s with a comment', value => {
    const step = stepWithInput({ value, comment: 'The push to main needs the deploy key' });

    expect(describeCredentialsProblem(step)).toBeUndefined();
  });

  it('flags a checkout without the input, which keeps the credentials by default', () => {
    expect(describeCredentialsProblem({ line: 2, column: 5, persistCredentials: undefined })).toBe(
      [
        'This checkout keeps the token of its job, or its SSH key, in the git config for every',
        `later step of the job: ${FIX}`,
      ].join(' '),
    );
  });

  it.each(['', '   '])('flags persist-credentials: true with the comment %j', comment => {
    expect(describeCredentialsProblem(stepWithInput({ value: 'true', comment }))).toBe(
      [
        'persist-credentials: true keeps the credentials in the git config for every later step',
        'of the job without saying why: name, in a comment on its line or right above it, the',
        'later step that uses git with them, or write false.',
      ].join(' '),
    );
  });

  it.each(['${{ inputs.push }}', 'yes', 'no', '0', 'false # no'])(
    'flags persist-credentials: %s, which is neither false nor true',
    value => {
      const step = stepWithInput({ value, comment: 'The push needs it' });

      expect(describeCredentialsProblem(step)).toBe(
        [
          `persist-credentials: ${value} is neither false nor true, so the check cannot tell`,
          `whether the checkout keeps the credentials: ${FIX}`,
        ].join(' '),
      );
    },
  );

  it('flags an input that holds no value on its line', () => {
    expect(describeCredentialsProblem(stepWithInput({ value: '' }))).toMatch(
      /^persist-credentials: \(no value on its line\) is neither false nor true, /,
    );
  });

  it('flags persist-credentials: true whose comment is no text', () => {
    expect(describeCredentialsProblem(stepWithInput({ value: 'true', comment: 42 }))).toMatch(
      /^persist-credentials: true keeps the credentials /,
    );
  });

  it.each([
    undefined,
    null,
    42,
    'persist-credentials: false',
    {},
    { persistCredentials: null },
    { persistCredentials: 'false' },
    { persistCredentials: { value: false } },
    [],
  ])('flags %o as a checkout without the input', step => {
    expect(describeCredentialsProblem(step)).toMatch(/^This checkout keeps the token of its job, /);
  });
});
