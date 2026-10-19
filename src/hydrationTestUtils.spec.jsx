import { screen } from '@testing-library/react';
import styled from '@xstyled/styled-components';

import { useIsHydrated } from './hooks/useIsHydrated/index.ts';
import { renderHydrated } from './hydrationTestUtils.tsx';

const Box = styled.p`
  padding: 2;
  color: accent-foreground;
`;

describe('renderHydrated', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('hydrates the HTML, whose first render is the one of the build', () => {
    const values = [];
    const Recorder = () => {
      const isHydrated = useIsHydrated();
      values.push(isHydrated);
      return <Box>{isHydrated ? 'hydrated' : 'rendered at build time'}</Box>;
    };

    renderHydrated(<Recorder />);

    // The HTML, then the hydration, then the render after it
    expect(values.slice(0, 2)).toEqual([false, false]);
    expect(values[values.length - 1]).toBe(true);
    expect(screen.getByText('hydrated')).toBeInTheDocument();
  });

  it('renders the HTML in the theme, so that the classes of the styles match', () => {
    const consoleError = vi.spyOn(console, 'error');

    renderHydrated(<Box>text</Box>);

    expect(consoleError).not.toHaveBeenCalled();
    expect(screen.getByText('text').parentElement?.parentElement).toBe(document.body);
  });

  it('lets React report an attribute that differs from the HTML', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    let renderCount = 0;
    const Mismatch = () => {
      renderCount += 1;
      return <p title={renderCount === 1 ? 'build' : 'browser'}>text</p>;
    };

    renderHydrated(<Mismatch />);

    expect(consoleError.mock.calls.flat().join(' ')).toContain(
      "didn't match the client properties",
    );
  });
});
