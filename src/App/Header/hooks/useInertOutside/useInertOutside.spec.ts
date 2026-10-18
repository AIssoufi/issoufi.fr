import { renderHook, waitFor } from '@testing-library/react';

import { useInertOutside } from './useInertOutside';

/**
 * Builds a header holding a menu, between a logo and a page, and returns its elements by id:
 *
 * ```html
 * <a id="logo"></a>
 * <header id="header">
 *   <button id="lang"></button>
 *   <div id="menu"><a id="link"></a></div>
 * </header>
 * <main id="page"></main>
 * ```
 */
const buildPage = () => {
  document.body.innerHTML = `
    <a id="logo"></a>
    <header id="header">
      <button id="lang"></button>
      <div id="menu"><a id="link"></a></div>
    </header>
    <main id="page"></main>
  `;
  const byId = (id: string) => document.getElementById(id)!;

  return {
    logo: byId('logo'),
    header: byId('header'),
    lang: byId('lang'),
    menu: byId('menu'),
    link: byId('link'),
    page: byId('page'),
  };
};

/** Renders the hook with the menu of {@link buildPage} as its container. */
const renderOnMenu = ({ menu, isActive }: { menu: HTMLElement; isActive?: boolean }) =>
  renderHook(props => useInertOutside(props), {
    initialProps: { containerRef: { current: menu }, isActive },
  });

describe('useInertOutside', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('makes every element around the container inert', () => {
    const { logo, lang, menu, page } = buildPage();

    renderOnMenu({ menu });

    expect(logo).toHaveAttribute('inert');
    expect(lang).toHaveAttribute('inert');
    expect(page).toHaveAttribute('inert');
  });

  it('leaves the container, what it holds and its ancestors reachable', () => {
    const { header, menu, link } = buildPage();

    renderOnMenu({ menu });

    expect(menu).not.toHaveAttribute('inert');
    expect(link).not.toHaveAttribute('inert');
    expect(header).not.toHaveAttribute('inert');
    expect(document.body).not.toHaveAttribute('inert');
  });

  it('makes nothing inert while inactive', () => {
    const { logo, lang, page, menu } = buildPage();

    renderOnMenu({ menu, isActive: false });

    expect(logo).not.toHaveAttribute('inert');
    expect(lang).not.toHaveAttribute('inert');
    expect(page).not.toHaveAttribute('inert');
  });

  it('makes the page inert once active, and reachable again once inactive', () => {
    const { logo, page, menu } = buildPage();
    const { rerender } = renderOnMenu({ menu, isActive: false });

    rerender({ containerRef: { current: menu }, isActive: true });
    expect(logo).toHaveAttribute('inert');
    expect(page).toHaveAttribute('inert');

    rerender({ containerRef: { current: menu }, isActive: false });
    expect(logo).not.toHaveAttribute('inert');
    expect(page).not.toHaveAttribute('inert');
  });

  it('makes the page reachable again on unmount', () => {
    const { logo, lang, page, menu } = buildPage();
    const { unmount } = renderOnMenu({ menu });

    unmount();

    expect(logo).not.toHaveAttribute('inert');
    expect(lang).not.toHaveAttribute('inert');
    expect(page).not.toHaveAttribute('inert');
  });

  it('keeps an element that was already inert inert afterwards', () => {
    const { logo, page, menu } = buildPage();
    page.setAttribute('inert', '');
    const { unmount } = renderOnMenu({ menu });

    unmount();

    expect(page).toHaveAttribute('inert');
    expect(logo).not.toHaveAttribute('inert');
  });

  it('makes an element added around the container meanwhile inert', async () => {
    const { header, menu } = buildPage();
    renderOnMenu({ menu });

    const loadedPage = document.createElement('section');
    document.body.append(loadedPage);
    const banner = document.createElement('p');
    header.append(banner);

    await waitFor(() => expect(loadedPage).toHaveAttribute('inert'));
    await waitFor(() => expect(banner).toHaveAttribute('inert'));
  });

  it('leaves what is added inside the container reachable', async () => {
    const { page, menu } = buildPage();
    renderOnMenu({ menu });

    const newLink = document.createElement('a');
    menu.append(newLink);
    // Wait for any mutation callback to run, then check that the new link was left alone
    const lateElement = document.createElement('p');
    document.body.append(lateElement);
    await waitFor(() => expect(lateElement).toHaveAttribute('inert'));

    expect(newLink).not.toHaveAttribute('inert');
    expect(page).toHaveAttribute('inert');
  });

  it('stops watching the page once unmounted', async () => {
    const disconnect = vi.spyOn(MutationObserver.prototype, 'disconnect');
    const { menu } = buildPage();
    const { unmount } = renderOnMenu({ menu });

    unmount();
    const lateElement = document.createElement('section');
    document.body.append(lateElement);
    await Promise.resolve();

    expect(disconnect).toHaveBeenCalledTimes(1);
    expect(lateElement).not.toHaveAttribute('inert');
  });

  it('makes nothing inert while the container is not mounted', () => {
    const { logo, page } = buildPage();

    renderHook(() => useInertOutside({ containerRef: { current: null } }));

    expect(logo).not.toHaveAttribute('inert');
    expect(page).not.toHaveAttribute('inert');
  });

  it('makes nothing inert for a container detached from the page', () => {
    const { logo, page } = buildPage();
    const detached = document.createElement('div');

    renderHook(() => useInertOutside({ containerRef: { current: detached } }));

    expect(logo).not.toHaveAttribute('inert');
    expect(page).not.toHaveAttribute('inert');
  });
});
