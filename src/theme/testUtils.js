import ts from 'typescript';

/**
 * Units of the lengths that must come from a token: absolute ones and those relative to a font.
 * Percentages and viewport units are proportions of the parent or of the screen, so they may stay
 * raw.
 */
const TOKEN_LENGTH_UNITS = ['px', 'rem', 'em', 'ch', 'ex', 'lh', 'cm', 'mm', 'in', 'pt', 'pc'];

/** Units of durations, which come from the `durations` tokens. */
const DURATION_UNITS = ['ms', 's'];

/**
 * Common CSS color names that a style file could write instead of a `colors` token. Rarer names,
 * such as `crimson` or `gold`, are not checked.
 */
const NAMED_COLORS = [
  'black',
  'white',
  'gray',
  'grey',
  'silver',
  'red',
  'maroon',
  'orange',
  'yellow',
  'olive',
  'lime',
  'green',
  'teal',
  'cyan',
  'aqua',
  'blue',
  'navy',
  'purple',
  'magenta',
  'fuchsia',
  'pink',
];

/** Easing keywords, which come from the `timingFunctions` tokens. */
const EASING_KEYWORDS = [
  'ease',
  'ease-in',
  'ease-out',
  'ease-in-out',
  'linear',
  'step-start',
  'step-end',
];

/** Properties whose numbers come from a scale of the theme. Keywords such as `bold` are not checked. */
const SCALED_PROPERTIES = ['z-index', 'font-weight', 'line-height'];

/**
 * Start of a word: not preceded by a letter, a digit, an underscore, a dot, a dollar sign, a hash
 * or a hyphen, so that `h1`, `blurs.8`, `$index` or the digits of `#123` are not numbers.
 */
const WORD_START = '(?<![\\w.$#-])';
/** End of a word: not followed by a letter, a digit, an underscore or a hyphen. */
const WORD_END = '(?![\\w-])';
/** A number, such as `12`, `-0.5` or `.5`. */
const NUMBER = '-?(?:\\d+(?:\\.\\d+)?|\\.\\d+)';

/** Kinds of raw values, each with the pattern that finds them in a line of a style file. */
const RAW_VALUE_PATTERNS = [
  {
    kind: 'length',
    pattern: new RegExp(
      `${WORD_START}(${NUMBER})(?:${TOKEN_LENGTH_UNITS.join('|')})${WORD_END}`,
      'gi',
    ),
  },
  {
    kind: 'duration',
    pattern: new RegExp(`${WORD_START}(${NUMBER})(?:${DURATION_UNITS.join('|')})${WORD_END}`, 'gi'),
  },
  {
    kind: 'color',
    pattern: new RegExp(
      `#[\\da-f]{3,8}\\b|${WORD_START}(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\\(|` +
        `${WORD_START}(?:${NAMED_COLORS.join('|')})${WORD_END}`,
      'gi',
    ),
  },
  {
    kind: 'easing',
    pattern: new RegExp(
      `${WORD_START}(?:cubic-bezier|steps)\\(|${WORD_START}(?:${EASING_KEYWORDS.join('|')})${WORD_END}`,
      'g',
    ),
  },
  {
    kind: 'scale',
    pattern: new RegExp(
      `${WORD_START}(?:${SCALED_PROPERTIES.join('|')})\\s*:\\s*${NUMBER}${WORD_END}`,
      'g',
    ),
  },
];

/** Block comments, line comments (after a space or at the start of a line) and token calls. */
const IGNORED_CODE = /\/\*[\s\S]*?\*\/|(?<=^|\s)\/\/.*$|\bth(?:\.\w+)?\([^)]*\)/gm;

/** Replaces each character of a match with a space, keeping its line breaks. */
const blankOut = match => match.replace(/[^\n]/g, ' ');

/** Whether a number found with a unit is zero, the same value in every scale. */
const isZero = number => number !== undefined && Number(number) === 0;

