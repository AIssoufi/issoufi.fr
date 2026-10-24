import { parseLikedIds, setLike } from './likes.ts';

describe('parseLikedIds', () => {
  it.each([
    ['[1,5]', [1, 5]],
    ['[5]', [5]],
    ['[]', []],
    ['[0,-3]', [0, -3]],
  ])('reads the ids of the stored list %s', (storedValue, expectedIds) => {
    expect([...parseLikedIds(storedValue)]).toEqual(expectedIds);
  });

  it('keeps each id once, in the order of its first like', () => {
    expect([...parseLikedIds('[5,1,5,1]')]).toEqual([5, 1]);
  });

  it('likes nothing on a first visit, when the key is not stored', () => {
    expect(parseLikedIds(null).size).toBe(0);
  });

  it.each(['', '  ', '[1,', 'not json', 'undefined', '{"1":true}', '1', '"[1]"', 'true', 'null'])(
    'likes nothing for the stored text %j, which is not a list',
    storedValue => {
      expect(parseLikedIds(storedValue).size).toBe(0);
    },
  );

  it('leaves out the entries that are not integers', () => {
    // 1e400 parses to Infinity
    const storedValue = '["1",1.5,null,true,{},[2],1e400,7]';

    expect([...parseLikedIds(storedValue)]).toEqual([7]);
  });
});

describe('setLike', () => {
  it('adds the like of a project to the others', () => {
    expect([...setLike({ likedIds: new Set([1]), id: 5, isLiked: true })]).toEqual([1, 5]);
  });

  it('removes the like of a project, and only that one', () => {
    expect([...setLike({ likedIds: new Set([1, 5]), id: 1, isLiked: false })]).toEqual([5]);
  });

  it.each([
    ['liking a liked project', { likedIds: new Set([1]), id: 1, isLiked: true }, [1]],
    ['unliking a project not liked', { likedIds: new Set([1]), id: 5, isLiked: false }, [1]],
    ['unliking without likes', { likedIds: new Set<number>(), id: 1, isLiked: false }, []],
  ])('changes nothing when %s', (_change, params, expectedIds) => {
    expect([...setLike(params)]).toEqual(expectedIds);
  });

  it('returns a new set, leaving the previous likes as they were', () => {
    const likedIds = new Set([1]);

    const nextLikedIds = setLike({ likedIds, id: 5, isLiked: true });

    expect(nextLikedIds).not.toBe(likedIds);
    expect([...likedIds]).toEqual([1]);
  });
});
