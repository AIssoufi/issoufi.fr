import { render, screen } from '@testing-library/react';
import styled from '@xstyled/styled-components';

import { declaredStyle } from '../../styleTestUtils';
import { theme } from '../../theme';
import Page from './Page';

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

  it('keeps room under its content, so that its end scrolls above the site footer', () => {
    render(<Page />);
    expect(getComputedStyle(getMain()).paddingBottom).toBe(theme.space['site-footer-clearance']);
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
