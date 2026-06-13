import { useEffect, useRef } from 'react';
import { useAppStore } from '@/store/useAppStore';

interface Vector2D {
  x: number;
  y: number;
}

interface Particle {
  pos: Vector2D;
  vel: Vector2D;
  mastery: number;
  history: Vector2D[];
}

interface KnowledgeNode {
  pos: Vector2D;
  mastery: number;
  label: string;
  type: string;
}

export default function KnowledgeFlowField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const particlesRef = useRef<Particle[]>([]);
  const knowledgeNodesRef = useRef<KnowledgeNode[]>([]);
  const timeRef = useRef(0);

  const subjects = useAppStore(s => s.subjects);
  const knowledgePoints = useAppStore(s => s.knowledgePoints);
  const flashCards = useAppStore(s => s.flashCards);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 设置画布大小
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // 从真实数据创建知识节点
    const createKnowledgeNodes = () => {
      const nodes: KnowledgeNode[] = [];
      const width = canvas.width / window.devicePixelRatio;
      const height = canvas.height / window.devicePixelRatio;

      // 基于科目创建核心节点
      subjects.forEach((subject, i) => {
        const angle = (i / subjects.length) * Math.PI * 2;
        const radius = Math.min(width, height) * 0.3;
        nodes.push({
          pos: {
            x: width / 2 + Math.cos(angle) * radius,
            y: height / 2 + Math.sin(angle) * radius
          },
          mastery: subject.progress / 100,
          label: subject.name,
          type: 'subject'
        });
      });

      // 基于知识点创建子节点
      knowledgePoints.forEach((point) => {
        const subjectIndex = subjects.findIndex(s => s.id === point.subjectId);
        if (subjectIndex === -1) return;

        const subjectAngle = (subjectIndex / subjects.length) * Math.PI * 2;
        const subjectRadius = Math.min(width, height) * 0.3;

        // 在科目周围分布知识点
        const pointAngle = subjectAngle + (Math.random() - 0.5) * 0.8;
        const pointRadius = subjectRadius * (0.3 + Math.random() * 0.4);
        
        nodes.push({
          pos: {
            x: width / 2 + Math.cos(pointAngle) * pointRadius,
            y: height / 2 + Math.sin(pointAngle) * pointRadius
          },
          mastery: point.mastery / 100,
          label: point.name,
          type: 'point'
        });
      });

      // 如果没有数据，创建一些示例节点
      if (nodes.length === 0) {
        for (let i = 0; i < 8; i++) {
          const angle = (i / 8) * Math.PI * 2;
          const radius = Math.min(width, height) * 0.25;
          nodes.push({
            pos: {
              x: width / 2 + Math.cos(angle) * radius,
              y: height / 2 + Math.sin(angle) * radius
            },
            mastery: Math.random(),
            label: `知识点 ${i + 1}`,
            type: 'sample'
          });
        }
      }

      knowledgeNodesRef.current = nodes;
    };

    // 创建粒子
    const createParticles = () => {
      const width = canvas.width / window.devicePixelRatio;
      const height = canvas.height / window.devicePixelRatio;
      const particleCount = Math.min(800, knowledgeNodesRef.current.length * 30);

      particlesRef.current = [];
      for (let i = 0; i < particleCount; i++) {
        particlesRef.current.push({
          pos: { x: Math.random() * width, y: Math.random() * height },
          vel: { 
            x: (Math.random() - 0.5) * 2, 
            y: (Math.random() - 0.5) * 2 
          },
          mastery: Math.random(),
          history: []
        });
      }
    };

    // 颜色插值
    const getColorFromMastery = (mastery: number, alpha: number = 1) => {
      if (mastery < 0.5) {
        const t = mastery * 2;
        const r = Math.round(106 + (120 - 106) * t);
        const g = Math.round(155 + (140 - 155) * t);
        const b = Math.round(204 + (93 - 204) * t);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
      } else {
        const t = (mastery - 0.5) * 2;
        const r = Math.round(120 + (217 - 120) * t);
        const g = Math.round(140 + (119 - 140) * t);
        const b = Math.round(93 + (87 - 93) * t);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
      }
    };

    // 简化的 Perlin 噪声
    const noise = (x: number, y: number, z: number) => {
      const X = Math.floor(x) & 255;
      const Y = Math.floor(y) & 255;
      const Z = Math.floor(z) & 255;
      
      x -= Math.floor(x);
      y -= Math.floor(y);
      z -= Math.floor(z);
      
      const u = fade(x);
      const v = fade(y);
      const w = fade(z);
      
      const A = p[X] + Y;
      const AA = p[A] + Z;
      const AB = p[A + 1] + Z;
      const B = p[X + 1] + Y;
      const BA = p[B] + Z;
      const BB = p[B + 1] + Z;
      
      return lerp(w, 
        lerp(v, 
          lerp(u, grad(p[AA], x, y, z), grad(p[BA], x - 1, y, z)),
          lerp(u, grad(p[AB], x, y - 1, z), grad(p[BB], x - 1, y - 1, z))
        ),
        lerp(v, 
          lerp(u, grad(p[AA + 1], x, y, z - 1), grad(p[BA + 1], x - 1, y, z - 1)),
          lerp(u, grad(p[AB + 1], x, y - 1, z - 1), grad(p[BB + 1], x - 1, y - 1, z - 1))
        )
      );
    };

    const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
    const lerp = (t: number, a: number, b: number) => a + t * (b - a);
    const grad = (hash: number, x: number, y: number, z: number) => {
      const h = hash & 15;
      const u = h < 8 ? x : y;
      const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
      return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
    };

    // Permutation table
    const p = new Array(512);
    const permutation = new Array(256);
    for (let i = 0; i < 256; i++) permutation[i] = i;
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [permutation[i], permutation[j]] = [permutation[j], permutation[i]];
    }
    for (let i = 0; i < 512; i++) p[i] = permutation[i & 255];

    // 动画循环
    const animate = () => {
      const width = canvas.width / window.devicePixelRatio;
      const height = canvas.height / window.devicePixelRatio;

      // 时间衰减效果
      ctx.fillStyle = 'rgba(250, 249, 245, 0.05)';
      ctx.fillRect(0, 0, width, height);

      timeRef.current += 0.01;

      // 绘制知识节点之间的连接
      const nodes = knowledgeNodesRef.current;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const d = Math.hypot(
            nodes[i].pos.x - nodes[j].pos.x,
            nodes[i].pos.y - nodes[j].pos.y
          );

          if (d < 140) {
            const alpha = (1 - d / 140) * 0.4;
            const weight = (1 - d / 140) * 2;
            const mastery = (nodes[i].mastery + nodes[j].mastery) / 2;

            ctx.strokeStyle = getColorFromMastery(mastery, alpha);
            ctx.lineWidth = weight;
            ctx.beginPath();
            ctx.moveTo(nodes[i].pos.x, nodes[i].pos.y);
            ctx.lineTo(nodes[j].pos.x, nodes[j].pos.y);
            ctx.stroke();
          }
        }
      }

      // 绘制知识节点
      for (const node of nodes) {
        const size = 4 + node.mastery * 8;
        const color = getColorFromMastery(node.mastery);

        ctx.fillStyle = getColorFromMastery(node.mastery, 0.6);
        ctx.beginPath();
        ctx.arc(node.pos.x, node.pos.y, size * 1.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(node.pos.x, node.pos.y, size, 0, Math.PI * 2);
        ctx.fill();
      }

      // 更新和绘制粒子
      for (const particle of particlesRef.current) {
        // 保存历史
        particle.history.push({ ...particle.pos });
        if (particle.history.length > 10) {
          particle.history.shift();
        }

        // 噪声影响
        const noiseScale = 0.008;
        const n1 = noise(particle.pos.x * noiseScale, particle.pos.y * noiseScale, timeRef.current);
        const n2 = noise(particle.pos.x * noiseScale * 2, particle.pos.y * noiseScale * 2, timeRef.current * 1.5);
        const n3 = noise(particle.pos.x * noiseScale * 0.5, particle.pos.y * noiseScale * 0.5, timeRef.current * 0.5);

        const angle1 = n1 * Math.PI * 4;
        const angle2 = n2 * Math.PI * 2;
        const angle3 = n3 * Math.PI;

        particle.vel.x += Math.cos(angle1) * 0.5 + Math.cos(angle2) * 0.3 + Math.cos(angle3) * 0.2;
        particle.vel.y += Math.sin(angle1) * 0.5 + Math.sin(angle2) * 0.3 + Math.sin(angle3) * 0.2;

        // 知识节点引力
        let closestNode: KnowledgeNode | null = null;
        let closestDist = Infinity;

        for (const node of nodes) {
          const d = Math.hypot(particle.pos.x - node.pos.x, particle.pos.y - node.pos.y);
          if (d < closestDist && d < 70) {
            closestDist = d;
            closestNode = node;
          }
        }

        if (closestNode) {
          const dx = closestNode.pos.x - particle.pos.x;
          const dy = closestNode.pos.y - particle.pos.y;
          const d = Math.hypot(dx, dy);
          
          if (d > 0) {
            const force = 0.08 * (1 - d / 70);
            particle.vel.x += (dx / d) * force;
            particle.vel.y += (dy / d) * force;
            particle.mastery = particle.mastery * 0.99 + closestNode.mastery * 0.01;
          }
        }

        // 限制速度
        const speed = Math.hypot(particle.vel.x, particle.vel.y);
        if (speed > 3) {
          particle.vel.x = (particle.vel.x / speed) * 3;
          particle.vel.y = (particle.vel.y / speed) * 3;
        }

        // 更新位置
        particle.pos.x += particle.vel.x;
        particle.pos.y += particle.vel.y;

        // 边界环绕
        if (particle.pos.x < 0) particle.pos.x = width;
        if (particle.pos.x > width) particle.pos.x = 0;
        if (particle.pos.y < 0) particle.pos.y = height;
        if (particle.pos.y > height) particle.pos.y = 0;

        // 绘制轨迹
        for (let i = 0; i < particle.history.length - 1; i++) {
          const pt = particle.history[i];
          const nextPt = particle.history[i + 1];
          const alpha = (i / particle.history.length) * 0.3;
          const weight = (i / particle.history.length) * 1.5;

          ctx.strokeStyle = getColorFromMastery(particle.mastery, alpha);
          ctx.lineWidth = weight;
          ctx.beginPath();
          ctx.moveTo(pt.x, pt.y);
          ctx.lineTo(nextPt.x, nextPt.y);
          ctx.stroke();
        }

        // 绘制粒子
        ctx.fillStyle = getColorFromMastery(particle.mastery, 0.6);
        ctx.beginPath();
        ctx.arc(particle.pos.x, particle.pos.y, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    createKnowledgeNodes();
    createParticles();
    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [subjects, knowledgePoints, flashCards]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      style={{ background: 'linear-gradient(135deg, #faf9f5 0%, #f5f3ee 100%)' }}
    />
  );
}
