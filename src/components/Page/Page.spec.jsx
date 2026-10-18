import { render, screen } from '@testing-library/react';
import styled from '@xstyled/styled-components';

import Page from './Page';

const getSection = container => container.querySelector('section');

/**
 * Reads the `background-image` of a section's `::before` layer in the injected style sheets,
 * since jsdom computes no style for pseudo-elements.
 */
const getBackgroundImage = section => {
  const css = [...document.querySelectorAll('style')].map(style => style.textContent).join('');
  const classNames = [...section.classList];
  const beforeRule = css
    .split('}')
    .find(rule => classNames.some(className => rule.includes(`.${className}::before`)));

  return beforeRule?.match(/background-image:([^;]+)/)?.[1];
};

describe('Page', () => {
  it('renders its content in a section', () => {
    const { container } = render(
      <Page>
        <h1>Projets</h1>
      </Page>,
    );

    expect(getSection(container)).toContainElement(
      screen.getByRole('heading', { name: 'Projets' }),
    );
  });

  it('shows the background image behind the page', () => {
    const { container } = render(<Page backgroundImage="/projects.webp" />);
    expect(getBackgroundImage(getSection(container))).toBe('url(/projects.webp)');
  });

  it.each([undefined, ''])('draws no background image when it is %j', backgroundImage => {
    const { container } = render(<Page backgroundImage={backgroundImage} />);
    expect(getBackgroundImage(getSection(container))).toBe('none');
  });

  it('keeps the class name it receives', () => {
    const { container } = render(<Page className="custom-page" />);
    expect(getSection(container)).toHaveClass('custom-page');
  });

  it('can be extended with styled()', () => {
    const CenteredPage = styled(Page)`
      display: flex;
    `;
    const { container } = render(<CenteredPage backgroundImage="/experiences.webp" />);
    const section = getSection(container);

    expect(getComputedStyle(section).display).toBe('flex');
    expect(getBackgroundImage(section)).toBe('url(/experiences.webp)');
  });

  it('renders without any props', () => {
    const { container } = render(<Page />);
    expect(getSection(container)).toBeEmptyDOMElement();
  });
});
