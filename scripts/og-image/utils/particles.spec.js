import { getLinkStrength } from '../../../src/pages/Home/ParticleField/utils';
import { hasUnresolvedValue } from './html.mjs';
import { findDotLinks, renderParticlesSvg } from './particles.mjs';

const near = { x: 0, y: 0, size: 1 };
const close = { x: 30, y: 40, size: 1.2 };
const far = { x: 500, y: 500, size: 0.5 };

describe('findDotLinks', () => {
  it('links the dots closer than the distance, with the strength of the home page', () => {
    expect(findDotLinks({ dots: [near, close, far], getLinkStrength, maxDistance: 100 })).toEqual([
      { from: near, to: close, strength: 0.5 },
    ]);
  });

  it('links each pair once, in drawing order', () => {
    const dots = [near, close, { x: 0, y: 10, size: 1 }];
    const links = findDotLinks({ dots, getLinkStrength, maxDistance: 100 });

    expect(links.map(({ from, to }) => [dots.indexOf(from), dots.indexOf(to)])).toEqual([
      [0, 1],
      [0, 2],
      [1, 2],
    ]);
  });

  it('passes the distance to the strength function', () => {
    const strength = vi.fn(() => 1);

    findDotLinks({ dots: [near, close], getLinkStrength: strength, maxDistance: 130 });

    expect(strength).toHaveBeenCalledWith({ from: near, to: close, maxDistance: 130 });
  });

  it('finds no link between dots at the exact distance', () => {
    expect(findDotLinks({ dots: [near, close], getLinkStrength, maxDistance: 50 })).toEqual([]);
  });

  it.each([[[]], [[near]]])('finds no link among %j', dots => {
    expect(findDotLinks({ dots, getLinkStrength, maxDistance: 100 })).toEqual([]);
  });

  it.each([undefined, null, 'dots', {}])('finds no link for the dots %j', dots => {
    expect(findDotLinks({ dots, getLinkStrength, maxDistance: 100 })).toEqual([]);
  });

  it.each([
    null,
    'dot',
    { x: 10, y: 10 },
    { x: NaN, y: 10, size: 1 },
    { x: 10, y: Infinity, size: 1 },
    { x: '10', y: 10, size: 1 },
    { x: 10, y: 10, size: 0 },
    { x: 10, y: 10, size: -1 },
  ])('skips the invalid dot %j', dot => {
    expect(findDotLinks({ dots: [near, dot], getLinkStrength, maxDistance: 1000 })).toEqual([]);
  });
});

describe('renderParticlesSvg', () => {
  const style = {
    dotColor: 'rgba(255, 255, 255, 0.65)',
    linkRgb: '139, 49, 104',
    linkMaxOpacity: 0.4,
    linkMaxWidth: 0.8,
  };

  it('draws an SVG of the given size', () => {
    expect(renderParticlesSvg({ width: 1200, height: 630, ...style })).toBe(
      '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630"></svg>',
    );
  });

  it('draws each dot as a circle of its radius', () => {
    const svg = renderParticlesSvg({ width: 100, height: 100, dots: [near, close], ...style });

    expect(svg).toContain('<circle cx="0" cy="0" r="1" fill="rgba(255, 255, 255, 0.65)"/>');
    expect(svg).toContain('<circle cx="30" cy="40" r="1.2" fill="rgba(255, 255, 255, 0.65)"/>');
  });

  it('draws the links under the dots, fading and thinning with their strength', () => {
    const svg = renderParticlesSvg({
      width: 100,
      height: 100,
      dots: [near, close],
      links: [{ from: near, to: close, strength: 0.5 }],
      ...style,
    });

    expect(svg).toContain(
      '<line x1="0" y1="0" x2="30" y2="40" stroke="rgba(139, 49, 104, 0.2)" stroke-width="0.4"/>',
    );
    expect(svg.indexOf('<line')).toBeLessThan(svg.indexOf('<circle'));
  });

  it('rounds the coordinates to a hundredth of a pixel', () => {
    const dot = { x: 12.3456, y: 0.004, size: 1.005 };

    expect(renderParticlesSvg({ width: 100, height: 100, dots: [dot], ...style })).toContain(
      '<circle cx="12.35" cy="0" r="1" ',
    );
  });

  it('skips the invalid dots and the links to them', () => {
    const invalid = { x: NaN, y: 0, size: 1 };
    const svg = renderParticlesSvg({
      width: 100,
      height: 100,
      dots: [near, invalid, null],
      links: [{ from: near, to: invalid, strength: 1 }, null, { from: near }],
      ...style,
    });

    expect(svg.match(/<circle/g)).toHaveLength(1);
    expect(svg).not.toContain('<line');
    expect(svg).not.toContain('NaN');
  });

  it('writes NaN for a missing setting, for the script to catch', () => {
    const svg = renderParticlesSvg({
      width: 100,
      height: 100,
      dots: [near, close],
      links: [{ from: near, to: close, strength: 0.5 }],
      ...style,
      linkMaxOpacity: undefined,
    });

    expect(hasUnresolvedValue(svg)).toBe(true);
  });

  it.each([undefined, null, 'dots', {}])('draws nothing for the dots and links %j', value => {
    const svg = renderParticlesSvg({ width: 10, height: 10, dots: value, links: value, ...style });

    expect(svg).not.toMatch(/<circle|<line/);
  });
});
