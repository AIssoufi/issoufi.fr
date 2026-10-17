import { render } from '@testing-library/react';

import { ParticleField } from './ParticleField';

const fakeContext = () => ({
  arc: vi.fn(),
  beginPath: vi.fn(),
  clearRect: vi.fn(),
  fill: vi.fn(),
  lineTo: vi.fn(),
  moveTo: vi.fn(),
  stroke: vi.fn(),
});

describe('ParticleField', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders a canvas and keeps it static without 2D canvas support', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    const { container, unmount } = render(<ParticleField />);

    expect(container.querySelector('canvas')).toBeInTheDocument();
    expect(() => unmount()).not.toThrow();
  });

  it('draws frames when 2D canvas is available', async () => {
    const context = fakeContext();
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(context);
    const { unmount } = render(<ParticleField />);

    await vi.waitFor(() => expect(context.clearRect).toHaveBeenCalled());
    unmount();
  });
});
