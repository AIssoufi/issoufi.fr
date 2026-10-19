import { renderHook } from '@testing-library/react';

import { useScrollLock } from './useScrollLock.ts';

/** Inline overflow of the root element, which the hook sets. */
const getRootOverflow = () => document.documentElement.style.overflow;

describe('useScrollLock', () => {
  afterEach(() => {
    document.documentElement.style.overflow = '';
  });

  it('hides the overflow of the root element, so the page no longer scrolls', () => {
    renderHook(() => useScrollLock({ isActive: true }));

    expect(getRootOverflow()).toBe('hidden');
  });

  it('locks the page when called without parameters', () => {
    renderHook(() => useScrollLock());

    expect(getRootOverflow()).toBe('hidden');
  });

  it('locks nothing while inactive', () => {
    renderHook(() => useScrollLock({ isActive: false }));

    expect(getRootOverflow()).toBe('');
  });

  it('locks the page once active, and lets it scroll again once inactive', () => {
    const { rerender } = renderHook(props => useScrollLock(props), {
      initialProps: { isActive: false },
    });

    rerender({ isActive: true });
    expect(getRootOverflow()).toBe('hidden');

    rerender({ isActive: false });
    expect(getRootOverflow()).toBe('');
  });

  it('lets the page scroll again on unmount', () => {
    const { unmount } = renderHook(() => useScrollLock({ isActive: true }));

    unmount();

    expect(getRootOverflow()).toBe('');
  });

  it('gives the root element back the overflow it had before', () => {
    document.documentElement.style.overflow = 'clip';
    const { unmount } = renderHook(() => useScrollLock({ isActive: true }));
    expect(getRootOverflow()).toBe('hidden');

    unmount();

    expect(getRootOverflow()).toBe('clip');
  });

  it('keeps the page locked while another lock is still active', () => {
    const menu = renderHook(() => useScrollLock({ isActive: true }));
    const dialog = renderHook(() => useScrollLock({ isActive: true }));

    dialog.unmount();
    expect(getRootOverflow()).toBe('hidden');

    menu.unmount();
    expect(getRootOverflow()).toBe('');
  });

  it('lets the page scroll again once every lock is released, whatever their order', () => {
    document.documentElement.style.overflow = 'clip';
    const menu = renderHook(() => useScrollLock({ isActive: true }));
    const dialog = renderHook(() => useScrollLock({ isActive: true }));

    menu.unmount();
    expect(getRootOverflow()).toBe('hidden');

    dialog.unmount();
    expect(getRootOverflow()).toBe('clip');
  });

  it('locks the page again after every lock was released', () => {
    const first = renderHook(() => useScrollLock({ isActive: true }));
    first.unmount();

    const second = renderHook(() => useScrollLock({ isActive: true }));
    expect(getRootOverflow()).toBe('hidden');

    second.unmount();
    expect(getRootOverflow()).toBe('');
  });
});
