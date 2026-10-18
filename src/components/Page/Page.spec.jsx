import { render, screen } from '@testing-library/react';
import styled from '@xstyled/styled-components';

import { declaredStyle } from '../../styleTestUtils';
import { theme } from '../../theme';
import Page from './Page';

/** Media query of the desktop layout, from the tablet breakpoint. */
const TABLET_MEDIA = `(min-width: ${theme.screens.tablet})`;

const getMain = () => screen.getByRole('main');

/**
 * Reads the `background-image` declared for the main element's `::before` layer, since jsdom
 * computes no style for pseudo-elements.
 */
const getBackgroundImage = main =>
  declaredStyle({ element: main, property: 'background-image', pseudo: '::before' });

describe('Page', () => {
  it('renders its content in the main landmark of the page', () => {
    render(
      <Page>
        <h1>Projets</h1>
      </Page>,
    );

    expect(getMain()).toContainElement(screen.getByRole('heading', { name: 'Projets' }));
  });

  it('shows the background image behind the page', () => {
    render(<Page backgroundImage="/projects.webp" />);
    expect(getBackgroundImage(getMain())).toBe('url("/projects.webp")');
  });

  it.each([undefined, ''])('draws no background image when it is %j', backgroundImage => {
    render(<Page backgroundImage={backgroundImage} />);
    expect(getBackgroundImage(getMain())).toBe('none');
  });

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
    render(<CenteredPage backgroundImage="/experiences.webp" />);
    const main = getMain();

    expect(getComputedStyle(main).display).toBe('flex');
    expect(getBackgroundImage(main)).toBe('url("/experiences.webp")');
  });

  it('renders without any props', () => {
    render(<Page />);
    expect(getMain()).toBeEmptyDOMElement();
  });
});
