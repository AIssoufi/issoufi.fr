import { useEffect, useRef } from 'react';

import { usePrefersReducedMotion } from '../../../hooks/usePrefersReducedMotion/index.ts';
import { OFFSCREEN_POINTER } from '../constants.ts';
import type { Point } from '../types.ts';
import { usePointerRef } from '../hooks/usePointerRef/index.ts';
import { isPointerOnScreen } from '../utils.ts';
import {
  CURSOR_LINK_DISTANCE_PX,
  CURSOR_LINK_MAX_OPACITY,
  CURSOR_LINK_MAX_WIDTH_PX,
  LINK_DISTANCE_PX,
  LINK_MAX_OPACITY,
  LINK_MAX_WIDTH_PX,
  LINK_RGB,
  PARTICLE_COLOR,
} from './constants.ts';
import { Canvas } from './ParticleField.styled.ts';
import type { Particle } from './types.ts';
import { createParticles, getCanvasSize, getLinkStrength, stepParticle } from './utils.ts';

const FULL_CIRCLE_RAD = Math.PI * 2;

/** Parameters of the `drawLink` helper used on each frame. */
interface DrawLinkParams {
  /** Start of the line. */
  from: Point;
  /** End of the line. */
  to: Point;
  /** Strength between 0 and 1, from {@link getLinkStrength}. */
  strength: number;
  /** Opacity of a full-strength link. */
  maxOpacity: number;
  /** Width of a full-strength link, in pixels. */
  maxWidth: number;
}

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

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    // No 2D canvas support (old browsers, test environments): keep the static background
    if (!canvas || !context) return;

    let particles: Particle[] = [];
    let frame = 0;
    // Size of the window, in CSS pixels: the dots move in it, whatever the canvas buffer holds
    let viewport = { width: 0, height: 0 };

    const drawLink = ({ from, to, strength, maxOpacity, maxWidth }: DrawLinkParams) => {
      context.beginPath();
      context.moveTo(from.x, from.y);
      context.lineTo(to.x, to.y);
      context.strokeStyle = `rgba(${LINK_RGB},${strength * maxOpacity})`;
      context.lineWidth = strength * maxWidth;
      context.stroke();
    };

    /** Draws the dots where they are, linked to each other and to the pointer when it is close. */
    const draw = (pointer: Point) => {
      context.clearRect(0, 0, viewport.width, viewport.height);

      // Index loops on purpose: this O(n²) pass runs on every frame and must not allocate
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const from = particles[i];
          const to = particles[j];
          const strength = getLinkStrength({ from, to, maxDistance: LINK_DISTANCE_PX });
          if (strength > 0) {
            drawLink({
              from,
              to,
              strength,
              maxOpacity: LINK_MAX_OPACITY,
              maxWidth: LINK_MAX_WIDTH_PX,
            });
          }
        }
      }

      if (isPointerOnScreen(pointer)) {
        particles.forEach(to => {
          const strength = getLinkStrength({
            from: pointer,
            to,
            maxDistance: CURSOR_LINK_DISTANCE_PX,
          });
          if (strength > 0) {
            drawLink({
              from: pointer,
              to,
              strength,
              maxOpacity: CURSOR_LINK_MAX_OPACITY,
              maxWidth: CURSOR_LINK_MAX_WIDTH_PX,
            });
          }
        });
      }

      particles.forEach(({ x, y, size }) => {
        context.beginPath();
        context.arc(x, y, size, 0, FULL_CIRCLE_RAD);
        context.fillStyle = PARTICLE_COLOR;
        context.fill();
      });
    };

    const tick = () => {
      const pointer = pointerRef.current;
      particles = particles.map(particle => stepParticle({ particle, pointer, ...viewport }));
      draw(pointer);

      frame = requestAnimationFrame(tick);
    };

    const resize = () => {
      viewport = { width: window.innerWidth, height: window.innerHeight };
      const { width, height, scale } = getCanvasSize({
        cssWidth: viewport.width,
        cssHeight: viewport.height,
        pixelRatio: window.devicePixelRatio,
      });
      canvas.width = width;
      canvas.height = height;
      // A canvas shows one of its pixels per CSS pixel unless given a CSS size
      canvas.style.width = `${viewport.width}px`;
      canvas.style.height = `${viewport.height}px`;
      // Sizing the canvas resets its context: each CSS pixel drawn covers `scale` canvas pixels
      context.setTransform(scale, 0, 0, scale, 0, 0);
      particles = createParticles(viewport);
      // Resizing clears the canvas, which the next frame fills again, unless the dots stand still
      if (prefersReducedMotion) draw(OFFSCREEN_POINTER);
    };

    window.addEventListener('resize', resize);
    resize();
    if (!prefersReducedMotion) tick();

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', resize);
    };
  }, [pointerRef, prefersReducedMotion]);

  return <Canvas ref={canvasRef} />;
};
