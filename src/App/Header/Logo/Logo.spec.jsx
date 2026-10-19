import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';

import { declaredStyle, serializeCssValue } from '../../../styleTestUtils.js';
import { theme } from '../../../theme/index.ts';
import { HOVER_POINTER_QUERY } from '../../../theme/constants.ts';
import { LOGO_OUTLINE } from './constants.ts';
import Logo from './Logo.tsx';

/**
 * Largest size of the outline of the logo, in bytes: every page holds it in its HTML, in place of
 * the 20 kB font file that its text loaded.
 */
const MAX_OUTLINE_BYTES = 1024;

/** Media query of a short screen, as on a phone held sideways. */
const SHORT_SCREEN_MEDIA_QUERY = `(max-height: ${theme.screenHeights.short})`;

/** Renders the logo in a router opened at a path. */
const renderAt = (path = '/') =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Logo />
    </MemoryRouter>,
  );

const getLink = () => screen.getByRole('link', { name: 'AI' });

// The drawing of the logo, which only its outline describes
const getOutline = () => getLink().querySelector('svg');

/** Reads the four numbers of the view box of the outline. */
const readViewBox = () => getOutline().getAttribute('viewBox').split(' ').map(Number);

describe('Logo', () => {
  it('renders a link to the home page, named after the initials, without any props', () => {
    renderAt();

    expect(getLink()).toHaveAttribute('href', '/');
  });

  it('links to the home page in the language of the URL', () => {
    renderAt('/en/projects');

    expect(getLink()).toHaveAttribute('href', '/en/');
  });

  it('draws the initials as the outline of their letters, hidden from screen readers', () => {
    renderAt();

    expect(getOutline()).toHaveAttribute('aria-hidden', 'true');
    expect(getOutline()).toHaveAttribute('viewBox', LOGO_OUTLINE.viewBox);
    expect(getOutline().querySelector('path')).toHaveAttribute('d', LOGO_OUTLINE.pathData);
  });

  it('weighs far less than the font that drew its text', () => {
    expect(LOGO_OUTLINE.pathData).toMatch(/^M[\d. LMQZ-]+Z$/);
    expect(new TextEncoder().encode(JSON.stringify(LOGO_OUTLINE)).length).toBeLessThan(
      MAX_OUTLINE_BYTES,
    );
  });

  describe('outline', () => {
    it('takes the size of the text it replaces, in ems of the font size', () => {
      renderAt();
      const outlineStyle = property => declaredStyle({ element: getOutline(), property });

      expect(outlineStyle('width')).toBe(`${LOGO_OUTLINE.widthEm}em`);
      expect(outlineStyle('height')).toBe(`${LOGO_OUTLINE.heightEm}em`);
    });

    it('keeps the proportions of its view box, so its letters fill it', () => {
      renderAt();
      const [, , width, height] = readViewBox();

      expect(width / height).toBeCloseTo(LOGO_OUTLINE.widthEm / LOGO_OUTLINE.heightEm, 4);
    });

    it('puts the baseline of its letters on the baseline of the line, as their text', () => {
      renderAt();
      const [, top, , height] = readViewBox();

      // The baseline is at y = 0 in the view box, its descent below it
      expect((top + height) / height).toBeCloseTo(
        LOGO_OUTLINE.descentEm / LOGO_OUTLINE.heightEm,
        4,
      );
      expect(declaredStyle({ element: getOutline(), property: 'vertical-align' })).toBe(
        serializeCssValue({ property: 'vertical-align', value: `-${LOGO_OUTLINE.descentEm}em` }),
      );
    });

    // Forced colors mode keeps the colors of an SVG, and GlobalStyle strokes every SVG
    it('fills its letters with the color of the link, without any stroke', () => {
      renderAt();

      expect(declaredStyle({ element: getOutline(), property: 'fill' })).toBe('currentcolor');
      expect(declaredStyle({ element: getOutline(), property: 'stroke' })).toBe('none');
      expect(getOutline().querySelector('path')).not.toHaveAttribute('fill');
      expect(getOutline().querySelector('path')).not.toHaveAttribute('stroke');
    });
  });

  it('gives the link a finger target around the box of the outline', () => {
    renderAt();
    const container = getLink().parentElement;
    const linkStyle = ({ property, pseudo = ' > a' }) =>
      declaredStyle({ element: container, property, pseudo });

    expect(linkStyle({ property: 'display' })).toBe('inline-block');
    expect(linkStyle({ property: 'position' })).toBe('relative');
    expect(linkStyle({ property: 'position', pseudo: ' > a::after' })).toBe('absolute');
  });

  // The other links take the accent from tablet up only (GlobalStyle)
  it('takes the accent under a pointer that hovers, at any width, without moving', () => {
    renderAt();
    const hoverStyle = property =>
      declaredStyle({
        element: getLink().parentElement,
        property,
        pseudo: ' > a:hover',
        media: HOVER_POINTER_QUERY,
      });

    expect(hoverStyle('color')).toBe(
      serializeCssValue({ property: 'color', value: theme.colors['accent-foreground'] }),
    );
    expect(hoverStyle('transform')).toBe('');
  });

  it('gets smaller on a short screen', () => {
    renderAt();
    const container = getLink().parentElement;

    expect(declaredStyle({ element: container, property: 'font-size' })).toBe(theme.fontSizes[34]);
    expect(
      declaredStyle({ element: container, property: 'font-size', media: SHORT_SCREEN_MEDIA_QUERY }),
    ).toBe(theme.fontSizes[28]);
  });
});
