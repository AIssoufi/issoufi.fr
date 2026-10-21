// @vitest-environment node
import { resolve } from 'node:path';
import type { ResolvedConfig, TransformResult } from 'vite';

import { NODE_MODULES_PATTERN } from '../constants.ts';
import { APP_MODULE_PATTERN, STYLED_MODULE } from './constants.ts';
import { minifyStyledCss, styledComponentIds } from './plugins.ts';
import { addComponentIds } from './utils/componentIds.ts';

const ROOT = resolve('/project');

const CODE = "import styled from '@xstyled/styled-components';\nconst A = styled.a``;";

/** Hooks of the plugin as Vite calls them, outside of a build. */
const getHooks = () => {
  const plugin = styledComponentIds();
  const { transform, configResolved } = plugin;
  if (typeof transform !== 'object' || typeof configResolved !== 'function') {
    throw new Error('The plugin has no transform filter or configResolved hook');
  }
  // The hooks read no `this`, which only Vite would give them
  const resolveConfig = (root: string) =>
    configResolved.call(undefined as never, { root } as ResolvedConfig);
  const transformCode = (code: string, id: string) =>
    transform.handler.call(undefined as never, code, id, { moduleType: 'ts' }) as TransformResult;
  return { plugin, filter: transform.filter, resolveConfig, transformCode };
};

describe('styledComponentIds', () => {
  it('runs before the other plugins, on the modules of the app that import styled', () => {
    const { plugin, filter } = getHooks();

    expect(plugin.name).toBe('styled-component-ids');
    expect(plugin.enforce).toBe('pre');
    expect(filter).toEqual({
      id: { include: APP_MODULE_PATTERN, exclude: NODE_MODULES_PATTERN },
      code: STYLED_MODULE,
    });
  });

  it.each([
    ['src/App/App.styled.ts', resolve(ROOT, 'src/App/App.styled.ts')],
    ['src/pages/Home/Home.tsx', resolve(ROOT, 'src/pages/Home/Home.tsx')],
  ])('derives the ids from the path of the module from the root: %s', (modulePath, id) => {
    const { resolveConfig, transformCode } = getHooks();
    resolveConfig(ROOT);

    expect(transformCode(CODE, id)).toBe(addComponentIds({ code: CODE, modulePath }));
  });

  it('returns null for a module that defines no styled component', () => {
    const { resolveConfig, transformCode } = getHooks();
    resolveConfig(ROOT);

    expect(transformCode('export const a = 1;', resolve(ROOT, 'src/a.ts'))).toBeNull();
  });
});

/** Plugin that minifies the CSS templates, and its transform as Vite calls it outside a build. */
const getMinifyHooks = () => {
  const plugin = minifyStyledCss();
  const { transform } = plugin;
  if (typeof transform !== 'object') throw new Error('The plugin has no transform filter');
  // The hook reads no `this`, which only Vite would give it
  const transformCode = (code: string, id: string) =>
    transform.handler.call(undefined as never, code, id, { moduleType: 'ts' }) as TransformResult;
  return { plugin, filter: transform.filter, transformCode };
};

describe('minifyStyledCss', () => {
  it('runs before the other plugins, on the modules of the app that import styled', () => {
    const { plugin, filter } = getMinifyHooks();

    expect(plugin.name).toBe('minify-styled-css');
    expect(plugin.enforce).toBe('pre');
    expect(filter).toEqual({
      id: { include: APP_MODULE_PATTERN, exclude: NODE_MODULES_PATTERN },
      code: STYLED_MODULE,
    });
  });

  it('minifies the CSS templates of a module, parsed as its extension says', () => {
    const { transformCode } = getMinifyHooks();
    const code = `${CODE}\nconst B = styled.b\`\n  color: red;\n\`;\nexport const C = () => <B />;`;

    expect(transformCode(code, resolve(ROOT, 'src/pages/Home/Home.tsx'))).toBe(
      `${CODE}\nconst B = styled.b\` color: red; \`;\nexport const C = () => <B />;`,
    );
  });

  it('returns null for a module without CSS template to minify', () => {
    const { transformCode } = getMinifyHooks();

    expect(transformCode(CODE, resolve(ROOT, 'src/a.ts'))).toBeNull();
  });
});
