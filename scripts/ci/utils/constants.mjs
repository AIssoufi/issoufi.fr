// @ts-check
// Constants of the YAML lines that `yaml.mjs` reads, besides the patterns that it takes from
// `scripts/ci/constants.mjs`.

/** `#` that starts a YAML comment, with the spaces around it, at the start of a text. */
export const YAML_COMMENT_MARK_PATTERN = /^\s*#\s*/;

/**
 * Line that holds only the indicators of a YAML sequence item, and maybe a comment: the mapping
 * of the item starts with the next key, on a line of its own (`-`, then `uses: …` below it).
 */
export const YAML_EMPTY_ITEM_LINE_PATTERN = /^\s*(?:-(?:\s+|$))+(?:#.*)?$/;

/** Indicator of an item of a YAML block sequence, such as a step of a job (`- uses: …`). */
export const YAML_SEQUENCE_ITEM_INDICATOR = '-';
