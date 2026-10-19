import { holdsFunctionSource, logDroppedCssRules } from './cssRuleGuard.ts';

/** A rule as styled-components writes it for a `th` helper interpolated outside a `css` block. */
const FUNCTION_SOURCE_RULE = '.a:hover background-color:(props) => getValue(props){}';

/** A rule that browsers keep. */
const VALID_RULE = '.a { transition-timing-function: ease; }';

/**
 * A style sheet prototype whose `insertRule` returns the index of the rule, or throws as the CSSOM
 * does for a rule that it refuses.
 */
const createStyleSheetPrototype = ({ refuses = false } = {}) => {
  const insertRule = vi.fn((_rule: string, index = 0) => {
    if (refuses) throw new DOMException('Refused rule', 'SyntaxError');
    return index;
  });
  return { prototype: { insertRule }, insertRule };
};

describe('holdsFunctionSource', () => {
  it.each([
    FUNCTION_SOURCE_RULE,
    '.a { color: function (props) { return props.color; }; }',
    '.a{color:function(props){}}',
  ])('finds the source of a function in %j', rule => {
    expect(holdsFunctionSource(rule)).toBe(true);
  });

  it.each([
    VALID_RULE,
    '.a { transition: color 0.2s cubic-bezier(0.4, 0, 0.2, 1); }',
    '.a::after { content: "function"; }',
    '.a { width: calc(100% - 2rem); }',
    '',
  ])('finds none in %j', rule => {
    expect(holdsFunctionSource(rule)).toBe(false);
  });

  it.each([undefined, null, 42, {}, () => 0])(
    'returns false for %j, which is not a string',
    rule => {
      expect(holdsFunctionSource(rule)).toBe(false);
    },
  );
});

describe('logDroppedCssRules', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('inserts a valid rule in the style sheet, at the given index, without logging', () => {
    const { prototype, insertRule } = createStyleSheetPrototype();
    logDroppedCssRules(prototype);

    expect(prototype.insertRule(VALID_RULE, 2)).toBe(2);
    expect(insertRule).toHaveBeenCalledWith(VALID_RULE, 2);
    expect(insertRule.mock.contexts[0]).toBe(prototype);
    expect(console.error).not.toHaveBeenCalled();
  });

  it('logs a rule holding the source of a function, and still inserts it', () => {
    const { prototype, insertRule } = createStyleSheetPrototype();
    logDroppedCssRules(prototype);

    prototype.insertRule(FUNCTION_SOURCE_RULE);

    expect(insertRule).toHaveBeenCalledWith(FUNCTION_SOURCE_RULE, undefined);
    expect(console.error).toHaveBeenCalledTimes(1);
    expect(console.error).toHaveBeenCalledWith(
      `CSS rule holding the source of a function, which browsers drop: ${FUNCTION_SOURCE_RULE}`,
    );
  });

  it('logs a rule that the CSSOM refuses, and still throws its error', () => {
    const { prototype } = createStyleSheetPrototype({ refuses: true });
    logDroppedCssRules(prototype);

    expect(() => prototype.insertRule(VALID_RULE)).toThrow('Refused rule');
    expect(console.error).toHaveBeenCalledWith(
      `CSS rule refused by the CSSOM, which browsers drop: ${VALID_RULE}`,
      expect.any(DOMException),
    );
  });

  it('logs both reasons, in order, for a refused rule holding the source of a function', () => {
    const { prototype } = createStyleSheetPrototype({ refuses: true });
    logDroppedCssRules(prototype);

    expect(() => prototype.insertRule(FUNCTION_SOURCE_RULE)).toThrow('Refused rule');
    expect(vi.mocked(console.error).mock.calls.map(([message]) => message)).toEqual([
      `CSS rule holding the source of a function, which browsers drop: ${FUNCTION_SOURCE_RULE}`,
      `CSS rule refused by the CSSOM, which browsers drop: ${FUNCTION_SOURCE_RULE}`,
    ]);
  });

  it('guards the style sheets of every test, through src/setupTests.ts', () => {
    const style = document.createElement('style');
    document.head.append(style);

    style.sheet?.insertRule(FUNCTION_SOURCE_RULE);
    style.remove();

    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('source of a function'));
  });
});
