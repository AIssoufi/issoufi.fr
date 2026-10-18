import { render, screen } from '@testing-library/react';
import styled from '@xstyled/styled-components';

import Page from './Page';

const getMain = () => screen.getByRole('main');

/**
 * Reads the `background-image` of the main element's `::before` layer in the injected style sheets,
 * since jsdom computes no style for pseudo-elements. Splitting the CSS on `}` only finds a flat
 * rule: update it if `Page.styled.ts` ever wraps `::before` in an `@media` block.
 */
const getBackgroundImage = main => {
  const css = [...document.querySelectorAll('style')].map(style => style.textContent).join('');
  const classNames = [...main.classList];
  const beforeRule = css
    .split('}')
    .find(rule => classNames.some(className => rule.includes(`.${className}::before`)));

  return beforeRule?.match(/background-image:([^;]+)/)?.[1];
};

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
    expect(getBackgroundImage(getMain())).toBe('url(/projects.webp)');
  });

  it.each([undefined, ''])('draws no background image when it is %j', backgroundImage => {
    render(<Page backgroundImage={backgroundImage} />);
    expect(getBackgroundImage(getMain())).toBe('none');
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
    expect(getBackgroundImage(main)).toBe('url(/experiences.webp)');
  });

  it('renders without any props', () => {
    render(<Page />);
    expect(getMain()).toBeEmptyDOMElement();
  });
});
