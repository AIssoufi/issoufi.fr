import { toImageDataUrl } from './images.mjs';

describe('toImageDataUrl', () => {
  const content = Buffer.from('image');

  it.each([
    ['public/home.webp', 'image/webp'],
    ['photo.jpg', 'image/jpeg'],
    ['photo.jpeg', 'image/jpeg'],
    ['photo.PNG', 'image/png'],
    ['photo.avif', 'image/avif'],
  ])('builds the data URL of %s', (fileName, mediaType) => {
    expect(toImageDataUrl({ content, fileName })).toBe(`data:${mediaType};base64,aW1hZ2U=`);
  });

  it('builds the data URL of an empty file', () => {
    expect(toImageDataUrl({ content: Buffer.alloc(0), fileName: 'empty.webp' })).toBe(
      'data:image/webp;base64,',
    );
  });

  it.each(['photo.gif', 'photo.svg', 'photo', 'webp', ''])(
    'refuses the unknown image type of %j',
    fileName => {
      expect(() => toImageDataUrl({ content, fileName })).toThrow(
        `Unknown image type: ${fileName}`,
      );
    },
  );
});
