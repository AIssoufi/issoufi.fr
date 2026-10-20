// @ts-check

/** Key of the tickets of the repository, which its GitHub autolink turns `ISF-322` into a link. */
export const TICKET_KEY = 'ISF';

/** Name of the commitlint rule that requires the `Refs: ISF-<n>` footer. */
export const TICKET_REFERENCE_RULE = 'footer-ticket-reference';

/**
 * Footer line naming the ticket of a commit, or several tickets separated by commas:
 * `Refs: ISF-322` or `Refs: ISF-322, ISF-330`.
 */
export const TICKET_REFERENCE_FOOTER = new RegExp(
  `^Refs: ${TICKET_KEY}-\\d+(?:, ${TICKET_KEY}-\\d+)*$`,
  'm',
);

/**
 * Subject of the release commits of release-please, as its `pull-request-title-pattern` writes
 * it.
 */
export const RELEASE_SUBJECT = /^chore(?:\([^)]*\))?: release v?\d+\.\d+\.\d+/;

/** Sign-off line that Dependabot writes at the end of each of its commits. */
export const DEPENDABOT_SIGN_OFF = /^Signed-off-by: dependabot\[bot\]/m;