/**
 * Values written by hand in the source of a style file that should come from a token of the
 * theme: lengths in pixels or in units relative to a font, durations, colors, easings, and raw
 * z-indexes, font weights and line heights. Used by the theme spec to refuse them in every style
 * file.
 *
 * It ignores comments, the `th` helpers and their arguments (`th.space(-8)`), and the named
 * constants interpolated with a unit (`${BUTTON_WIDTH_PX}px`). It allows zero with any unit,
 * percentages, viewport units (`100vh`), angles, `fr`, unitless numbers (scale factors,
 * opacities, flex factors) and keywords such as `transparent` or `currentColor`. An id selector
 * whose name is hexadecimal, such as `#fade`, would be reported as a color.
 *
 * @param {unknown} source - Source code of a style file.
 * @returns {{ line: number, kind: string, value: string }[]} Each raw value with its line,
 * counted from 1, in the order of the source; empty when `source` is not a string.
 *
 * @example
 * findRawValues('  height: 72px;\n  color: ${th.color(\'accent\')};');
 * // [{ line: 1, kind: 'length', value: '72px' }]
 */
export const findRawValues = source => {
  if (typeof source !== 'string') return [];
  const code = source.replace(IGNORED_CODE, blankOut);

  return code.split('\n').flatMap((text, index) =>
    RAW_VALUE_PATTERNS.flatMap(({ kind, pattern }) =>
      [...text.matchAll(pattern)]
        .filter(([, number]) => !isZero(number))
        .map(match => ({ line: index + 1, column: match.index, kind, value: match[0].trim() })),
    )
      .sort((first, second) => first.column - second.column)
      .map(({ line, kind, value }) => ({ line, kind, value })),
  );
};

/** Module of the primitives, the only values that the semantic theme may read. */
const PRIMITIVES_MODULE = './tokens';

/**
 * Local names of what a source imports from a module: `values`, its default and named imports,
 * renamed or not, and `namespaces`, the names of its namespace imports (`import * as tokens`).
 */
const importsOf = ({ file, module }) => {
  const clauses = file.statements
    .filter(
      statement => ts.isImportDeclaration(statement) && statement.moduleSpecifier.text === module,
    )
    .flatMap(({ importClause }) => (importClause ? [importClause] : []));
  const namedImports = ({ namedBindings }) =>
    namedBindings && ts.isNamedImports(namedBindings) ? namedBindings.elements : [];
  const namespaceImports = ({ namedBindings }) =>
    namedBindings && ts.isNamespaceImport(namedBindings) ? [namedBindings] : [];

  return {
    values: clauses.flatMap(clause => [
      ...(clause.name ? [clause.name.text] : []),
      ...namedImports(clause).map(({ name }) => name.text),
    ]),
    namespaces: clauses.flatMap(clause => namespaceImports(clause).map(({ name }) => name.text)),
  };
};

/**
 * Whether a node calls a function imported from the primitives module: `alphaVariants(…)`, or
 * `tokens.alphaVariants(…)` through a namespace import. A method of a primitive, such as
 * `palette.white.replace(…)`, is not one.
 */
const isBuilderCall = ({ node, builders }) => {
  if (!ts.isCallExpression(node)) return false;
  const callee = node.expression;
  if (ts.isIdentifier(callee)) return builders.values.includes(callee.text);
  const isNamespaceMember =
    ts.isPropertyAccessExpression(callee) && ts.isIdentifier(callee.expression);
  return isNamespaceMember && builders.namespaces.includes(callee.expression.text);
};

/** Whether a node is a number, a string or a template literal without interpolation. */
const isLiteral = node =>
  ts.isNumericLiteral(node) || ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node);

/** Whether a node is a negative or explicitly positive number, such as `-2`. */
const isSignedNumber = node => ts.isPrefixUnaryExpression(node) && isLiteral(node.operand);

/** Whether a node is a value written by hand: a literal, or a number with its sign. */
const isWrittenValue = node => isLiteral(node) || isSignedNumber(node);

