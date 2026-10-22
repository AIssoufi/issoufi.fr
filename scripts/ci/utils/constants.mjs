// @ts-check
// Constants of the YAML lines that `yaml.mjs` reads, besides the patterns that it takes from
// `scripts/ci/constants.mjs`, and of the checkout steps that `checkout-credentials.mjs` reads.

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
