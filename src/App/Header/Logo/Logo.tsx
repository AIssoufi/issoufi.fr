import LocalizedLink from '../../../components/LocalizedLink/index.ts';
import VisuallyHidden from '../../../components/VisuallyHidden/index.ts';
import { LOGO_OUTLINE, LOGO_TEXT } from './constants.ts';

import { Container, Outline } from './Logo.styled.ts';

/**
 * Logo of the header, the initials "AI" in the display font of the theme, which links to the home
 * page in the language of the URL. It draws them as their outline, an inline SVG that
 * `pnpm icons` writes from the font ({@link LOGO_OUTLINE}), so that no page loads the font for
 * two letters: the SVG takes the place and the size of their text, on its baseline, at any font
 * size, and fills them with the color of the link, which the hover and forced colors mode change
 * as they would change the text. Screen readers read the initials, hidden from the screen, rather
 * than the drawing. It takes the accent under a pointer that hovers, at any width, and gets
 * smaller on a short screen. Must be rendered inside a router.
 */
const Logo = () => (
  <Container>
    <LocalizedLink to="/">
      <Outline
        viewBox={LOGO_OUTLINE.viewBox}
        aria-hidden
      >
        <path d={LOGO_OUTLINE.pathData} />
      </Outline>
      <VisuallyHidden>{LOGO_TEXT}</VisuallyHidden>
    </LocalizedLink>
  </Container>
);

export default Logo;
