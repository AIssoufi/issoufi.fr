import {
  WORKFLOW_COMMAND_ESCAPES,
  WORKFLOW_DATA_ESCAPE_PATTERN,
  WORKFLOW_PROPERTY_ESCAPE_PATTERN,
} from '../constants.mjs';
import {
  escapeWorkflowData,
  escapeWorkflowProperty,
  formatAnnotation,
  writeAnnotation,
} from './annotations.mjs';

/** Every ASCII character, to find those that the escape patterns match. */
const ASCII_CHARACTERS = Array.from({ length: 128 }, (_, code) => String.fromCharCode(code));

describe('workflow command escapes', () => {
  it.each([
    ['WORKFLOW_DATA_ESCAPE_PATTERN', WORKFLOW_DATA_ESCAPE_PATTERN],
    ['WORKFLOW_PROPERTY_ESCAPE_PATTERN', WORKFLOW_PROPERTY_ESCAPE_PATTERN],
  ])('gives an encoding to each character that %s matches', (_, pattern) => {
    const matched = ASCII_CHARACTERS.filter(character => character.search(pattern) !== -1);
    expect(matched.length).toBeGreaterThan(0);
    matched.forEach(character => {
      expect(WORKFLOW_COMMAND_ESCAPES).toHaveProperty([character]);
    });
  });

  it('matches every character that has an encoding in the properties', () => {
    Object.keys(WORKFLOW_COMMAND_ESCAPES).forEach(character => {
      expect(character.search(WORKFLOW_PROPERTY_ESCAPE_PATTERN)).toBe(0);
    });
  });
});

describe('escapeWorkflowData', () => {
  it.each([
    ['100%', '100%25'],
    ['%0A', '%250A'],
    ['first\nsecond', 'first%0Asecond'],
    ['first\r\nsecond', 'first%0D%0Asecond'],
    ['line\r', 'line%0D'],
    ['\n\n', '%0A%0A'],
  ])('escapes %j as %j', (value, expected) => {
    expect(escapeWorkflowData(value)).toBe(expected);
  });

  it.each([
    'dist/index.html not found: run pnpm build first',
    'public/a,b.pdf',
    'Invalid site URL "https://issoufi.fr/é?a=1&b=2"',
    '',
    '  ',
  ])('keeps %j as is', value => {
    expect(escapeWorkflowData(value)).toBe(value);
  });

  it.each([undefined, null])('gives an empty text for %s', value => {
    expect(escapeWorkflowData(value)).toBe('');
  });

  it.each([
    [42, '42'],
    [0, '0'],
    [NaN, 'NaN'],
    [false, 'false'],
  ])('writes the value %s as its text', (value, expected) => {
    expect(escapeWorkflowData(value)).toBe(expected);
  });
});

describe('escapeWorkflowProperty', () => {
  it.each([
    ['public/a,b.pdf', 'public/a%2Cb.pdf'],
    ['C:\\public\\cv.pdf', 'C%3A\\public\\cv.pdf'],
    ['100%', '100%25'],
    ['first\nsecond', 'first%0Asecond'],
    ['line\r', 'line%0D'],
    ['a,b:c%d\r\ne', 'a%2Cb%3Ac%25d%0D%0Ae'],
  ])('escapes %j as %j', (value, expected) => {
    expect(escapeWorkflowProperty(value)).toBe(expected);
  });

  it.each(['public/cv.pdf', 'public/projects.webp', '', '  '])('keeps %j as is', value => {
    expect(escapeWorkflowProperty(value)).toBe(value);
  });

  it.each([undefined, null])('gives an empty text for %s', value => {
    expect(escapeWorkflowProperty(value)).toBe('');
  });

  it.each([
    [12, '12'],
    [true, 'true'],
  ])('writes the value %s as its text', (value, expected) => {
    expect(escapeWorkflowProperty(value)).toBe(expected);
  });
});

describe('formatAnnotation', () => {
  it.each(['error', 'warning', 'notice'])('writes a %s annotation', level => {
    expect(formatAnnotation({ level, message: 'dist/ not found' })).toBe(
      `::${level}::dist/ not found`,
    );
  });

  it('escapes the message', () => {
    expect(formatAnnotation({ level: 'error', message: '100% failed\nRetry: soon, maybe' })).toBe(
      '::error::100%25 failed%0ARetry: soon, maybe',
    );
  });

  it('writes the properties after the level, escaped', () => {
    expect(
      formatAnnotation({
        level: 'warning',
        message: 'Too large',
        properties: { file: 'public/a,b:c.pdf', line: 3 },
      }),
    ).toBe('::warning file=public/a%2Cb%3Ac.pdf,line=3::Too large');
  });

  it.each([undefined, null, ''])('leaves out a property whose value is %j', file => {
    expect(
      formatAnnotation({ level: 'warning', message: 'Too large', properties: { file, line: 3 } }),
    ).toBe('::warning line=3::Too large');
  });

  it.each([undefined, null, {}, 'public/cv.pdf', 42, { file: undefined }])(
    'writes no property for the properties %o',
    properties => {
      expect(formatAnnotation({ level: 'notice', message: 'Skipped', properties })).toBe(
        '::notice::Skipped',
      );
    },
  );

  it.each([undefined, null, ''])('writes an empty annotation for the message %j', message => {
    expect(formatAnnotation({ level: 'error', message })).toBe('::error::');
  });

  it('writes the text of a message that is not a string', () => {
    expect(formatAnnotation({ level: 'error', message: new Error('Request failed') })).toBe(
      '::error::Error: Request failed',
    );
  });

  it.each([undefined, null, '', 'info', 'debug', 'ERROR', 'error ', 42])(
    'refuses the level %j',
    level => {
      expect(() => formatAnnotation({ level, message: 'dist/ not found' })).toThrow(RangeError);
    },
  );

  it.each(['endLine', 'endColumn', 'title'])('accepts the property name %s', name => {
    expect(
      formatAnnotation({ level: 'notice', message: 'Skipped', properties: { [name]: 2 } }),
    ).toBe(`::notice ${name}=2::Skipped`);
  });

  it.each(['', 'end line', 'file=x', 'a,b', 'a::b', 'line\n', 'é'])(
    'refuses the property name %j',
    name => {
      expect(() =>
        formatAnnotation({ level: 'warning', message: 'Too large', properties: { [name]: 'x' } }),
      ).toThrow(`Invalid annotation property name: "${name}"`);
    },
  );

  it('refuses an invalid property name even without a value', () => {
    expect(() =>
      formatAnnotation({ level: 'warning', properties: { 'file,line': undefined } }),
    ).toThrow(RangeError);
  });

  it('names the refused level', () => {
    expect(() => formatAnnotation({ level: 'info' })).toThrow('Unknown annotation level: info');
  });
});

describe('writeAnnotation', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('prints the annotation', () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    writeAnnotation({
      level: 'warning',
      message: '50%\nover',
      properties: { file: 'public/cv.pdf' },
    });
    expect(log).toHaveBeenCalledWith('::warning file=public/cv.pdf::50%25%0Aover');
  });

  it('prints nothing for an unknown level', () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    expect(() => writeAnnotation({ level: 'info', message: 'Skipped' })).toThrow(RangeError);
    expect(log).not.toHaveBeenCalled();
  });
});
