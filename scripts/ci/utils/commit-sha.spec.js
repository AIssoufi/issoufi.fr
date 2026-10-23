import { isCommitSha, shortenSha } from './commit-sha.mjs';
import { SHA } from './testUtils.js';

describe('isCommitSha', () => {
  it('accepts a full commit SHA', () => {
    expect(isCommitSha(SHA)).toBe(true);
  });

  it.each([
    undefined,
    null,
    '',
    '58ff9ea',
    SHA.toUpperCase(),
    `${SHA}0`,
    ` ${SHA}`,
    'origin/develop',
    'g'.repeat(40),
    42,
  ])('rejects %o', value => {
    expect(isCommitSha(value)).toBe(false);
  });
});

describe('shortenSha', () => {
  it('keeps the first 7 digits', () => {
    expect(shortenSha(SHA)).toBe('58ff9ea');
  });

  it('keeps a shorter text whole', () => {
    expect(shortenSha('58ff')).toBe('58ff');
  });

  it.each([undefined, null, 42])('returns an empty string for %o', value => {
    expect(shortenSha(value)).toBe('');
  });
});
