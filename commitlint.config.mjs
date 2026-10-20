// @ts-check

import { TICKET_REFERENCE_RULE } from './scripts/commits/constants.mjs';
import { footerTicketReference } from './scripts/commits/utils/ticket-reference.mjs';

/** commitlint configuration of the commits: Conventional Commits, each naming its ticket. */
export default {
  extends: ['@commitlint/config-conventional'],
  plugins: [{ rules: { [TICKET_REFERENCE_RULE]: footerTicketReference } }],
  rules: { [TICKET_REFERENCE_RULE]: [2, 'always'] },
};
