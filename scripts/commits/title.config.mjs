// @ts-check

import config from '../../commitlint.config.mjs';
import { TICKET_REFERENCE_RULE } from './constants.mjs';

/**
 * commitlint configuration of the title of a pull request, which the CI lints as a Conventional
 * Commits header: the rules of the commits, without the ticket footer that a title cannot hold.
 */
export default {
  ...config,
  rules: { ...config.rules, [TICKET_REFERENCE_RULE]: [0] },
};
