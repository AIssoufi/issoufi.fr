import { renderHook } from '@testing-library/react';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';

import { useToday } from './useToday.ts';

/** Current date of the visitor in these tests: 17 October 2026. */
const FAKE_NOW = new Date(2026, 9, 17);

/** First day of the month of the build, as the define of `vite.config.ts` writes it. */
const BUILD_MONTH_START = new Date(__BUILD_MONTH__.year, __BUILD_MONTH__.monthIndex, 1);

describe('useToday', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(FAKE_NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns the current date when the browser renders the app from scratch', () => {
    const { result } = renderHook(() => useToday());

    expect(result.current).toEqual(FAKE_NOW);
  });

  it('returns the first day of the month of the build in the page rendered at build time', () => {
    const dates: Date[] = [];
    const Probe = () => {
      dates.push(useToday());
      return null;
    };

    renderToString(createElement(Probe));

    expect(dates).toEqual([BUILD_MONTH_START]);
  });

  it('returns the month of the build while the browser hydrates the page, then now', () => {
    const dates: Date[] = [];
    const container = document.body.appendChild(document.createElement('div'));

    const { result } = renderHook(
      () => {
        const today = useToday();
        dates.push(today);
        return today;
      },
      { container, hydrate: true },
    );

    expect(dates[0]).toEqual(BUILD_MONTH_START);
    expect(result.current).toEqual(FAKE_NOW);
  });

  it('reads a valid month of the build, zero-based', () => {
    expect(Number.isInteger(__BUILD_MONTH__.year)).toBe(true);
    expect(__BUILD_MONTH__.monthIndex).toBeGreaterThanOrEqual(0);
    expect(__BUILD_MONTH__.monthIndex).toBeLessThanOrEqual(11);
    expect(BUILD_MONTH_START.getDate()).toBe(1);
  });
});
