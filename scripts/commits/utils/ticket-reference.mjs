// @ts-check

import {
  DEPENDABOT_SIGN_OFF,
  RELEASE_SUBJECT,
  TICKET_KEY,
  TICKET_REFERENCE_FOOTER,
} from '../constants.mjs';

/**
 * Parameters of {@link isBotCommit} and {@link hasTicketReference}.
 * @typedef {object} CommitMessageParams
 * @property {unknown} [message] - Whole commit message, header, body and footer.
 */

/**
 * Tells whether a commit message was written by a bot of the repository, release-please or
 * Dependabot, whose commits name no ticket.
 * @param {CommitMessageParams} [params]
 * @returns {boolean} `true` for a release commit of release-please or a commit of Dependabot.
 * @example
 * isBotCommit({ message: 'chore: release 1.4.0' }); // true
 * isBotCommit({ message: 'fix: keep the menu open' }); // false
 */
export const isBotCommit = ({ message } = {}) => {
  if (typeof message !== 'string') return false;
  const isRelease = RELEASE_SUBJECT.test(message);
  const isDependabot = DEPENDABOT_SIGN_OFF.test(message);
  return isRelease || isDependabot;
};

/**
 * Tells whether a commit message names its ticket in a `Refs: ISF-<n>` footer line, after its
 * header.
 * @param {CommitMessageParams} [params]
 * @returns {boolean} `true` when a line after the header is a ticket footer.
 * @example
 * hasTicketReference({ message: 'fix: keep the menu open\n\nRefs: ISF-322' }); // true
 * hasTicketReference({ message: 'fix: keep the menu open' }); // false
 */
export const hasTicketReference = ({ message } = {}) => {
  if (typeof message !== 'string') return false;
  const [, ...linesAfterHeader] = message.split('\n');
  return TICKET_REFERENCE_FOOTER.test(linesAfterHeader.join('\n'));
};

/**
 * commitlint rule requiring the `Refs: ISF-<n>` footer, so that `git log` and `git blame` lead
 * from each change to the reason for it. The commits of release-please and Dependabot are exempt,
 * and commitlint already ignores merge commits.
 * @param {{ raw?: unknown }} [commit] - Commit parsed by commitlint, whose `raw` is the whole
 * message.
 * @returns {[boolean, string]} Whether the commit passes, and the error shown when it does not.
 * @example
 * footerTicketReference({ raw: 'fix: keep the menu open' }); // [false, 'footer must …']
 */
export const footerTicketReference = ({ raw } = {}) => {
  const isValid = isBotCommit({ message: raw }) || hasTicketReference({ message: raw });
  return [isValid, `footer must name the ticket of the commit: Refs: ${TICKET_KEY}-<n>`];
};
