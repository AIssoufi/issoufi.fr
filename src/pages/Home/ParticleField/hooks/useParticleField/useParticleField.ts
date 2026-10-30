import { type RefObject, useEffect } from 'react';

import { OFFSCREEN_POINTER } from '../../../constants.ts';
import type { Point } from '../../../types.ts';
import { isPointerOnScreen } from '../../../utils.ts';
import {
  CURSOR_LINK_DISTANCE_PX,
  CURSOR_LINK_MAX_OPACITY,
  CURSOR_LINK_MAX_WIDTH_PX,
  FULL_CIRCLE_RAD,
  LINK_DISTANCE_PX,
  LINK_MAX_OPACITY,
  LINK_MAX_WIDTH_PX,
  LINK_RGB,
  PARTICLE_COLOR,
} from '../../constants.ts';
import type { Particle } from '../../types.ts';
import { createParticles, getCanvasSize, getLinkStrength, stepParticle } from '../../utils.ts';

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

/** Parameters of {@link useParticleField}. */
interface UseParticleFieldParams {
  /** Ref to the canvas to draw on, which fills the window. */
  canvasRef: RefObject<HTMLCanvasElement | null>;
  /** Ref to the latest position of the pointer, read on every frame. */
  pointerRef: RefObject<Point>;
  /** Whether the dots stand still, drawn once for each size of the window. */
  prefersReducedMotion: boolean;
}

/**
 * Draws the particle field on a canvas: sizes the canvas to the window, up to `MAX_PIXEL_RATIO`
 * canvas pixels per CSS pixel, spreads the dots for that size, then moves and draws them on each
 * animation frame. A resize of the window sizes the canvas and spreads the dots again. With
 * reduced motion, it requests no frame: it draws the dots once for each size, ignoring the
 * pointer. Does nothing without a canvas or 2D canvas support. The resize listener and the pending
 * frame are removed on unmount.
 */
export function useParticleField({
  canvasRef,
  pointerRef,
  prefersReducedMotion,
}: UseParticleFieldParams): void {
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
  }, [canvasRef, pointerRef, prefersReducedMotion]);
}
