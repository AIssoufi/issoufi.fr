// @ts-check
import { GITHUB_DIR } from '../constants.mjs';
import {
  DEFAULT_PLAYWRIGHT_DISTRIBUTION,
  IMAGE_KEY,
  LOCKFILE_IMPORTERS_LINE,
  OCI_IMAGE_INDEX_MEDIA_TYPE,
  PLAYWRIGHT_IMAGE_DOCS,
  PLAYWRIGHT_IMAGE_PATTERN,
  PLAYWRIGHT_IMAGE_PREFIX,
  PLAYWRIGHT_MANIFESTS_URL,
  PLAYWRIGHT_PACKAGE,
  PNPM_LOCKFILE,
} from './constants.mjs';
import { findKeyLines } from './yaml.mjs';

/**
 * Image of Playwright named by an `image:` key of a workflow, read by {@link findPlaywrightImages}.
 * @typedef {object} PlaywrightImage
 * @property {number} line - Line of the key, counted from 1.
 * @property {number} column - Column of the key, counted from 1.
 * @property {string} image - Value of the key without its quotes and its comment, e.g.
 * `mcr.microsoft.com/playwright:v1.64.0-noble@sha256:…`.
 */

/**
 * Image of Playwright with the file that names it, as the check reads it from each YAML file.
 * @typedef {PlaywrightImage & { file?: string }} LocatedPlaywrightImage
 */

/**
 * Parameters of {@link describeImageProblem}.
 * @typedef {object} DescribeImageProblemParams
 * @property {unknown} [image] - Image of Playwright, e.g.
 * `mcr.microsoft.com/playwright:v1.64.0-noble@sha256:…`.
 * @property {unknown} [lockedVersion] - Version of `@playwright/test` in the lockfile, e.g.
 * `1.64.0`.
 */

/**
 * Parameters of {@link findVersionProblems}.
 * @typedef {object} FindVersionProblemsParams
 * @property {LocatedPlaywrightImage[]} [images] - Images of Playwright of the workflows. None by
 * default.
 * @property {string} [lockedVersion] - Version of `@playwright/test` in the lockfile, or
 * `undefined` when it lists none.
 */

/**
 * Problem that the check writes as an error annotation, on the line of an image, on the lockfile,
 * or on no file when no workflow names an image.
 * @typedef {object} VersionProblem
 * @property {string} [file] - File to annotate.
 * @property {number} [line] - Line to annotate, counted from 1.
 * @property {number} [column] - Column to annotate, counted from 1.
 * @property {string} message - Text of the annotation.
 */

/**
 * Text of the problem of a lockfile that lists no version of `@playwright/test`, which leaves
 * nothing to compare the images with.
 */
const MISSING_LOCKED_VERSION_MESSAGE = [
  `${PNPM_LOCKFILE} lists no version of ${PLAYWRIGHT_PACKAGE} under ${LOCKFILE_IMPORTERS_LINE},`,
  'so the check cannot compare the image of Playwright with it.',
].join(' ');

/**
 * Reads the images of Playwright that the `image:` keys of a workflow name, such as the container
 * of a job, line by line, as {@link findKeyLines} reads the keys: one per line, in block style,
 * outside the block scalars.
 * @param {unknown} source - Text of the YAML file. Any value that is not a text counts as an empty
 * file.
 * @returns {PlaywrightImage[]} The images whose name starts with {@link PLAYWRIGHT_IMAGE_PREFIX},
 * at any tag, in the order of the file.
 * @example
 * findPlaywrightImages('container:\n  image: mcr.microsoft.com/playwright:v1.64.0-noble\n');
 * // [{ line: 2, column: 3, image: 'mcr.microsoft.com/playwright:v1.64.0-noble' }]
 */
export const findPlaywrightImages = source =>
  findKeyLines(source).flatMap(({ line, column, key, value }) => {
    const isPlaywrightImage = key === IMAGE_KEY && value.startsWith(PLAYWRIGHT_IMAGE_PREFIX);
    return isPlaywrightImage ? [{ line, column, image: value }] : [];
  });

/**
 * Writes the command that prints the digest of a tag of the image of Playwright.
 * @param {string} tag - Tag of the image, e.g. `v1.64.0-noble`.
 * @returns {string} The `curl` command, which reads the headers of the manifest of the tag.
 */
