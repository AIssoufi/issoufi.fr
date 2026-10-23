// @ts-check
// Constants of the YAML lines that `yaml.mjs` reads, besides the patterns that it takes from
// `scripts/ci/constants.mjs`, of the checkout steps that `checkout-credentials.mjs` reads, and of
// the image of Playwright that `playwright-image.mjs` reads, and of the lockfile of pnpm that
// `pnpm-lockfile.mjs` reads.

/** `#` that starts a YAML comment, with the spaces around it, at the start of a text. */
export const YAML_COMMENT_MARK_PATTERN = /^\s*#\s*/;

/**
 * Line that holds only the indicators of a YAML sequence item, and maybe a comment: the mapping
 * of the item starts with the next key, on a line of its own (`-`, then `uses: …` below it).
 */
export const YAML_EMPTY_ITEM_LINE_PATTERN = /^\s*(?:-(?:\s+|$))+(?:#.*)?$/;

/** Indicator of an item of a YAML block sequence, such as a step of a job (`- uses: …`). */
export const YAML_SEQUENCE_ITEM_INDICATOR = '-';

/**
 * Reference of `actions/checkout` at any version, e.g. `actions/checkout@v7`. GitHub reads the
 * owner and the name of an action in any case.
 */
export const CHECKOUT_ACTION_PATTERN = /^actions\/checkout@/i;

/** Key of the inputs that a step passes to its action. */
export const STEP_INPUTS_KEY = 'with';

/**
 * Input of `actions/checkout` that keeps the token of the job, or the SSH key that the step
 * passes, in the git config of the checkout for every later step of the job. It defaults to true.
 */
export const PERSIST_CREDENTIALS_INPUT = 'persist-credentials';

/** Value of {@link PERSIST_CREDENTIALS_INPUT} that drops the credentials once the checkout ends. */
export const CREDENTIALS_DROPPED_VALUE = 'false';

/** Value of {@link PERSIST_CREDENTIALS_INPUT} that keeps them, which a comment must explain. */
export const CREDENTIALS_KEPT_VALUE = 'true';

/** Key of a job's container, or of a service, that names the Docker image it runs in. */
export const IMAGE_KEY = 'image';

/** Start of the image of Playwright, which holds its browsers and their system libraries. */
export const PLAYWRIGHT_IMAGE_PREFIX = 'mcr.microsoft.com/playwright:';

/**
 * Image of Playwright whose tag names its version, and maybe its distribution, then maybe the
 * digest of its content, e.g. `mcr.microsoft.com/playwright:v1.64.0-noble@sha256:…`: the
 * `version` and the `distribution` (`-noble`) of its tag. A tag such as `latest` does not match.
 */
export const PLAYWRIGHT_IMAGE_PATTERN =
  /^mcr\.microsoft\.com\/playwright:v(?<version>\d+\.\d+\.\d+)(?<distribution>-[a-z]+)?(?:@|$)/;

/**
 * Distribution of the tag that the check suggests for an image whose tag names no version: noble,
 * Ubuntu 24.04, as the image of the WebKit job runs.
 */
export const DEFAULT_PLAYWRIGHT_DISTRIBUTION = '-noble';

/** Package whose version the image of Playwright must run, or its browsers do not launch. */
export const PLAYWRIGHT_PACKAGE = '@playwright/test';

/** Lockfile of pnpm, relative to the project root. */
export const PNPM_LOCKFILE = 'pnpm-lock.yaml';

/** Top-level key of the lockfile of pnpm under which each project lists its dependencies. */
export const LOCKFILE_IMPORTERS_LINE = 'importers:';

/** Key of a dependency of a project in the lockfile of pnpm, under which its version stands. */
export const LOCKFILE_VERSION_KEY = 'version';

/**
 * End of a version of the lockfile of pnpm that lists the peer dependencies of the package, as in
 * `10.0.1(eslint@10.12.0)`.
 */
export const LOCKFILE_PEER_SUFFIX_PATTERN = /\(.*$/;

/** URL under which the registry of Microsoft serves the manifest of each tag of Playwright. */
export const PLAYWRIGHT_MANIFESTS_URL = 'https://mcr.microsoft.com/v2/playwright/manifests/';

/**
 * Media type of the index of a multi-platform image, whose digest the workflow pins: the registry
 * answers with it, and gives its digest in the `docker-content-digest` header.
 */
export const OCI_IMAGE_INDEX_MEDIA_TYPE = 'application/vnd.oci.image.index.v1+json';

/** Section of the docs that tells how to change the tag and the digest of the image. */
export const PLAYWRIGHT_IMAGE_DOCS = 'docs/testing.md, section "In WebKit"';
