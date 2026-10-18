import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';

import { declaredStyle } from '../../styleTestUtils';
import { ELLIPSIS, MAX_DISPLAYED_PATH_LENGTH_CHARS } from './constants';
import { NotFound } from './NotFound';

const renderAt = (path, props) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <NotFound {...props} />
    </MemoryRouter>,
  );

describe('NotFound', () => {
  it('says that the current page does not exist', () => {
    renderAt('/skills');

    expect(screen.getByText('404')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Page introuvable' })).toBeInTheDocument();
    expect(screen.getByText('La page /skills n’existe pas.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Retour à l’accueil' })).toHaveAttribute('href', '/');
  });

  it('names the path decoded, as the visitor reads it', () => {
    renderAt('/projets/2024/un%20lien%20partag%C3%A9%20tr%C3%A8s%20long');

    expect(
      screen.getByText('La page /projets/2024/un lien partagé très long n’existe pas.'),
    ).toBeInTheDocument();
  });

  it('names a path with a malformed escape as it is, without throwing', () => {
    renderAt('/projets/%E0%A4%A');

    expect(screen.getByText('La page /projets/%E0%A4%A n’existe pas.')).toBeInTheDocument();
  });

  it('leaves the invisible characters of the path encoded', () => {
    renderAt('/a%E2%80%AEtxt.exe%E2%80%8B');

    expect(
      screen.getByText('La page /a%E2%80%AEtxt.exe%E2%80%8B n’existe pas.'),
    ).toBeInTheDocument();
  });

  it(`cuts a path longer than ${MAX_DISPLAYED_PATH_LENGTH_CHARS} characters`, () => {
    renderAt(`/${'a'.repeat(MAX_DISPLAYED_PATH_LENGTH_CHARS * 2)}`);

    const shownPath = `/${'a'.repeat(MAX_DISPLAYED_PATH_LENGTH_CHARS - 2)}${ELLIPSIS}`;
    expect(screen.getByText(`La page ${shownPath} n’existe pas.`)).toBeInTheDocument();
  });

  it('wraps a path longer than the line at any character', () => {
    renderAt(`/${'a'.repeat(64)}`);

    const message = screen.getByText(/^La page \/a+ n’existe pas\.$/);
    expect(declaredStyle({ element: message, property: 'overflow-wrap' })).toBe('anywhere');
  });

  it('links back to the English home page from an English URL', () => {
    renderAt('/en/skills');

    expect(screen.getByRole('link', { name: 'Retour à l’accueil' })).toHaveAttribute(
      'href',
      '/en/',
    );
  });

  it('has a single main landmark and a single level 1 heading', () => {
    renderAt('/skills');

    expect(screen.getAllByRole('main')).toHaveLength(1);
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  });

  it('accepts a custom title and message', () => {
    renderAt('/projects/inconnu', {
      title: 'Projet introuvable',
      message: "Ce projet n'existe pas.",
    });

    expect(screen.getByRole('heading', { name: 'Projet introuvable' })).toBeInTheDocument();
    expect(screen.getByText("Ce projet n'existe pas.")).toBeInTheDocument();
  });
});
