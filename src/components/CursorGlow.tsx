import { useEffect, useRef } from 'react';

interface TrailPoint {
  x: number;
  y: number;
  age: number;
}

interface SparkParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  hue: number;
  size: number;
}

export default function CursorGlow() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const trailRef = useRef<TrailPoint[]>([]);
  const sparksRef = useRef<SparkParticle[]>([]);
  const mouseRef = useRef({ x: -100, y: -100, vx: 0, vy: 0, px: -100, py: -100 });
  const frameRef = useRef(0);
  const clickRef = useRef(0);

  useEffect(() => {
    const isMobile = window.matchMedia('(pointer: coarse)').matches;
    if (isMobile) return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.scale(dpr, dpr);
    };

    const handleMouseMove = (e: MouseEvent) => {
      const m = mouseRef.current;
      m.vx = e.clientX - m.x;
      m.vy = e.clientY - m.y;
      m.px = m.x;
      m.py = m.y;
      m.x = e.clientX;
      m.y = e.clientY;

      const speed = Math.sqrt(m.vx * m.vx + m.vy * m.vy);
      if (speed > 3) {
        const sparkCount = Math.min(Math.floor(speed / 4), 4);
        for (let i = 0; i < sparkCount; i++) {
          sparksRef.current.push({
            x: m.x + (Math.random() - 0.5) * 8,
            y: m.y + (Math.random() - 0.5) * 8,
            vx: (Math.random() - 0.5) * 2 - m.vx * 0.1,
            vy: (Math.random() - 0.5) * 2 - m.vy * 0.1,
            life: 1,
            maxLife: 30 + Math.random() * 20,
            hue: Math.random() > 0.5 ? 245 + Math.random() * 30 : 185 + Math.random() * 20,
            size: Math.random() * 2 + 1,
          });
        }
      }

      trailRef.current.unshift({ x: e.clientX, y: e.clientY, age: 0 });
      if (trailRef.current.length > 25) {
        trailRef.current.pop();
      }
    };

    const handleMouseDown = () => {
      clickRef.current = 1;
      const m = mouseRef.current;
      for (let i = 0; i < 20; i++) {
        const angle = (Math.PI * 2 * i) / 20;
        sparksRef.current.push({
          x: m.x,
          y: m.y,
          vx: Math.cos(angle) * (2 + Math.random() * 3),
          vy: Math.sin(angle) * (2 + Math.random() * 3),
          life: 1,
          maxLife: 40 + Math.random() * 20,
          hue: Math.random() > 0.3 ? 245 : 185,
          size: Math.random() * 3 + 1.5,
        });
      }
    };

    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    resize();

    const animate = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const m = mouseRef.current;

      ctx.clearRect(0, 0, w, h);

      clickRef.current *= 0.9;

      const trail = trailRef.current;
      for (let i = trail.length - 1; i >= 0; i--) {
        trail[i].age += 1;
        if (trail[i].age > 25) {
          trail.splice(i, 1);
        }
      }

      if (trail.length > 1) {
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        for (let i = 1; i < trail.length; i++) {
          const p1 = trail[i - 1];
          const p2 = trail[i];
          const progress = i / trail.length;
          const alpha = (1 - progress) * 0.6;
          const width = (1 - progress) * 8;

          const grad = ctx.createLinearGradient(p1.x, p1.y, p2.x, p2.y);
          grad.addColorStop(0, `rgba(99, 91, 255, ${alpha})`);
          grad.addColorStop(0.5, `rgba(124, 92, 255, ${alpha * 0.8})`);
          grad.addColorStop(1, `rgba(0, 212, 255, ${alpha * 0.3})`);
          ctx.strokeStyle = grad;
          ctx.lineWidth = width;
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        }
      }

      const sparks = sparksRef.current;
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.x += s.vx;
        s.y += s.vy;
        s.vx *= 0.96;
        s.vy *= 0.96;
        s.vy += 0.02;
        s.life -= 1 / s.maxLife;

        if (s.life <= 0) {
          sparks.splice(i, 1);
          continue;
        }

        const alpha = s.life * 0.8;
        ctx.fillStyle = `hsla(${s.hue}, 80%, 65%, ${alpha})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size * s.life, 0, Math.PI * 2);
        ctx.fill();

        if (s.life > 0.3) {
          ctx.shadowColor = `hsla(${s.hue}, 80%, 65%, ${alpha * 0.5})`;
          ctx.shadowBlur = 8;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }

      const clickRadius = 20 + clickRef.current * 40;
      if (clickRef.current > 0.05) {
        ctx.strokeStyle = `rgba(99, 91, 255, ${clickRef.current * 0.6})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(m.x, m.y, clickRadius, 0, Math.PI * 2);
        ctx.stroke();
      }

      const glowGrad = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, 40);
      glowGrad.addColorStop(0, 'rgba(99, 91, 255, 0.25)');
      glowGrad.addColorStop(0.3, 'rgba(124, 92, 255, 0.1)');
      glowGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(m.x, m.y, 40, 0, Math.PI * 2);
      ctx.fill();

      const coreGrad = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, 8);
      coreGrad.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
      coreGrad.addColorStop(0.4, 'rgba(0, 212, 255, 0.6)');
      coreGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(m.x, m.y, 8, 0, Math.PI * 2);
      ctx.fill();

      ctx.shadowColor = 'rgba(99, 91, 255, 0.8)';
      ctx.shadowBlur = 15;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.beginPath();
      ctx.arc(m.x, m.y, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      frameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  const isMobile = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;
  const reduceMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (isMobile || reduceMotion) return null;

  return (
    <>
      <style>{`
        @media (pointer: fine) and (prefers-reduced-motion: no-preference) {
          body { cursor: none; }
        }
      `}</style>
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none z-[9999] mix-blend-screen"
      />
    </>
  );
}
