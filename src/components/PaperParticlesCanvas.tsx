import { useEffect, useRef } from 'react';
import { useReducedMotion } from 'framer-motion';

/**
 * 纸张主题动态粒子背景（纯 Canvas 2D，无 Three.js 依赖）。
 *
 * 两类元素：
 *  - 飘落纸片：暖色小矩形，缓慢下落 + 左右摇摆 + 微旋转，循环复用
 *  - 墨水晕染：在随机位置缓慢扩散的圆形墨迹，淡入后淡出
 *
 * 性能与无障碍：
 *  - 粒子数按视口宽度自适应（12~22），DPR 限幅 ≤2
 *  - dt 限幅 50ms，避免切标签后大跳
 *  - visibilitychange 自动暂停 rAF，回到前台续播
 *  - prefers-reduced-motion 时完全不渲染（前庭敏感用户）
 *  - pointer-events:none，不拦截交互
 */
interface PaperFlake {
  x: number;
  y: number;
  size: number;
  rotation: number;
  rotationSpeed: number;
  swayAmp: number;
  swayPhase: number;
  swaySpeed: number;
  fallSpeed: number;
  color: string;
  opacity: number;
}

interface InkBloom {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  opacity: number;
  color: string;
  growing: boolean;
}

const PAPER_COLORS = [
  'rgba(139, 37, 0, 0.18)',
  'rgba(184, 134, 11, 0.18)',
  'rgba(92, 64, 51, 0.15)',
  'rgba(205, 92, 92, 0.14)',
  'rgba(107, 142, 35, 0.14)',
];

export default function PaperParticlesCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce) return; // 无障碍：前庭敏感用户不渲染动态背景
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let dpr = 1;

    const setSize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    setSize();

    const FLAKE_COUNT = Math.max(10, Math.min(22, Math.floor(width / 85)));
    const flakes: PaperFlake[] = [];

    const spawnFlake = (initial: boolean): PaperFlake => ({
      x: Math.random() * width,
      y: initial ? Math.random() * height : -20,
      size: 4 + Math.random() * 6,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.02,
      swayAmp: 12 + Math.random() * 22,
      swayPhase: Math.random() * Math.PI * 2,
      swaySpeed: 0.004 + Math.random() * 0.008,
      fallSpeed: 0.25 + Math.random() * 0.45,
      color: PAPER_COLORS[Math.floor(Math.random() * PAPER_COLORS.length)],
      opacity: 0.45 + Math.random() * 0.4,
    });

    for (let i = 0; i < FLAKE_COUNT; i++) {
      flakes.push(spawnFlake(true));
    }

    const blooms: InkBloom[] = [];
    let nextBloomAt = performance.now() + 3000 + Math.random() * 4000;

    let rafId = 0;
    let lastTs = performance.now();
    let running = true;

    const tick = (ts: number) => {
      if (!running) return;
      const dt = Math.min(ts - lastTs, 50); // 限幅，避免切换标签后大跳
      lastTs = ts;
      const step = dt / 16; // 以 60fps 为单位归一化

      ctx.clearRect(0, 0, width, height);

      // 飘落纸片
      for (const f of flakes) {
        f.swayPhase += f.swaySpeed * dt;
        f.y += f.fallSpeed * step;
        f.rotation += f.rotationSpeed * step;
        const drawX = f.x + Math.sin(f.swayPhase) * f.swayAmp;
        if (f.y > height + 20) {
          Object.assign(f, spawnFlake(false));
        }
        ctx.save();
        ctx.translate(drawX, f.y);
        ctx.rotate(f.rotation);
        ctx.globalAlpha = f.opacity;
        ctx.fillStyle = f.color;
        const w = f.size * 1.3;
        const h = f.size * 0.7;
        ctx.fillRect(-w / 2, -h / 2, w, h);
        ctx.restore();
      }

      // 墨水晕染：到点生成，扩散到 maxRadius 后淡出
      if (ts >= nextBloomAt) {
        blooms.push({
          x: Math.random() * width,
          y: Math.random() * height,
          radius: 2,
          maxRadius: 28 + Math.random() * 42,
          opacity: 0,
          color: PAPER_COLORS[Math.floor(Math.random() * PAPER_COLORS.length)],
          growing: true,
        });
        nextBloomAt = ts + 4000 + Math.random() * 6000;
      }
      for (let i = blooms.length - 1; i >= 0; i--) {
        const b = blooms[i];
        if (b.growing) {
          b.radius += 0.3 * step;
          b.opacity = Math.min(0.22, b.opacity + 0.004 * step);
          if (b.radius >= b.maxRadius) b.growing = false;
        } else {
          b.opacity -= 0.0025 * step;
          if (b.opacity <= 0) {
            blooms.splice(i, 1);
            continue;
          }
        }
        ctx.save();
        ctx.globalAlpha = b.opacity;
        ctx.fillStyle = b.color;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);

    const onVisibility = () => {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(rafId);
      } else if (!running) {
        running = true;
        lastTs = performance.now();
        rafId = requestAnimationFrame(tick);
      }
    };
    const onResize = () => setSize();

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('resize', onResize);

    return () => {
      running = false;
      cancelAnimationFrame(rafId);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('resize', onResize);
    };
  }, [reduce]);

  if (reduce) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 1 }}
    />
  );
}
