// @ts-check
import { DOCKER_DIGEST_PATTERN } from '../constants.mjs';
import {
  CONTAINER_KEY,
  CONTAINER_KEY_DEPTH,
  IMAGE_KEY,
  JOBS_KEY,
  SERVICE_KEY_DEPTH,
  SERVICES_KEY,
} from './constants.mjs';
import { findKeyLines } from './yaml.mjs';

/**
 * Key of a YAML block mapping with the keys of the mappings that hold it.
 * @typedef {import('./yaml.mjs').YamlKeyLine & KeyPath} YamlKeyPath
 */

/**
 * Place of a key in a YAML file.
 * @typedef {object} KeyPath
 * @property {string[]} path - Keys of the mappings that hold the key, from the top-level one,
 * e.g. `['jobs', 'test']` for the `container:` key of the job `test`.
 */

/**
 * Container of a job, or service of a job, that runs in a Docker image.
 * @typedef {object} ImageHolder
 * @property {string} job - Key of the job, e.g. `browser-test-webkit`.
 * @property {string} [service] - Key of the service, e.g. `redis`, or `undefined` for the
 * container of the job.
 */

/**
 * Image of a container or of a service of a workflow, read by {@link findJobImages}.
 * @typedef {ImageHolder & JobImageLocation} JobImage
 */

/**
 * Place and value of the image of a container or of a service.
 * @typedef {object} JobImageLocation
 * @property {number} line - Line of the key that names the image, counted from 1: the `image:`
 * key, the `container:` key or the key of the service.
 * @property {number} column - Column of that key, counted from 1.
 * @property {string} image - Image without its quotes and its comment, e.g.
 * `postgres:17@sha256:…`. Empty when no key names it on its line.
 */

/**
 * Parameters of {@link describeImagePinProblem}.
 * @typedef {object} DescribeImagePinProblemParams
 * @property {unknown} [image] - Image of the container or of the service, e.g. `postgres:17`.
 * @property {unknown} [job] - Key of the job, e.g. `test`.
 * @property {unknown} [service] - Key of the service, or `undefined` for the container of the job.
 */

/**
 * Gives each key of a YAML file the keys of the mappings that hold it, from the top-level one,
 * read from the columns of the keys that {@link findKeyLines} gives.
 * @param {import('./yaml.mjs').YamlKeyLine[]} keyLines - Keys of the file, in its order.
 * @returns {YamlKeyPath[]} The keys, each with the keys that hold it, e.g. `['jobs', 'test']`
 * for the `container:` key of the job `test`.
 */
const readKeyPaths = keyLines => {
  /** @type {import('./yaml.mjs').YamlKeyLine[]} */
  const holders = [];
  return keyLines.map(keyLine => {
    // The columns of the holders grow, so the ones left of the key hold it
    holders.splice(holders.findLastIndex(holder => holder.column < keyLine.column) + 1);
    const path = holders.map(({ key }) => key);
    holders.push(keyLine);
    return { ...keyLine, path };
  });
};

/**
 * Tells which container or service of a job a key names, from the keys that hold it.
 * @param {YamlKeyPath} keyPath - Key with the keys that hold it.
 * @returns {ImageHolder | undefined} The job and maybe the service, or `undefined` for any other
 * key.
 */
const readImageHolder = ({ key, path }) => {
  const [root, job, parent] = path;
  const isInJob = root === JOBS_KEY && job !== undefined;
  const isContainer = isInJob && path.length === CONTAINER_KEY_DEPTH && key === CONTAINER_KEY;
  if (isContainer) return { job };

  const isService = isInJob && path.length === SERVICE_KEY_DEPTH && parent === SERVICES_KEY;
  return isService ? { job, service: key } : undefined;
};

/**
 * Parameters of {@link isSamePath}.
 * @typedef {object} IsSamePathParams
 * @property {string[]} path - Keys that hold a key.
 * @property {string[]} otherPath - Keys that hold another key.
 */

