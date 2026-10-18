import { PAGES } from '../src/utils/pages';
import { NOT_FOUND_ROUTE } from './constants';
import { getCheckedRoutes } from './utils';

describe('getCheckedRoutes', () => {
  it('opens every page of PAGES, then the not found page', () => {
    expect(getCheckedRoutes(PAGES)).toEqual([...PAGES.map(({ path }) => path), NOT_FOUND_ROUTE]);
  });

  it('opens a new page without any change to the tests', () => {
    expect(getCheckedRoutes([{ path: '/' }, { path: '/skills' }])).toEqual([
      '/',
      '/skills',
      NOT_FOUND_ROUTE,
    ]);
  });

  it('keeps the order of the pages', () => {
    expect(getCheckedRoutes([{ path: '/projects' }, { path: '/' }])).toEqual([
      '/projects',
      '/',
      NOT_FOUND_ROUTE,
    ]);
  });

  describe('edge cases', () => {
    it.each([undefined, null, [], 'index.html', 42, { path: '/' }])(
      'opens only the not found page for the pages %j',
      pages => {
        expect(getCheckedRoutes(pages as never)).toEqual([NOT_FOUND_ROUTE]);
      },
    );

    it('opens each route once, a page at the not found route included', () => {
      expect(getCheckedRoutes([{ path: '/' }, { path: '/' }, { path: NOT_FOUND_ROUTE }])).toEqual([
        '/',
        NOT_FOUND_ROUTE,
      ]);
    });

    it.each([undefined, null, '', 'projects', 'https://issoufi.fr/', 42, ['/'], {}])(
      'skips a page whose path %j is not a route',
      path => {
        expect(getCheckedRoutes([{ path }, { path: '/' }])).toEqual(['/', NOT_FOUND_ROUTE]);
      },
    );

    it.each([undefined, null, '/projects', 42, true])(
      'skips the entry %j, which is not a page',
      entry => {
        expect(getCheckedRoutes([entry as never, { path: '/' }])).toEqual(['/', NOT_FOUND_ROUTE]);
      },
    );

    it('skips a page without a path', () => {
      expect(getCheckedRoutes([{}, { path: '/' }])).toEqual(['/', NOT_FOUND_ROUTE]);
    });
  });
});
