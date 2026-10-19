import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router';
import styled from '@xstyled/styled-components';

import LocalizedLink from './LocalizedLink.tsx';

/** Renders a link in a router opened at a path. */
const renderAt = ({ path = '/', link }) =>
  render(<MemoryRouter initialEntries={[path]}>{link}</MemoryRouter>);

const getLink = () => screen.getByRole('link');

describe('LocalizedLink', () => {
  it('renders a link to the home page without any props', () => {
    renderAt({ link: <LocalizedLink /> });

    expect(getLink()).toHaveAttribute('href', '/');
  });

  it.each([
    ['/projects', '/', '/projects'],
    ['/projects', '/experiences', '/projects'],
    ['/', '/projects', '/'],
  ])('leads to %s from the French page %s', (to, path, href) => {
    renderAt({ path, link: <LocalizedLink to={to}>Lien</LocalizedLink> });

    expect(getLink()).toHaveAttribute('href', href);
  });

  it.each([
    ['/projects', '/en/', '/en/projects'],
    ['/experiences', '/en/projects', '/en/experiences'],
    ['/', '/en/projects', '/en/'],
    ['/', '/en/page-inconnue', '/en/'],
  ])('leads %s to its English page from the English page %s', (to, path, href) => {
    renderAt({ path, link: <LocalizedLink to={to}>Link</LocalizedLink> });

    expect(getLink()).toHaveAttribute('href', href);
  });

  it('moves a path with a language prefix to the language of the page', () => {
    renderAt({ path: '/projects', link: <LocalizedLink to="/en/experiences">Lien</LocalizedLink> });

    expect(getLink()).toHaveAttribute('href', '/experiences');
  });

  it('passes the other props and the ref to the link', () => {
    const ref = createRef();
    renderAt({
      link: (
        <LocalizedLink
          ref={ref}
          to="/projects"
          className="cta"
          aria-current="page"
        >
          Projets
        </LocalizedLink>
      ),
    });

    expect(getLink()).toHaveClass('cta');
    expect(getLink()).toHaveAttribute('aria-current', 'page');
    expect(ref.current).toBe(getLink());
  });

  it('keeps the styles of a styled link', () => {
    const StyledLink = styled(LocalizedLink)`
      text-decoration: none;
    `;
    renderAt({ path: '/en/', link: <StyledLink to="/projects">Projects</StyledLink> });

    expect(getComputedStyle(getLink()).textDecoration).toBe('none');
    expect(getLink()).toHaveAttribute('href', '/en/projects');
  });

  it('navigates to the page in the language of the URL', async () => {
    const LocationDisplay = () => <output>{useLocation().pathname}</output>;
    renderAt({
      path: '/en/',
      link: (
        <>
          <LocalizedLink to="/experiences">Experience</LocalizedLink>
          <LocationDisplay />
        </>
      ),
    });

    await userEvent.click(getLink());

    expect(screen.getByRole('status')).toHaveTextContent('/en/experiences');
  });
});
