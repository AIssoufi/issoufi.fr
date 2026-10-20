import { createHash } from 'node:crypto';
import { type ESTree, parseSync, Visitor } from 'vite';

import { isNonBlankString } from '../../../src/utils/strings.ts';
import {
  COMPONENT_ID_HASH_LENGTH,
  COMPONENT_ID_PREFIX,
  FACTORY_METHODS,
  STYLED_EXPORT_NAME,
  STYLED_MODULE,
} from '../constants.ts';

/** Reads the name of what an import specifier imports, written as a name or as a string. */
const getImportedName = ({ imported }: ESTree.ImportSpecifier) =>
  imported.type === 'Identifier' ? imported.name : imported.value;

/**
 * Lists the names that a module gives to `styled` of {@link STYLED_MODULE}: its default export, or
 * its export named {@link STYLED_EXPORT_NAME}.
 */
const findStyledNames = (program: ESTree.Program): Set<string> => {
  const names = new Set<string>();
  program.body.forEach(statement => {
    const isStyledImport =
      statement.type === 'ImportDeclaration' && statement.source.value === STYLED_MODULE;
    if (!isStyledImport) return;

    statement.specifiers.forEach(specifier => {
      const isDefaultImport = specifier.type === 'ImportDefaultSpecifier';
      const isNamedImport =
        specifier.type === 'ImportSpecifier' && getImportedName(specifier) === STYLED_EXPORT_NAME;
      if (isDefaultImport || isNamedImport) names.add(specifier.local.name);
    });
  });
  return names;
};

/** Tells whether a node calls a method that returns another factory, as in `styled.a.attrs(…)`. */
const isFactoryMethodCall = (
  node: ESTree.Expression,
): node is ESTree.CallExpression & { callee: ESTree.StaticMemberExpression } =>
  node.type === 'CallExpression' &&
  node.callee.type === 'MemberExpression' &&
  !node.callee.computed &&
  FACTORY_METHODS.has(node.callee.property.name);

/** Parameters of {@link isStyledFactory}. */
interface IsStyledFactoryParams {
  /** Node at the start of the tag of a tagged template. */
  node: ESTree.Expression;
  /** Names of `styled` in the module. */
  styledNames: Set<string>;
}

/** Tells whether a node makes the factory of a styled component: `styled.a` or `styled(Link)`. */
const isStyledFactory = ({ node, styledNames }: IsStyledFactoryParams) => {
  const isElementFactory =
    node.type === 'MemberExpression' &&
    !node.computed &&
    node.object.type === 'Identifier' &&
    styledNames.has(node.object.name);
  const isComponentFactory =
    node.type === 'CallExpression' &&
    node.callee.type === 'Identifier' &&
    styledNames.has(node.callee.name);
  return isElementFactory || isComponentFactory;
};

/** Parameters of {@link findStyledFactory}. */
interface FindStyledFactoryParams {
  /** Tag of a tagged template. */
  tag: ESTree.Expression;
  /** Names of `styled` in the module. */
  styledNames: Set<string>;
}

/**
 * Finds the factory of a styled component that the tag of a tagged template starts with, before
 * the methods that return another factory: `styled.a` in ``styled.a.attrs({ … })`…` ``.
 *
 * @returns The node of the factory, or `undefined` when the tag defines no styled component.
 */
const findStyledFactory = ({ tag, styledNames }: FindStyledFactoryParams) => {
  let node = tag;
  while (isFactoryMethodCall(node)) node = node.callee.object;
  return isStyledFactory({ node, styledNames }) ? node : undefined;
};

/** Parameters of {@link getComponentId}. */
interface GetComponentIdParams {
  /** Path of the module from the root of the project, e.g. `src/App/App.styled.ts`. */
  modulePath: string;
  /** Place of the component among the styled components of the module, from 0. */
  index: number;
}

/** Builds the id of a styled component from its module and its place in it, e.g. `sc-1a2b3c4d`. */
const getComponentId = ({ modulePath, index }: GetComponentIdParams) => {
  const hash = createHash('sha256').update(`${modulePath}#${index}`).digest('hex');
  return `${COMPONENT_ID_PREFIX}${hash.slice(0, COMPONENT_ID_HASH_LENGTH)}`;
};

/** Parameters of {@link addComponentIds}. */
interface AddComponentIdsParams {
  /** Code of a module of the app, TypeScript or JavaScript, with or without JSX. */
  code?: string;
  /**
   * Path of the module from the root of the project, with `/` separators, e.g.
   * `src/App/App.styled.ts`: the ids derive from it, and its extension tells the language.
   */
  modulePath?: string;
}

/**
 * Gives each styled component that a module defines with `styled` of {@link STYLED_MODULE} an id
 * that derives from the path of the module and from the place of the component in it, through
 * `.withConfig({ componentId })` after its factory (`styled.a`, `styled(Link)`). Without it,
 * styled-components numbers its components in the order that it creates them, which differs
 * between the build, whose chunks run the modules in their own order, and the render of the pages
 * in Node.js: the classes of a page would then differ from those that the browser computes when it
 * hydrates it.
 *
 * @returns The code with an id for each styled component, or `null` when the module defines none,
 * cannot be parsed, or when the code or the path is missing or blank.
 *
 * @example
 * addComponentIds({
 *   code: "import styled from '@xstyled/styled-components';\nconst A = styled.a`color: red;`;",
 *   modulePath: 'src/A.styled.ts',
 * });
 * // "…const A = styled.a.withConfig({ componentId: \"sc-…\" })`color: red;`;"
 */
export function addComponentIds({ code, modulePath }: AddComponentIdsParams = {}): string | null {
  const canParse =
    typeof code === 'string' && code.includes(STYLED_MODULE) && isNonBlankString(modulePath);
  if (!canParse) return null;

  const { program, errors } = parseSync(modulePath, code);
  const styledNames = errors.length === 0 ? findStyledNames(program) : new Set<string>();
  if (styledNames.size === 0) return null;

  const factoryEnds: number[] = [];
  new Visitor({
    TaggedTemplateExpression: ({ tag }) => {
      const factory = findStyledFactory({ tag, styledNames });
      if (factory) factoryEnds.push(factory.end);
    },
  }).visit(program);
  if (factoryEnds.length === 0) return null;

  // In the order of the code, which the visitor leaves for a component nested in the factory of
  // another (``styled(styled.a`…`)`…` ``), then from its end, so that each position still points
  // where it did in the parsed code
  factoryEnds.sort((first, second) => first - second);
  return factoryEnds.reduceRight((result, end, index) => {
    const componentId = JSON.stringify(getComponentId({ modulePath, index }));
    return `${result.slice(0, end)}.withConfig({ componentId: ${componentId} })${result.slice(end)}`;
  }, code);
}