/**
 * Values written by hand in the source of the semantic theme, where every token should point to a
 * primitive of `tokens.ts`: each number, string or template literal given as a value, and the
 * raw values that {@link findRawValues} finds in the text of a template literal that reads
 * tokens (`${sizes[1]} solid #fff`). Used by the theme spec on `theme.ts`.
 *
 * It allows the keys of objects and of element accesses (`spacing[24]`,
 * `colors['accent-a55']`), the modules of imports and exports, types such as `as const`,
 * comments, and the arguments of a function imported from `tokens.ts`, such as the name and the
 * opacities given to `alphaVariants`, which builds tokens from a primitive. The arguments of a
 * method of a primitive, such as `palette.white.replace('#fff', '#000')`, are checked. It does not
 * check where an identifier comes from.
 *
 * @param {unknown} source - TypeScript source of a theme file.
 * @returns {{ line: number, kind: string, value: string }[]} Each raw value with its line,
 * counted from 1, in the order of the source: `literal` for a literal, with its quotes, or the
 * kind given by {@link findRawValues}; empty when `source` is not a string.
 *
 * @example
 * findRawThemeValues("export const theme = { radii: { sm: '8px', md: radii[12] } };");
 * // [{ line: 1, kind: 'literal', value: "'8px'" }]
 */
export const findRawThemeValues = source => {
  if (typeof source !== 'string') return [];
  const file = ts.createSourceFile('theme.ts', source, ts.ScriptTarget.Latest, true);
  const builders = importsOf({ file, module: PRIMITIVES_MODULE });
  const lineOf = node => file.getLineAndCharacterOfPosition(node.getStart(file)).line + 1;
  const rawValues = [];

  const checkTemplateText = part =>
    findRawValues(part.getText(file)).forEach(({ line, kind, value }) =>
      rawValues.push({ line: lineOf(part) + line - 1, kind, value }),
    );

  const visit = node => {
    const isModuleReference = ts.isImportDeclaration(node) || ts.isExportDeclaration(node);
    const isAllowedNode =
      isModuleReference || isBuilderCall({ node, builders }) || ts.isTypeNode(node);
    if (isAllowedNode) return;

    if (isWrittenValue(node)) {
      rawValues.push({ line: lineOf(node), kind: 'literal', value: node.getText(file) });
    } else if (ts.isPropertyAssignment(node)) {
      visit(node.initializer);
    } else if (ts.isElementAccessExpression(node)) {
      visit(node.expression);
    } else if (ts.isTemplateExpression(node)) {
      checkTemplateText(node.head);
      node.templateSpans.forEach(span => {
        visit(span.expression);
        checkTemplateText(span.literal);
      });
    } else {
      ts.forEachChild(node, visit);
    }
  };

  visit(file);
  return rawValues;
};

/**
 * A length in pixels at the start of a font size, alone or as the smallest value of a `clamp()`.
 */
