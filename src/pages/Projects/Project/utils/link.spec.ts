import { getProjectLinkUrl } from './link.ts';

describe('getProjectLinkUrl', () => {
  const URL = 'https://example.com/chess';

  it('links a card that has a url and a name', () => {
    expect(getProjectLinkUrl({ url: URL, name: 'Chess' })).toBe(URL);
  });

  it.each([
    ['no url', { name: 'Chess' }],
    ['an empty url', { url: '', name: 'Chess' }],
    ['a blank url', { url: '   ', name: 'Chess' }],
    ['a url that is not a string', { url: 42, name: 'Chess' }],
    ['no name', { url: URL }],
    ['an empty name', { url: URL, name: '' }],
    ['a blank name', { url: URL, name: '  ' }],
    ['a null name', { url: URL, name: null }],
    ['no project', undefined],
    ['a null project', null],
  ])('gives no link to a card with %s', (_case, project) => {
    expect(getProjectLinkUrl(project as Parameters<typeof getProjectLinkUrl>[0])).toBeUndefined();
  });
});
