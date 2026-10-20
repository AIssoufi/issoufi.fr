// @vitest-environment node
import { minifyCssTemplates } from './cssTemplates.ts';

const MODULE_PATH = 'src/App/App.styled.ts';

const IMPORT =
  "import styled, { createGlobalStyle, css, keyframes } from '@xstyled/styled-components';";

/** Code of a module that imports the tags of {@link IMPORT}, then holds the given lines. */
const moduleOf = (...lines: string[]) => [IMPORT, ...lines].join('\n');

describe('minifyCssTemplates', () => {
  it('minifies the templates of every tag of the styled module, and those only', () => {
    const code = moduleOf(
      'const shared = css`\n  color: red;\n`;',
      'const fade = keyframes`\n  from {\n    opacity: 0;\n  }\n`;',
      'const Global = createGlobalStyle`\n  body {\n    margin: 0;\n  }\n`;',
      'const A = styled.a`\n  ${shared}\n  animation: ${fade} 1s;\n`;',
      'const text = `\n  Kept\n`;',
      'const raw = String.raw`\n  Kept\n`;',
    );

    expect(minifyCssTemplates({ code, modulePath: MODULE_PATH })).toBe(
      moduleOf(
        'const shared = css` color: red; `;',
        'const fade = keyframes` from { opacity: 0; } `;',
        'const Global = createGlobalStyle` body { margin: 0; } `;',
        'const A = styled.a` ${shared} animation: ${fade} 1s; `;',
        'const text = `\n  Kept\n`;',
        'const raw = String.raw`\n  Kept\n`;',
      ),
    );
  });

  it('finds the tag behind a component, the methods of a factory and the type of the props', () => {
    const code = moduleOf(
      'const A = styled(Link)`\n  color: red;\n`;',
      "const B = styled.a.attrs({ rel: 'noopener' })`\n  color: red;\n`;",
      'const C = styled.a<{ $on?: boolean }>`\n  color: red;\n`;',
    );

    expect(minifyCssTemplates({ code, modulePath: MODULE_PATH })).toBe(
      moduleOf(
        'const A = styled(Link)` color: red; `;',
        "const B = styled.a.attrs({ rel: 'noopener' })` color: red; `;",
        'const C = styled.a<{ $on?: boolean }>` color: red; `;',
      ),
    );
  });

  it.each([
    ['an alias', "import { css as style } from '@xstyled/styled-components';", 'style'],
    ['a namespace', "import * as xstyled from '@xstyled/styled-components';", 'xstyled.css'],
  ])('finds a tag imported with %s', (_, importLine, tag) => {
    const code = `${importLine}\nconst a = ${tag}\`\n  color: red;\n\`;`;

    expect(minifyCssTemplates({ code, modulePath: MODULE_PATH })).toBe(
      `${importLine}\nconst a = ${tag}\` color: red; \`;`,
    );
  });

  it('minifies a template in an interpolation of another', () => {
    const code = moduleOf(
      'const A = styled.a<{ $on?: boolean }>`\n  ${({ $on }) => $on && css`\n    color: red;\n  `}\n`;',
    );

    expect(minifyCssTemplates({ code, modulePath: MODULE_PATH })).toBe(
      moduleOf(
        'const A = styled.a<{ $on?: boolean }>` ${({ $on }) => $on && css` color: red; `} `;',
      ),
    );
  });

  it('finds the texts after characters outside of ASCII, and keeps those in the templates', () => {
    const code = moduleOf(
      '// Arrow › of the café',
      "const A = styled.a`\n  /* › */\n  content: '›';\n  ${'é'}\n`;",
    );

    expect(minifyCssTemplates({ code, modulePath: MODULE_PATH })).toBe(
      moduleOf('// Arrow › of the café', "const A = styled.a` content: '›'; ${'é'} `;"),
    );
  });

  it('parses TypeScript with JSX when the path says so', () => {
    const code = moduleOf(
      'const A = styled.a`\n  color: red;\n`;',
      'export const B = () => <A />;',
    );

    expect(minifyCssTemplates({ code, modulePath: 'src/B/B.tsx' })).toBe(
      moduleOf('const A = styled.a` color: red; `;', 'export const B = () => <A />;'),
    );
  });

  it.each([
    [
      'a tag of another module',
      "import styled from 'styled-components';\nconst A = styled.a`\n  color: red;\n`;",
    ],
    ['a tag that starts with another expression than a name', moduleOf('const a = [css][0]`\n`;')],
    ['templates already minified', moduleOf('const A = styled.a`color: red;`;')],
    ['templates left as they are', moduleOf('const A = styled.a`\n  color: red; // Note\n`;')],
    ['no template of the module', moduleOf('const text = `\n  Kept\n`;')],
    ['the name of the module in a comment only', "// '@xstyled/styled-components'\nconst a = 1;"],
    ['no mention of the module', 'const a = 1;'],
    ['code that does not parse', moduleOf('const A = styled.a`\n`; const = ;')],
    ['empty code', ''],
  ])('returns null for %s', (_, code) => {
    expect(minifyCssTemplates({ code, modulePath: MODULE_PATH })).toBeNull();
  });

  it.each([
    ['no parameters', undefined],
    ['no code', { modulePath: MODULE_PATH }],
    ['code that is not a string', { code: 42, modulePath: MODULE_PATH }],
    ['no path', { code: moduleOf('const A = styled.a`\n`;') }],
    ['an empty path', { code: moduleOf('const A = styled.a`\n`;'), modulePath: '' }],
    ['a blank path', { code: moduleOf('const A = styled.a`\n`;'), modulePath: '  ' }],
    ['a path that is not a string', { code: moduleOf('const A = styled.a`\n`;'), modulePath: 1 }],
  ])('returns null with %s', (_, params) => {
    // @ts-expect-error: values of the wrong type, as JavaScript could pass them
    expect(minifyCssTemplates(params)).toBeNull();
  });
});
