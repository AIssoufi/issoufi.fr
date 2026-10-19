import { fireEvent, renderHook } from '@testing-library/react';

import { usePointerOnControlRef } from './usePointerOnControlRef';

/** Adds a link holding a word, a button and a plain paragraph to the document. */
const renderControls = () => {
  document.body.innerHTML =
    '<a href="/projects"><span>Voir mes projets</span></a><button type="button">Menu</button><p>Text</p>';
  return {
    link: document.querySelector('a') as Element,
    linkText: document.querySelector('a span') as Element,
    button: document.querySelector('button') as Element,
    paragraph: document.querySelector('p') as Element,
  };
};

describe('usePointerOnControlRef', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = '';
  });

  it('is false before the first move', () => {
    const { result } = renderHook(() => usePointerOnControlRef());

    expect(result.current.current).toBe(false);
  });

  it('is true while the mouse moves over a link, the text of a link or a button', () => {
    const { link, linkText, button } = renderControls();
    const { result } = renderHook(() => usePointerOnControlRef());

    [link, linkText, button].forEach(control => {
      fireEvent.pointerMove(control);
      expect(result.current.current).toBe(true);
    });
  });

  it('is false again once the mouse moves over anything else', () => {
    const { button, paragraph } = renderControls();
    const { result } = renderHook(() => usePointerOnControlRef());

    fireEvent.pointerMove(button);
    fireEvent.pointerMove(paragraph);
    expect(result.current.current).toBe(false);

    fireEvent.pointerMove(button);
    fireEvent.pointerMove(window);
    expect(result.current.current).toBe(false);
  });

  it('stays false under a finger, which hovers no control', () => {
    const { button } = renderControls();
    const { result } = renderHook(() => usePointerOnControlRef());

    fireEvent.pointerMove(button, { pointerType: 'touch' });
    // The mouse events that a browser sends after a tap
    fireEvent.mouseMove(button);

    expect(result.current.current).toBe(false);
  });

  it('is false once the mouse leaves the window from a control', () => {
    const { button } = renderControls();
    const { result } = renderHook(() => usePointerOnControlRef());

    fireEvent.pointerMove(button);
    fireEvent.mouseLeave(document);

    expect(result.current.current).toBe(false);
  });

  it('stops listening on unmount', () => {
    const { button } = renderControls();
    const removeFromWindow = vi.spyOn(window, 'removeEventListener');
    const removeFromDocument = vi.spyOn(document, 'removeEventListener');
    const { result, unmount } = renderHook(() => usePointerOnControlRef());

    unmount();
    fireEvent.pointerMove(button);

    expect(removeFromWindow).toHaveBeenCalledWith('pointermove', expect.any(Function));
    expect(removeFromDocument).toHaveBeenCalledWith('mouseleave', expect.any(Function));
    expect(result.current.current).toBe(false);
  });
});