const SMALLEST_PIXEL_SIZE_PATTERN = /^(?:clamp\(\s*)?(\d+(?:\.\d+)?)px(?:$|\s*,)/;

/**
 * Smallest size, in pixels, that a font size token of the theme can take: its value, or the
 * smallest value of a fluid size written with `clamp()`, the first one.
 *
 * @param {unknown} size - Font size as the theme writes it, such as `12px` or
 * `clamp(16px, 12px + 0.75vmin, 24px)`.
 * @returns {number} The size in pixels; `NaN` for a size in another unit, a `clamp()` whose
 * smallest value is not in pixels, or a value that is not a string, so that any comparison with
 * it fails.
 *
 * @example
 * getSmallestFontSizePx('clamp(16px, 12px + 0.75vmin, 24px)'); // 16
 */
export const getSmallestFontSizePx = size => {
  if (typeof size !== 'string') return Number.NaN;

  const match = size.trim().match(SMALLEST_PIXEL_SIZE_PATTERN);
  return match ? Number(match[1]) : Number.NaN;
};

/** Block comments and line comments, which may name `:hover` without styling anything. */
const COMMENTS = /\/\*[\s\S]*?\*\/|(?<=^|\s)\/\/.*$/gm;

/** The pseudo-class whose style a touch screen keeps after a tap, alone or inside `:not()`. */
const HOVER_PSEUDO_CLASS = ':hover';

/** Rule that starts the head of a block of a media query. */
const MEDIA_RULE = '@media';

/** How a style file writes the constant `HOVER_POINTER_QUERY` (`src/theme/constants.ts`). */
const HOVER_QUERY_REFERENCE = '${HOVER_POINTER_QUERY}';

/** The `not` of a media query, which applies its block where its condition is false. */
const MEDIA_NEGATION_PATTERN = /\bnot\b/;

/**
 * Tells whether the head of a block is a media query of the pointers that hover only: `@media`,
 * then `HOVER_POINTER_QUERY`, alone or with other conditions joined by `and`. A comma makes a list
 * of queries, any of which applies the block, such as a width that a touch screen matches too,
 * and `not` applies it to the other screens.
 */
const isHoverMediaHead = head => {
  const mediaStart = head.lastIndexOf(MEDIA_RULE);
  if (mediaStart === -1) return false;

  const query = head.slice(mediaStart + MEDIA_RULE.length);
  const isQueryList = query.includes(',');
  const isNegated = MEDIA_NEGATION_PATTERN.test(query);
  return !isQueryList && !isNegated && query.includes(HOVER_QUERY_REFERENCE);
};

/**
 * Lines of the `:hover` pseudo-classes of a style file written outside a block of the media query
 * `HOVER_POINTER_QUERY` (`src/theme/constants.ts`), whose style a touch screen would keep after a
 * tap, until the next tap elsewhere. Used by the theme spec to refuse them in every style file.
 *
 * It reads the blocks of the CSS of the source, those of its interpolated `css` blocks included,
 * and the braces of `${}` interpolations apart, so a block of the media query covers the rules
 * written inside it, however deep. It ignores comments. A brace inside a string, such as
 * `content: '{'`, would be read as a block.
 *
 * @param {unknown} source - Source code of a style file.
 * @returns {number[]} The line of each `:hover` outside the media query, counted from 1, in the
 * order of the source; empty when `source` is not a string.
 *
 * @example
 * findUnguardedHovers('  &:hover {\n  }\n  @media ${HOVER_POINTER_QUERY} {\n    &:hover {}\n  }');
 * // [1]
 */
export const findUnguardedHovers = source => {
  if (typeof source !== 'string') return [];
  const code = source.replace(COMMENTS, blankOut);
  const openBlocks = [];
  const lines = [];
  let line = 1;
  let headStart = 0;

  for (let index = 0; index < code.length; index += 1) {
    const character = code[index];
    if (character === '\n') {
      line += 1;
    } else if (character === '{') {
      // An interpolation holds code, or a css block, but no head of a block of its own
      const opensInterpolation = code[index - 1] === '$';
      const head = code.slice(headStart, index);
      const isHoverMedia = !opensInterpolation && isHoverMediaHead(head);
      openBlocks.push({ isInterpolation: opensInterpolation, isHoverMedia });
      if (!opensInterpolation) headStart = index + 1;
    } else if (character === '}') {
      // A brace with no block to close counts as the end of a block of CSS
      const closesInterpolation = openBlocks.pop()?.isInterpolation ?? false;
      if (!closesInterpolation) headStart = index + 1;
    } else if (character === ';') {
      headStart = index + 1;
    } else if (code.startsWith(HOVER_PSEUDO_CLASS, index)) {
      const isInHoverMedia = openBlocks.some(block => block.isHoverMedia);
      if (!isInHoverMedia) lines.push(line);
    }
  }
  return lines;
};
