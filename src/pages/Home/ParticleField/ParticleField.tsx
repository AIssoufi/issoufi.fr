import { useEffect, useRef } from 'react';

import { Canvas } from './ParticleField.styled';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
}

const AREA = 11000;
const LINK_DIST = 130;
const REPEL_DIST = 160;
const REPEL_STRENGTH = 0.32;
const FRICTION = 0.96;

export const ParticleField = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouse = useRef({ x: -9999, y: -9999 });
  const raf = useRef<number>(0);
  const particles = useRef<Particle[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    // No 2D canvas support (old browsers, test environments): keep the static background
    if (!canvas || !ctx) return;

    const init = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      const n = Math.round((canvas.width * canvas.height) / AREA);
      particles.current = Array.from({ length: n }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.55,
        vy: (Math.random() - 0.5) * 0.55,
        size: Math.random() * 1.4 + 0.4,
      }));
    };

    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const { x: mx, y: my } = mouse.current;
      const pts = particles.current;
      const W = canvas.width;
      const H = canvas.height;

      // Update physics
      for (const p of pts) {
        const dx = p.x - mx;
        const dy = p.y - my;
        const d2 = dx * dx + dy * dy;
        if (d2 < REPEL_DIST * REPEL_DIST && d2 > 0) {
          const d = Math.sqrt(d2);
          const f = ((REPEL_DIST - d) / REPEL_DIST) * REPEL_STRENGTH;
          p.vx += (dx / d) * f;
          p.vy += (dy / d) * f;
        }
        p.vx *= FRICTION;
        p.vy *= FRICTION;
        p.x = (((p.x + p.vx) % W) + W) % W;
        p.y = (((p.y + p.vy) % H) + H) % H;
      }

      // Particle–particle links
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x;
          const dy = pts[i].y - pts[j].y;
          const d2 = dx * dx + dy * dy;
          if (d2 < LINK_DIST * LINK_DIST) {
            const t = 1 - Math.sqrt(d2) / LINK_DIST;
            ctx.beginPath();
            ctx.moveTo(pts[i].x, pts[i].y);
            ctx.lineTo(pts[j].x, pts[j].y);
            ctx.strokeStyle = `rgba(139,49,104,${t * 0.4})`;
            ctx.lineWidth = t * 0.8;
            ctx.stroke();
          }
        }
      }

      // Cursor–particle links
      if (mx > -999) {
        const CUR = REPEL_DIST * 1.4;
        for (const p of pts) {
          const dx = p.x - mx;
          const dy = p.y - my;
          const d2 = dx * dx + dy * dy;
          if (d2 < CUR * CUR) {
            const t = 1 - Math.sqrt(d2) / CUR;
            ctx.beginPath();
            ctx.moveTo(mx, my);
            ctx.lineTo(p.x, p.y);
            ctx.strokeStyle = `rgba(139,49,104,${t * 0.85})`;
            ctx.lineWidth = t * 1.5;
            ctx.stroke();
          }
        }
      }

      // Particles
      for (const p of pts) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,0.65)`;
        ctx.fill();
      }

      raf.current = requestAnimationFrame(tick);
    };

    const onMove = (e: MouseEvent) => {
      mouse.current = { x: e.clientX, y: e.clientY };
    };
    const onLeave = () => {
      mouse.current = { x: -9999, y: -9999 };
    };

    window.addEventListener('mousemove', onMove);
    document.addEventListener('mouseleave', onLeave);
    window.addEventListener('resize', init);

    init();
    tick();

    return () => {
      cancelAnimationFrame(raf.current);
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseleave', onLeave);
      window.removeEventListener('resize', init);
    };
  }, []);

  return <Canvas ref={canvasRef} />;
};
