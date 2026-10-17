import { useEffect, useRef } from 'react';

import { StrongWord } from '../Home.styled';

interface WordState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vrot: number;
  lastRepulsedAt: number;
}

const RETURN_DELAY = 900; // ms avant que le ressort se réactive
const CYCLE = 5; // durée du cycle d'animation en secondes

export const SplitWords = ({
  children,
  startIndex = 0,
}: {
  children: string;
  startIndex?: number;
}) => {
  const words = children.split(' ');
  const refs = useRef<(HTMLSpanElement | null)[]>([]);
  const states = useRef<WordState[]>(
    words.map(() => ({ x: 0, y: 0, vx: 0, vy: 0, rot: 0, vrot: 0, lastRepulsedAt: 0 })),
  );
  const mouse = useRef({ x: -9999, y: -9999 });

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouse.current = { x: e.clientX, y: e.clientY };
    };
    const onLeave = () => {
      mouse.current = { x: -9999, y: -9999 };
    };
    window.addEventListener('mousemove', onMove);
    document.addEventListener('mouseleave', onLeave);

    let raf: number;
    const RADIUS = 200;
    const SPRING = 0.055;
    const DAMP = 0.75;
    const RDAMP = 0.7;
    const FORCE = 28;

    const tick = () => {
      const now = performance.now();

      refs.current.forEach((el, i) => {
        if (!el) return;
        const s = states.current[i];
        const rect = el.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;

        // Mouse repulsion
        const dx = cx - mouse.current.x;
        const dy = cy - mouse.current.y;
        const dist = Math.hypot(dx, dy);
        if (dist < RADIUS && dist > 1) {
          const strength = Math.pow(1 - dist / RADIUS, 1.8) * FORCE;
          s.vx += (dx / dist) * strength;
          s.vy += (dy / dist) * strength;
          s.vrot += (Math.random() - 0.5) * strength * 0.25;
          s.lastRepulsedAt = now;
        }

        // Spring vers l'origine + remise à plat — activé seulement après le délai
        if (now - s.lastRepulsedAt > RETURN_DELAY) {
          s.vx += -s.x * SPRING;
          s.vy += -s.y * SPRING;
          s.vrot += -s.rot * SPRING;
        }

        s.vx *= DAMP;
        s.vy *= DAMP;
        s.vrot *= RDAMP;
        s.x += s.vx;
        s.y += s.vy;
        s.rot += s.vrot;

        const disp = Math.hypot(s.x, s.y);
        const glow = Math.min(disp * 0.5, 20);

        el.style.transform = `translate(${s.x}px, ${s.y}px) rotate(${s.rot}deg)`;
        el.style.textShadow =
          glow > 0.5
            ? `0 0 ${glow}px rgba(212, 160, 192, 0.85), 0 0 ${glow * 2}px rgba(139, 49, 104, 0.4)`
            : '';
      });
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  return (
    <>
      {words.map((word, i) => {
        const globalIndex = startIndex + i;
        return (
          <StrongWord
            key={i}
            ref={el => {
              refs.current[i] = el;
            }}
            $delay={`-${globalIndex % CYCLE}s`}
            $reverse={globalIndex % 2 === 1}
          >
            {word}
            {i < words.length - 1 ? '\u00A0' : ''}
          </StrongWord>
        );
      })}
    </>
  );
};
