import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';

import { theme } from '../../theme';
import { REDUCED_MOTION_QUERY } from '../../theme/constants';
import { declaredStyle, serializeCssValue } from '../../styleTestUtils';
import { getPage } from '../../utils/pages';
import { readBackgroundImages } from '../testUtils';
import { Home } from './Home';

const renderHome = (path = '/') =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Home />
    </MemoryRouter>,
  );

describe('Home', () => {
  it('renders the job title and the subtitle', () => {
    renderHome();

    expect(screen.getByText('Développeur')).toBeInTheDocument();
    expect(screen.getByText('JavaScript')).toBeInTheDocument();
    expect(screen.getByText('Je vous aide à développer vos applications web')).toBeInTheDocument();
  });

  it('spells the second line of the title right, with UX and UI as animated words', () => {
    renderHome();

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'passionné par l’UX et l’UI Design',
    );
    expect(screen.getByText('UX')).toBeInTheDocument();
    expect(screen.getByText('UI')).toBeInTheDocument();
  });

  it('has a single main landmark and a single level 1 heading', () => {
    renderHome();

    expect(screen.getAllByRole('main')).toHaveLength(1);
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  });

  it('links to the projects and experiences pages', () => {
    renderHome();

    expect(screen.getByRole('link', { name: 'Voir mes projets' })).toHaveAttribute(
      'href',
      '/projects',
    );
    expect(screen.getByRole('link', { name: 'Expériences professionnelles' })).toHaveAttribute(
      'href',
      '/experiences',
    );
  });

  it('links to the English pages on the English home page', () => {
    renderHome('/en/');
    const [projectsLink, experiencesLink] = screen.getAllByRole('link');

    expect(projectsLink).toHaveAttribute('href', '/en/projects');
    expect(experiencesLink).toHaveAttribute('href', '/en/experiences');
  });

  it('fits the buttons to narrow screens instead of widening the page', () => {
    // jsdom applies no media query, so these are the mobile styles
    renderHome();
    const links = screen.getAllByRole('link');

    expect(links).toHaveLength(2);
    links.forEach(link => {
      const style = getComputedStyle(link);
      expect(style.width).not.toBe('max-content');
      expect(style.minWidth).not.toBe('240px');
      expect(style.flexGrow).toBe('1');
      expect(style.padding).toBe('13px 20px');
      expect(style.textAlign).toBe('center');
    });
  });

  it('inverts the colors of the secondary button under the pointer, not those of the main one', () => {
    renderHome();
    const hoverStyle = ({ name, property }) =>
      declaredStyle({ element: screen.getByRole('link', { name }), property, pseudo: ':hover' });
    const secondaryHoverStyle = property =>
      hoverStyle({ name: 'Expériences professionnelles', property });
    const color = name => serializeCssValue({ property: 'color', value: theme.colors[name] });

    expect(secondaryHoverStyle('background-color')).toBe(color('foreground'));
    expect(secondaryHoverStyle('color')).toBe(color('background'));
    expect(secondaryHoverStyle('border-color')).toBe(color('foreground'));
    expect(hoverStyle({ name: 'Voir mes projets', property: 'background-color' })).toBe('');
    expect(hoverStyle({ name: 'Voir mes projets', property: 'color' })).toBe(color('foreground'));
  });

  it('hides the cursor glow with reduced motion, and nothing else, since it follows no pointer', () => {
    const { container } = renderHome();

    const hiddenWithReducedMotion = [...container.querySelectorAll('*')].filter(
      element =>
        declaredStyle({ element, property: 'display', media: REDUCED_MOTION_QUERY }) === 'none',
    );

    expect(hiddenWithReducedMotion).toHaveLength(1);
    const glowStyle = getComputedStyle(hiddenWithReducedMotion[0]);
    expect(glowStyle.position).toBe('fixed');
    expect(glowStyle.pointerEvents).toBe('none');
    expect(glowStyle.display).not.toBe('none');
  });

  it('shows the background photo of its entry in PAGES, which its HTML files preload', () => {
    const { url, portraitUrl } = getPage('/').backgroundPhoto;
    renderHome();

    expect(readBackgroundImages(screen.getByRole('main'))).toEqual({
      image: `url("${url}")`,
      portraitImage: `url("${portraitUrl}")`,
    });
  });
});