/**
 * Tells whether two lists of keys name the same place of a YAML file.
 * @param {IsSamePathParams} params - Both lists of keys.
 * @returns {boolean} True when both hold the same keys, in the same order.
 */
const isSamePath = ({ path, otherPath }) =>
  path.length === otherPath.length && path.every((key, index) => key === otherPath[index]);

/**
 * Reads the Docker images in which the jobs of a workflow run: the container of a job
 * (`jobs.<job>.container`) and each of its services (`jobs.<job>.services.<service>`), named by
 * their key itself (`container: node:24`) or by their `image:` key. It reads the keys line by line,
 * as {@link findKeyLines} does: one per line, in block style, outside the block scalars.
 * @param {unknown} source - Text of the YAML file. Any value that is not a text counts as an empty
 * file.
 * @returns {JobImage[]} The images, in the order of the file, with an empty image for a container
 * or a service that names none on its line, nor on the line of its `image:` key.
 * @example
 * findJobImages('jobs:\n  test:\n    container:\n      image: node:24\n');
 * // [{ job: 'test', line: 4, column: 7, image: 'node:24' }]
 */
export const findJobImages = source => {
  const keyPaths = readKeyPaths(findKeyLines(source));
  return keyPaths.flatMap(keyPath => {
    const holder = readImageHolder(keyPath);
    if (!holder) return [];

    const { line, column, key, value, path } = keyPath;
    if (value) return [{ ...holder, line, column, image: value }];

    const holderPath = [...path, key];
    /** @param {YamlKeyPath} other - Another key of the file. */
    const isImageKeyOfHolder = other =>
      other.key === IMAGE_KEY && isSamePath({ path: other.path, otherPath: holderPath });
    const imageKey = keyPaths.find(isImageKeyOfHolder);
    if (!imageKey) return [{ ...holder, line, column, image: '' }];
    return [{ ...holder, line: imageKey.line, column: imageKey.column, image: imageKey.value }];
  });
};

/**
 * Names the container or the service of a job in a message.
 * @param {ImageHolder} holder - The job and maybe the service. An empty job gives `a job`.
 * @returns {string} E.g. `the service redis of the job test`.
 */
const describeHolder = ({ job, service }) => {
  const jobName = job === '' ? 'a job' : `the job ${job}`;
  return service === undefined
    ? `the container of ${jobName}`
    : `the service ${service} of ${jobName}`;
};

/**
 * Tells why the image of the container or of a service of a job lets it run other code with no
 * change in this repository: an image referenced by a tag, which its owner can move, rather than
 * by the SHA-256 digest of its content, or no image that the check can read.
 * @param {DescribeImagePinProblemParams} [params] - The image, its job and maybe its service. A
 * value that is not a text counts as empty.
 * @returns {string | undefined} The reason, which names the job and the service, or `undefined`
 * for an image pinned by its digest, after its tag or not.
 * @example
 * describeImagePinProblem({ image: 'postgres:17', job: 'test', service: 'db' });
 * // 'postgres:17, the image of the service db of the job test, is not pinned: …'
 */
export const describeImagePinProblem = ({ image, job, service } = {}) => {
  const name = typeof image === 'string' ? image.trim() : '';
  const holder = describeHolder({
    job: typeof job === 'string' ? job : '',
    service: typeof service === 'string' ? service : undefined,
  });
  if (name === '') {
    return `No image of ${holder} stands on the line of its key: write it on the line of its ${IMAGE_KEY}: key, pinned by its digest (<image>:<tag>@sha256:<digest>), so that the check can read it.`;
  }

  if (DOCKER_DIGEST_PATTERN.test(name)) return undefined;
  return `${name}, the image of ${holder}, is not pinned: reference it by the SHA-256 digest of its content (<image>:<tag>@sha256:<digest>), since the owner of a tag can move it.`;
};