const formatDigestCommand = tag =>
  `curl -sSI -H 'Accept: ${OCI_IMAGE_INDEX_MEDIA_TYPE}' ${PLAYWRIGHT_MANIFESTS_URL}${tag} | grep -i '^docker-content-digest'`;

/**
 * Tells why an image of Playwright does not run the version of `@playwright/test` that the
 * lockfile installs, whose browsers then fail to launch in it.
 * @param {DescribeImageProblemParams} [params] - The image and the version of the lockfile. A
 * value that is not a text counts as empty.
 * @returns {string | undefined} The reason, with the tag to write and the command that prints its
 * digest, or `undefined` when the tag names the version of the lockfile. Without a version of the
 * lockfile, the reason says that it lists none, and gives no tag.
 * @example
 * describeImageProblem({
 *   image: 'mcr.microsoft.com/playwright:v1.63.0-noble@sha256:…',
 *   lockedVersion: '1.64.0',
 * }); // 'The tag v1.63.0-noble of this image runs Playwright 1.63.0, but … docker-content-digest'
 */
export const describeImageProblem = ({ image, lockedVersion } = {}) => {
  const name = typeof image === 'string' ? image.trim() : '';
  const version = typeof lockedVersion === 'string' ? lockedVersion.trim() : '';
  if (!version) return MISSING_LOCKED_VERSION_MESSAGE;

  const { version: imageVersion, distribution = '' } =
    PLAYWRIGHT_IMAGE_PATTERN.exec(name)?.groups ?? {};
  if (imageVersion === version) return undefined;

  const newDistribution = imageVersion ? distribution : DEFAULT_PLAYWRIGHT_DISTRIBUTION;
  const newTag = `v${version}${newDistribution}`;
  const fix = [
    `Write the tag ${newTag} and the digest that this command prints (${PLAYWRIGHT_IMAGE_DOCS}):`,
    formatDigestCommand(newTag),
  ].join(' ');
  if (!imageVersion) {
    return [
      `The tag of ${name || 'this image'} names no version of Playwright, such as ${newTag},`,
      `so the check cannot compare it with ${PLAYWRIGHT_PACKAGE} ${version} in ${PNPM_LOCKFILE}.`,
      fix,
    ].join(' ');
  }

  return [
    `The tag v${imageVersion}${distribution} of this image runs Playwright ${imageVersion}, but`,
    `${PNPM_LOCKFILE} installs ${PLAYWRIGHT_PACKAGE} ${version}, whose browsers do not launch in`,
    `the image of another version. ${fix}`,
  ].join(' ');
};

/**
 * Lists what keeps the images of Playwright of the workflows from running the version of
 * `@playwright/test` that the lockfile installs: a lockfile without that version, no image at
 * all, or an image whose tag names another version.
 * @param {FindVersionProblemsParams} [params] - The images and the version of the lockfile.
 * @returns {VersionProblem[]} The problems, empty when every image runs the version of the
 * lockfile.
 * @example
 * findVersionProblems({
 *   images: [
 *     {
 *       file: '.github/workflows/ci.yml',
 *       line: 229,
 *       column: 7,
 *       image: 'mcr.microsoft.com/playwright:v1.64.0-noble',
 *     },
 *   ],
 *   lockedVersion: '1.64.0',
 * }); // []
 */
export const findVersionProblems = ({ images = [], lockedVersion } = {}) => {
  if (!lockedVersion) return [{ file: PNPM_LOCKFILE, message: MISSING_LOCKED_VERSION_MESSAGE }];

  if (images.length === 0) {
    const example = `${PLAYWRIGHT_IMAGE_PREFIX}v${lockedVersion}${DEFAULT_PLAYWRIGHT_DISTRIBUTION}@sha256:…`;
    const message = [
      `No ${IMAGE_KEY}: key of ${GITHUB_DIR}/ names an image of Playwright (${example}),`,
      'so the check compares nothing: name it as the container of the WebKit job, or remove the',
      'check from the workflows job of ci.yml.',
    ].join(' ');
    return [{ message }];
  }

  return images.flatMap(({ file, line, column, image }) => {
    const message = describeImageProblem({ image, lockedVersion });
    return message ? [{ file, line, column, message }] : [];
  });
};
