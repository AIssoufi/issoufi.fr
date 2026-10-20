// @vitest-environment node
import { createHash } from 'node:crypto';

import { addComponentIds } from './componentIds.ts';

const MODULE_PATH = 'src/App/App.styled.ts';

/** The id that a component gets from its module and its place in it, as the transform builds it. */
const idOf = (index: number, modulePath = MODULE_PATH) =>
  `sc-${createHash('sha256').update(`${modulePath}#${index}`).digest('hex').slice(0, 8)}`;

/** The configuration that the transform adds after the factory of a component. */
const withId = (index: number, modulePath = MODULE_PATH) =>
  `.withConfig({ componentId: "${idOf(index, modulePath)}" })`;

const IMPORT = "import styled, { css } from '@xstyled/styled-components';";

describe('addComponentIds', () => {
  it('gives each styled component an id from its module and its place in it', () => {
    const code = `${IMPORT}
export const A = styled.a\`color: red;\`;
export const B = styled(A)\`color: blue;\`;`;

    expect(addComponentIds({ code, modulePath: MODULE_PATH })).toBe(`${IMPORT}
export const A = styled.a${withId(0)}\`color: red;\`;
export const B = styled(A)${withId(1)}\`color: blue;\`;`);
  });

  it('gives the same ids to the same module every time, and other ids to another module', () => {
    const code = `${IMPORT}\nconst A = styled.p\`\`;`;

    const first = addComponentIds({ code, modulePath: MODULE_PATH });
    const again = addComponentIds({ code, modulePath: MODULE_PATH });
    const other = addComponentIds({ code, modulePath: 'src/Other.styled.ts' });

    expect(again).toBe(first);
    expect(first).toContain(idOf(0));
    expect(other).toContain(idOf(0, 'src/Other.styled.ts'));
    expect(idOf(0, 'src/Other.styled.ts')).not.toBe(idOf(0));
  });

  it.each([
    ['its default export', "import xstyled from '@xstyled/styled-components';", 'xstyled'],
    ['its named export', "import { styled } from '@xstyled/styled-components';", 'styled'],
    ['an alias', "import { styled as s } from '@xstyled/styled-components';", 's'],
    ['a string name', "import { 'styled' as s } from '@xstyled/styled-components';", 's'],
  ])('finds styled imported as %s', (_, importLine, name) => {
    const code = `${importLine}\nconst A = ${name}.div\`\`;`;

    expect(addComponentIds({ code, modulePath: MODULE_PATH })).toBe(
      `${importLine}\nconst A = ${name}.div${withId(0)}\`\`;`,
    );
  });

  it('puts the id right after the factory, before the methods that follow it', () => {
    const code = `${IMPORT}
const A = styled.a.attrs({ rel: 'noopener' })\`\`;
const B = styled(Link).attrs(() => ({ role: 'list' })).withConfig({ shouldForwardProp: () => true })\`\`;`;

    expect(addComponentIds({ code, modulePath: MODULE_PATH })).toBe(`${IMPORT}
const A = styled.a${withId(0)}.attrs({ rel: 'noopener' })\`\`;
const B = styled(Link)${withId(1)}.attrs(() => ({ role: 'list' })).withConfig({ shouldForwardProp: () => true })\`\`;`);
  });

  it('gives an id to a component nested in the factory of another, in the order of the code', () => {
    const code = `${IMPORT}
const A = styled(styled.a\`color: red;\`)\`color: blue;\`;`;

    expect(addComponentIds({ code, modulePath: MODULE_PATH })).toBe(`${IMPORT}
const A = styled(styled.a${withId(0)}\`color: red;\`)${withId(1)}\`color: blue;\`;`);
  });

  it('keeps the types of the props of a component, in TypeScript', () => {
    const code = `${IMPORT}
const A = styled.a<{ $active?: boolean }>\`\`;
const B = styled(Link)<{ $wide: boolean }>\`\`;`;

    expect(addComponentIds({ code, modulePath: MODULE_PATH })).toBe(`${IMPORT}
const A = styled.a${withId(0)}<{ $active?: boolean }>\`\`;
const B = styled(Link)${withId(1)}<{ $wide: boolean }>\`\`;`);
  });

  it('finds the components of a module with JSX', () => {
    const code = `${IMPORT}
const Box = styled.div\`\`;
export const App = () => <Box title="a">text</Box>;`;

    expect(addComponentIds({ code, modulePath: 'src/App/App.tsx' })).toContain(
      `styled.div${withId(0, 'src/App/App.tsx')}\`\``,
    );
  });

  it('places the ids right after text in other alphabets and emoji', () => {
    const code = `${IMPORT}
// Été 🌞 — 日本語
const A = styled.p\`content: '✓';\`;
const B = styled.p\`\`;`;

    expect(addComponentIds({ code, modulePath: MODULE_PATH })).toBe(`${IMPORT}
// Été 🌞 — 日本語
const A = styled.p${withId(0)}\`content: '✓';\`;
const B = styled.p${withId(1)}\`\`;`);
  });

  it('leaves the other tagged templates and uses of styled as they are', () => {
    const code = `${IMPORT}
const shared = css\`color: red;\`;
const other = theme.styled.a\`\`;
const computed = styled['a']\`\`;
const method = styled.a.withTheme\`\`;
const called = styled.a({ color: 'red' });
const A = styled.a\`\${shared}\`;`;

    expect(addComponentIds({ code, modulePath: MODULE_PATH })).toBe(`${IMPORT}
const shared = css\`color: red;\`;
const other = theme.styled.a\`\`;
const computed = styled['a']\`\`;
const method = styled.a.withTheme\`\`;
const called = styled.a({ color: 'red' });
const A = styled.a${withId(0)}\`\${shared}\`;`);
  });

  it.each([
    ['styled of another module', "import styled from 'styled-components';\nconst A = styled.a``;"],
    [
      'no styled imported from the module',
      "import { css } from '@xstyled/styled-components';\nconst a = css``;",
    ],
    ['styled imported but unused', `${IMPORT}\nexport { css };`],
    ['the name of the module in a comment only', "// '@xstyled/styled-components'\nconst a = 1;"],
    ['no mention of the module', 'const a = 1;'],
    ['code that does not parse', `${IMPORT}\nconst A = styled.a\`\`; const = ;`],
    ['empty code', ''],
  ])('returns null for %s', (_, code) => {
    expect(addComponentIds({ code, modulePath: MODULE_PATH })).toBeNull();
  });

  it.each([
    ['no parameters', undefined],
    ['no code', { modulePath: MODULE_PATH }],
    ['code that is not a string', { code: 42, modulePath: MODULE_PATH }],
    ['no path', { code: `${IMPORT}\nconst A = styled.a\`\`;` }],
    ['an empty path', { code: `${IMPORT}\nconst A = styled.a\`\`;`, modulePath: '' }],
    ['a blank path', { code: `${IMPORT}\nconst A = styled.a\`\`;`, modulePath: '  ' }],
    ['a path that is not a string', { code: `${IMPORT}\nconst A = styled.a\`\`;`, modulePath: 1 }],
  ])('returns null with %s', (_, params) => {
    // @ts-expect-error: values of the wrong type, as JavaScript could pass them
    expect(addComponentIds(params)).toBeNull();
  });
});
