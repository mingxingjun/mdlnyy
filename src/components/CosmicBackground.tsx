import { useEffect, useRef } from 'react';

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}

interface Star {
  x: number;
  y: number;
  z: number;
  pz: number;
  size: number;
  color: string;
  rgb: { r: number; g: number; b: number };
  twinkle: number;
  twinkleSpeed: number;
}

interface NebulaNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  hue: number;
  connections: number[];
}

interface ConstellationLine {
  from: number;
  to: number;
  alpha: number;
}

const STAR_COLORS = [
  '#ffffff',
  '#ffe4c4',
  '#add8e6',
  '#fff8dc',
  '#e6e6fa',
  '#b0e0e6',
  '#635BFF',
  '#00D4FF',
];

export default function CosmicBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -1000, y: -1000, active: false });
  const starsRef = useRef<Star[]>([]);
  const nebulaRef = useRef<NebulaNode[]>([]);
  const linesRef = useRef<ConstellationLine[]>([]);
  const speedRef = useRef(0.8);
  const targetSpeedRef = useRef(0.8);
  const frameRef = useRef(0);
  const timeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.scale(dpr, dpr);
      initStars();
      initNebula();
    };

    const initStars = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const count = Math.floor((w * h) / 4500);
      const stars: Star[] = [];
      for (let i = 0; i < count; i++) {
        const color = STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)];
        stars.push({
          x: (Math.random() - 0.5) * w * 2,
          y: (Math.random() - 0.5) * h * 2,
          z: Math.random() * w,
          pz: 0,
          size: Math.random() * 1.8 + 0.2,
          color,
          rgb: hexToRgb(color),
          twinkle: Math.random() * Math.PI * 2,
          twinkleSpeed: Math.random() * 0.03 + 0.01,
        });
        stars[i].pz = stars[i].z;
      }
      starsRef.current = stars;
    };

    const initNebula = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const nodeCount = 18;
      const nodes: NebulaNode[] = [];
      for (let i = 0; i < nodeCount; i++) {
        nodes.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          radius: Math.random() * 40 + 20,
          hue: Math.random() * 60 + 220,
          connections: [],
        });
      }
      for (let i = 0; i < nodeCount; i++) {
        for (let j = i + 1; j < nodeCount; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 280) {
            nodes[i].connections.push(j);
          }
        }
      }
      nebulaRef.current = nodes;
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
      mouseRef.current.active = true;
    };

    const handleMouseLeave = () => {
      mouseRef.current.active = false;
    };

    const handleMouseDown = () => {
      targetSpeedRef.current = 3.5;
    };

    const handleMouseUp = () => {
      targetSpeedRef.current = 0.8;
    };

    const handleScroll = () => {
      targetSpeedRef.current = 2.5;
      setTimeout(() => {
        targetSpeedRef.current = 0.8;
      }, 300);
    };

    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('scroll', handleScroll, true);

    resize();

    const animate = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const cx = w / 2;
      const cy = h / 2;
      const mouse = mouseRef.current;
      timeRef.current += 0.008;

      speedRef.current += (targetSpeedRef.current - speedRef.current) * 0.05;
      const speed = speedRef.current;

      ctx.clearRect(0, 0, w, h);

      const bgGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * 0.8);
      bgGrad.addColorStop(0, 'rgba(10, 37, 64, 0)');
      bgGrad.addColorStop(0.5, 'rgba(8, 28, 50, 0.3)');
      bgGrad.addColorStop(1, 'rgba(5, 18, 35, 0.6)');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      const nebulaNodes = nebulaRef.current;
      for (const node of nebulaNodes) {
        node.x += node.vx;
        node.y += node.vy;
        if (node.x < -100) node.x = w + 100;
        if (node.x > w + 100) node.x = -100;
        if (node.y < -100) node.y = h + 100;
        if (node.y > h + 100) node.y = -100;

        if (mouse.active) {
          const dx = mouse.x - node.x;
          const dy = mouse.y - node.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 200 && dist > 0) {
            const force = (200 - dist) / 200 * 0.02;
            node.vx += (dx / dist) * force;
            node.vy += (dy / dist) * force;
          }
        }
        node.vx *= 0.99;
        node.vy *= 0.99;
      }

      ctx.lineWidth = 0.8;
      for (let i = 0; i < nebulaNodes.length; i++) {
        const node = nebulaNodes[i];
        for (const j of node.connections) {
          if (j <= i) continue;
          const other = nebulaNodes[j];
          const dx = node.x - other.x;
          const dy = node.y - other.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 280) {
            const alpha = (1 - dist / 280) * 0.15;
            const hue = (node.hue + other.hue) / 2;
            ctx.strokeStyle = `hsla(${hue}, 70%, 60%, ${alpha})`;
            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(other.x, other.y);
            ctx.stroke();
          }
        }
      }

      for (const node of nebulaNodes) {
        const pulse = Math.sin(timeRef.current * 2 + node.x * 0.01) * 0.3 + 0.7;
        const grad = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, node.radius * pulse);
        grad.addColorStop(0, `hsla(${node.hue}, 80%, 65%, 0.08)`);
        grad.addColorStop(0.5, `hsla(${node.hue}, 70%, 55%, 0.03)`);
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius * pulse, 0, Math.PI * 2);
        ctx.fill();
      }

      const stars = starsRef.current;
      for (const star of stars) {
        star.pz = star.z;
        star.z -= speed;
        star.twinkle += star.twinkleSpeed;

        if (star.z < 1) {
          star.x = (Math.random() - 0.5) * w * 2;
          star.y = (Math.random() - 0.5) * h * 2;
          star.z = w;
          star.pz = star.z;
        }

        const sx = (star.x / star.z) * 400 + cx;
        const sy = (star.y / star.z) * 400 + cy;
        const px = (star.x / star.pz) * 400 + cx;
        const py = (star.y / star.pz) * 400 + cy;

        const depth = 1 - star.z / w;
        const size = star.size * depth * (0.5 + depth);
        const twinkleAlpha = 0.5 + Math.sin(star.twinkle) * 0.3;
        const alpha = depth * twinkleAlpha;

        if (sx < -50 || sx > w + 50 || sy < -50 || sy > h + 50) continue;

        const { r, g, b } = star.rgb;

        if (speed > 1.2 || depth > 0.8) {
          const trailGrad = ctx.createLinearGradient(px, py, sx, sy);
          trailGrad.addColorStop(0, 'transparent');
          trailGrad.addColorStop(0.7, `rgba(${r}, ${g}, ${b}, ${alpha * 0.3})`);
          trailGrad.addColorStop(1, `rgba(${r}, ${g}, ${b}, ${alpha})`);
          ctx.strokeStyle = trailGrad;
          ctx.lineWidth = Math.max(size * 0.6, 0.5);
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(sx, sy);
          ctx.stroke();
        }

        if (depth > 0.9) {
          const glowGrad = ctx.createRadialGradient(sx, sy, 0, sx, sy, size * 5);
          glowGrad.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${alpha * 0.4})`);
          glowGrad.addColorStop(0.4, `rgba(${r}, ${g}, ${b}, ${alpha * 0.1})`);
          glowGrad.addColorStop(1, 'transparent');
          ctx.fillStyle = glowGrad;
          ctx.beginPath();
          ctx.arc(sx, sy, size * 5, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
        ctx.beginPath();
        ctx.arc(sx, sy, Math.max(size, 0.3), 0, Math.PI * 2);
        ctx.fill();
      }

      if (mouse.active) {
        const mouseGlow = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 150);
        mouseGlow.addColorStop(0, 'rgba(99, 91, 255, 0.12)');
        mouseGlow.addColorStop(0.4, 'rgba(0, 212, 255, 0.06)');
        mouseGlow.addColorStop(1, 'transparent');
        ctx.fillStyle = mouseGlow;
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 150, 0, Math.PI * 2);
        ctx.fill();

        for (const star of stars) {
          const sx = (star.x / star.z) * 400 + cx;
          const sy = (star.y / star.z) * 400 + cy;
          const dx = mouse.x - sx;
          const dy = mouse.y - sy;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100 && dist > 0) {
            const bend = (100 - dist) / 100 * 15;
            const bx = sx + (dx / dist) * bend;
            const by = sy + (dy / dist) * bend;
            ctx.strokeStyle = `rgba(99, 91, 255, ${(1 - dist / 100) * 0.3})`;
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(sx, sy);
            ctx.lineTo(bx, by);
            ctx.stroke();
          }
        }
      }

      const warpIntensity = (speed - 0.8) / 2.7;
      if (warpIntensity > 0.01) {
        const warpGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * 0.6);
        warpGrad.addColorStop(0, 'transparent');
        warpGrad.addColorStop(0.5, `rgba(0, 212, 255, ${warpIntensity * 0.03})`);
        warpGrad.addColorStop(1, `rgba(99, 91, 255, ${warpIntensity * 0.08})`);
        ctx.fillStyle = warpGrad;
        ctx.fillRect(0, 0, w, h);

        ctx.strokeStyle = `rgba(0, 212, 255, ${warpIntensity * 0.15})`;
        ctx.lineWidth = 1;
        for (let i = 0; i < 8; i++) {
          const angle = (i / 8) * Math.PI * 2 + timeRef.current;
          const len = 100 + warpIntensity * 400;
          ctx.beginPath();
          ctx.moveTo(cx + Math.cos(angle) * 50, cy + Math.sin(angle) * 50);
          ctx.lineTo(cx + Math.cos(angle) * len, cy + Math.sin(angle) * len);
          ctx.stroke();
        }
      }

      const vignette = ctx.createRadialGradient(cx, cy, Math.min(w, h) * 0.3, cx, cy, Math.max(w, h) * 0.75);
      vignette.addColorStop(0, 'transparent');
      vignette.addColorStop(1, 'rgba(5, 15, 30, 0.4)');
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, w, h);

      frameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ background: 'transparent' }}
    />
  );
}
