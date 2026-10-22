/** Variable through which the CI forces the colors of the tools that it runs. */
const FORCE_COLOR_VARIABLE = 'FORCE_COLOR';

/** Variable that turns off the colors of a tool, whatever its value, once set. */
const NO_COLOR_VARIABLE = 'NO_COLOR';

/**
 * Copies an environment without colors: without `FORCE_COLOR`, which the CI sets, and with
 * `NO_COLOR`, so that a script that a spec runs in a child process writes its output without the
 * escape codes of colors.
 *
 * @param {unknown} env - Environment to copy, such as `process.env`. Any value that is not an
 * object, or an array, counts as an empty environment.
 * @returns {Record<string, unknown>} A new environment, which leaves the given one as it is.
 * @example
 * withoutColors({ FORCE_COLOR: '1', PATH: '/bin' }); // { PATH: '/bin', NO_COLOR: '1' }
 */
export const withoutColors = env => {
  const isEnvironment = typeof env === 'object' && env !== null && !Array.isArray(env);
  const variables = isEnvironment ? Object.entries(env) : [];
  return {
    ...Object.fromEntries(variables.filter(([name]) => name !== FORCE_COLOR_VARIABLE)),
    [NO_COLOR_VARIABLE]: '1',
  };
};

/**
 * Environment of a script or a tool that a spec runs in a child process, such as commitlint or a
 * script of `scripts/ci/`: that of the tests, without the colors that the CI forces, which would
 * break the text of its output with escape codes.
 */
export const UNCOLORED_ENV = withoutColors(process.env);
