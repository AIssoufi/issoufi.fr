import { footerTicketReference, hasTicketReference, isBotCommit } from './ticket-reference.mjs';

const RELEASE = 'chore: release 1.4.0';
const DEPENDABOT = [
  'build(deps-dev): Bump vitest from 4.0.1 to 4.1.0',
  '',
  'Bumps [vitest](https://github.com/vitest-dev/vitest) from 4.0.1 to 4.1.0.',
  '',
  'Signed-off-by: dependabot[bot] <support@github.com>',
].join('\n');

describe('isBotCommit', () => {
  it.each([
    RELEASE,
    'chore: release v2.0.0',
    'chore(develop): release 1.4.1',
    `${RELEASE}\n\nRelease-As: 1.4.0`,
    DEPENDABOT,
  ])('recognizes the bot commit %j', message => {
    expect(isBotCommit({ message })).toBe(true);
  });

  it.each([
    'fix: keep the menu open',
    'chore: release the lock of the menu',
    'feat: chore: release 1.4.0',
    'docs: explain the sign-off\n\nSigned-off-by: ADAM Issoufi <me@example.com>',
    'docs: quote Signed-off-by: dependabot[bot] in a sentence',
    '',
  ])('takes %j for a person’s commit', message => {
    expect(isBotCommit({ message })).toBe(false);
  });

  it.each([undefined, null, 42, {}, ['chore: release 1.4.0']])('is false for %o', message => {
    expect(isBotCommit({ message })).toBe(false);
  });

  it('is false without parameters', () => {
    expect(isBotCommit()).toBe(false);
  });
});

describe('hasTicketReference', () => {
  it.each([
    'fix: keep the menu open\n\nRefs: ISF-322',
    'fix: keep the menu open\n\nRefs: ISF-1',
    'fix: keep the menu open\n\nRefs: ISF-322, ISF-330',
    'fix: keep the menu open\n\nbody\n\nRefs: ISF-322\nCo-Authored-By: A <a@example.com>',
    'fix: keep the menu open\n\nCo-Authored-By: A <a@example.com>\nRefs: ISF-322\n',
    // Out of the trailers, as in commits made before the rule
    'fix: keep the menu open\n\nRefs: ISF-322\n\nCo-Authored-By: A <a@example.com>',
    'fix: keep the menu open\n\nWhy.\nRefs: ISF-322\n\nMore.',
  ])('finds the ticket footer of %j', message => {
    expect(hasTicketReference({ message })).toBe(true);
  });

  it.each([
    'fix: keep the menu open',
    'fix: keep the menu open\n\nRefs: ISF-',
    'fix: keep the menu open\n\nRefs: #322',
    'fix: keep the menu open\n\nRefs: FRONT-322',
    'fix: keep the menu open\n\nRefs: isf-322',
    'fix: keep the menu open\n\nRefs:ISF-322',
    'fix: keep the menu open\n\nRefs: ISF-322 and more',
    'fix: keep the menu open\n\nSee Refs: ISF-322',
    'fix: keep the menu open\n\nRef: ISF-322',
    'Refs: ISF-322',
    '',
  ])('finds no ticket footer in %j', message => {
    expect(hasTicketReference({ message })).toBe(false);
  });

  it.each([undefined, null, 42, {}, ['x', 'Refs: ISF-322']])('is false for %o', message => {
    expect(hasTicketReference({ message })).toBe(false);
  });

  it('is false without parameters', () => {
    expect(hasTicketReference()).toBe(false);
  });
});

describe('footerTicketReference', () => {
  it.each(['fix: keep the menu open\n\nRefs: ISF-322', RELEASE, DEPENDABOT])('passes %j', raw => {
    expect(footerTicketReference({ raw })[0]).toBe(true);
  });

  it.each(['fix: keep the menu open', '', undefined, null, 42])('fails %o', raw => {
    expect(footerTicketReference({ raw })).toEqual([
      false,
      'footer must name the ticket of the commit: Refs: ISF-<n>',
    ]);
  });

  it('fails without a commit', () => {
    expect(footerTicketReference()[0]).toBe(false);
  });
});
