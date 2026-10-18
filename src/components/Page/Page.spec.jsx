import { render, screen } from '@testing-library/react';
import styled from '@xstyled/styled-components';

import { declaredStyle } from '../../styleTestUtils';
import { theme } from '../../theme';
import { PORTRAIT_PHOTO_MEDIA_QUERY } from '../../utils/pages';
import Page from './Page';

/** Media query of the desktop layout, from the tablet breakpoint. */
const TABLET_MEDIA = `(min-width: ${theme.screens.tablet})`;

const getMain = () => screen.getByRole('main');

/** A background photo in its two versions, with its placeholder. */
const PHOTO = {
  url: '/projects.webp',
  portraitUrl: '/projects-portrait.webp',
  placeholderUrl: 'data:image/webp;base64,UklGRg==',
};

/**
 * Reads the `background-image` declared for the main element's `::before` layer, outside any media
 * query or inside the given one, since jsdom computes no style for pseudo-elements.
 */
const getBackgroundImage = (main, media = '') =>
  declaredStyle({ element: main, property: 'background-image', pseudo: '::before', media });

/** Reads the `background-image` that narrow portrait screens show behind the main element. */
const getPortraitBackgroundImage = main => getBackgroundImage(main, PORTRAIT_PHOTO_MEDIA_QUERY);

describe('Page', () => {
  it('renders its content in the main landmark of the page', () => {
    render(
      <Page>
        <h1>Projets</h1>
      </Page>,
    );

    expect(getMain()).toContainElement(screen.getByRole('heading', { name: 'Projets' }));
  });

  it('shows the whole photo behind the page, over its placeholder', () => {
    render(<Page backgroundPhoto={PHOTO} />);
    expect(getBackgroundImage(getMain())).toBe(
      `url("/projects.webp"), url("${PHOTO.placeholderUrl}")`,
    );
  });

  it('shows the portrait version of the photo on narrow portrait screens, over its placeholder', () => {
    render(<Page backgroundPhoto={PHOTO} />);
    expect(getPortraitBackgroundImage(getMain())).toBe(
      `url("/projects-portrait.webp"), url("${PHOTO.placeholderUrl}")`,
    );
  });

  it.each([
    ['no portrait version', { url: '/projects.webp' }, 'url("/projects.webp")'],
    [
      'no whole photo',
      { portraitUrl: '/projects-portrait.webp' },
      'url("/projects-portrait.webp")',
    ],
  ])('shows the same version on every screen when the photo has %s', (_, photo, image) => {
    render(<Page backgroundPhoto={photo} />);

    expect(getBackgroundImage(getMain())).toBe(image);
    expect(getPortraitBackgroundImage(getMain())).toBe(image);
  });

  it.each([undefined, null, {}, { url: '', portraitUrl: '  ' }, '/projects.webp'])(
    'draws no background image when the photo is %j',
    backgroundPhoto => {
      render(<Page backgroundPhoto={backgroundPhoto} />);

      expect(getBackgroundImage(getMain())).toBe('none');
      expect(getPortraitBackgroundImage(getMain())).toBe('none');
    },
  );

  it('leaves room on the right for the controls floating on the right edge from tablet up', () => {
    render(<Page />);

    expect(declaredStyle({ element: getMain(), property: 'padding-right' })).toBe(theme.space.page);
    expect(
      declaredStyle({ element: getMain(), property: 'padding-right', media: TABLET_MEDIA }),
    ).toBe(theme.space['floating-controls-room']);
  });

  it('keeps the class name it receives', () => {
    render(<Page className="custom-page" />);
    expect(getMain()).toHaveClass('custom-page');
  });

  it('can be extended with styled()', () => {
    const CenteredPage = styled(Page)`
      display: flex;
    `;
    render(<CenteredPage backgroundPhoto={{ url: '/experiences.webp' }} />);
    const main = getMain();

    expect(getComputedStyle(main).display).toBe('flex');
    expect(getBackgroundImage(main)).toBe('url("/experiences.webp")');
  });

  it('renders without any props', () => {
    render(<Page />);
    expect(getMain()).toBeEmptyDOMElement();
  });
});
