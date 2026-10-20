import { type ESTree, parseSync, Visitor } from 'vite';

import { isNonBlankString } from '../../../src/utils/strings.ts';
import { STYLED_MODULE } from '../constants.ts';
import { minifyCssQuasis } from './cssQuasis.ts';

/**
 * Lists the names that a module gives to what it imports from {@link STYLED_MODULE}, the tags of
 * its CSS templates among them: `styled`, `css`, `keyframes`, `createGlobalStyle`.
 */
const findStyledModuleNames = (program: ESTree.Program): Set<string> => {
  const names = new Set<string>();
  program.body.forEach(statement => {
    const isStyledImport =
      statement.type === 'ImportDeclaration' && statement.source.value === STYLED_MODULE;
    if (isStyledImport) statement.specifiers.forEach(({ local }) => names.add(local.name));
  });
  return names;
};

/**
 * Finds the name that the tag of a tagged template starts with: `styled` in ``styled.a`…` ``,
 * ``styled(Link)`…` `` or ``styled.a.attrs({ … })`…` ``, `css` in ``css`…` ``.
 *
 * @returns The name, or `undefined` when the tag starts with another expression.
 */
const findTagRootName = (tag: ESTree.Expression) => {
  let node = tag;
  while (node.type === 'MemberExpression' || node.type === 'CallExpression') {
    node = node.type === 'MemberExpression' ? node.object : node.callee;
  }
  return node.type === 'Identifier' ? node.name : undefined;
};

/** Parameters of {@link findCssTemplates}. */
interface FindCssTemplatesParams {
  /** Code of a module of the app, TypeScript or JavaScript, with or without JSX. */
  code: string;
  /** Path of the module, e.g. `src/App/App.styled.ts`: its extension tells the language. */
  modulePath: string;
}

/**
 * Finds the CSS templates of a module, those whose tag starts with a name imported from
 * {@link STYLED_MODULE}: ``styled.a`…` ``, ``styled(Link)`…` ``, ``css`…` ``, ``keyframes`…` ``…
 *
 * @returns The templates, nested ones included, or an empty list when the module has none or
 * cannot be parsed.
 *
 * @example
 * findCssTemplates({
 *   code: "import { css } from '@xstyled/styled-components';\nconst a = css`color: red;`;",
 *   modulePath: 'src/a.styled.ts',
 * });
 * // [the template literal `color: red;`]
 */
export const findCssTemplates = ({
  code,
  modulePath,
}: FindCssTemplatesParams): ESTree.TemplateLiteral[] => {
  if (!code.includes(STYLED_MODULE)) return [];

  const { program, errors } = parseSync(modulePath, code);
  const styledNames = errors.length === 0 ? findStyledModuleNames(program) : new Set<string>();
  if (styledNames.size === 0) return [];

  const templates: ESTree.TemplateLiteral[] = [];
  new Visitor({
    TaggedTemplateExpression: ({ tag, quasi }) => {
      const rootName = findTagRootName(tag);
      const isCssTemplate = rootName !== undefined && styledNames.has(rootName);
      if (isCssTemplate) templates.push(quasi);
    },
  }).visit(program);
  return templates;
};

/** Change of the raw text of a template, between two interpolations. */
interface QuasiEdit {
  /** Index in the code where the raw text starts, after the backtick or the brace before it. */
  start: number;
  /** Index in the code after the raw text. */
  end: number;
  /** Minified raw text. */
  text: string;
}

/** Parameters of {@link minifyCssTemplates}. */
interface MinifyCssTemplatesParams {
  /** Code of a module of the app, TypeScript or JavaScript, with or without JSX. */
  code?: string;
  /** Path of the module, e.g. `src/App/App.styled.ts`: its extension tells the language. */
  modulePath?: string;
}

/**
 * Minifies the CSS templates of a module (see {@link findCssTemplates}, {@link minifyCssQuasis}):
 * their comments and indentation would otherwise go to the browser in the JavaScript, where
 * styled-components reads them. The classes that styled-components derives from the text of a
 * template change with it, so the render of the pages in Node.js minifies them too.
 *
 * @returns The code with its CSS templates minified, or `null` when it has none to minify, cannot
 * be parsed, or when the code or the path is missing or blank.
 *
 * @example
 * minifyCssTemplates({
 *   code: "import { css } from '@xstyled/styled-components';\nconst a = css`\n  color: red;\n`;",
 *   modulePath: 'src/a.styled.ts',
 * });
 * // "…const a = css` color: red; `;"
 */
export const minifyCssTemplates = ({ code, modulePath }: MinifyCssTemplatesParams = {}):
  string | null => {
  const canParse = typeof code === 'string' && isNonBlankString(modulePath);
  if (!canParse) return null;

  const edits: QuasiEdit[] = [];
  findCssTemplates({ code, modulePath }).forEach(({ quasis }) => {
    const minified = minifyCssQuasis(quasis.map(({ value }) => value.raw));
    quasis.forEach((element, index) => {
      const text = minified[index];
      if (text === element.value.raw) return;
      // The span of an element starts at the backtick or the brace before its raw text
      const start = element.start + 1;
      edits.push({ start, end: start + element.value.raw.length, text });
    });
  });
  if (edits.length === 0) return null;

  // From the end of the code, so that each position still points where it did in the parsed code.
  // A template nested in an interpolation of another never overlaps its texts
  edits.sort((first, second) => first.start - second.start);
  return edits.reduceRight(
    (result, { start, end, text }) => `${result.slice(0, start)}${text}${result.slice(end)}`,
    code,
  );
};
