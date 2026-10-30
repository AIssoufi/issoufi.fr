import { useRef } from 'react';

import { usePrefersReducedMotion } from '../../../hooks/usePrefersReducedMotion/index.ts';
import { usePointerRef } from '../hooks/usePointerRef/index.ts';
import { useParticleField } from './hooks/useParticleField/index.ts';
import { Canvas } from './ParticleField.styled.ts';

/**
 * Full-screen background canvas of drifting dots, linked by lines when they are close to each
 * other or to the cursor, and pushed away by the mouse. The number of dots follows the window
 * area, and the canvas holds as many pixels as the screen shows, up to `MAX_PIXEL_RATIO` per
 * CSS pixel. Runs an animation-frame loop and mouse and resize listeners while mounted, and removes
 * them on unmount. With reduced motion, the dots stand still and ignore the mouse: it draws them
 * once, and again for each new size of the window. Stays empty without 2D canvas support.
 */
export const ParticleField = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointerRef = usePointerRef();
  const prefersReducedMotion = usePrefersReducedMotion();

  useParticleField({ canvasRef, pointerRef, prefersReducedMotion });

  return <Canvas ref={canvasRef} />;
};
