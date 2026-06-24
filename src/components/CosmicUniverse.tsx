import { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

function WarpStarField({ speed = 1.5 }: { speed?: number }) {
  const ref = useRef<THREE.Points>(null);
  const count = 6000;

  const [positions, colors] = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const radius = Math.random() * 120 + 10;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = radius * Math.cos(phi) - 80;

      const colorChoice = Math.random();
      if (colorChoice < 0.65) {
        colors[i3] = 1;
        colors[i3 + 1] = 1;
        colors[i3 + 2] = 1;
      } else if (colorChoice < 0.8) {
        colors[i3] = 0.7 + Math.random() * 0.3;
        colors[i3 + 1] = 0.8 + Math.random() * 0.2;
        colors[i3 + 2] = 1;
      } else if (colorChoice < 0.92) {
        colors[i3] = 1;
        colors[i3 + 1] = 0.9 + Math.random() * 0.1;
        colors[i3 + 2] = 0.75 + Math.random() * 0.15;
      } else {
        colors[i3] = 0.5 + Math.random() * 0.3;
        colors[i3 + 1] = 0.45 + Math.random() * 0.25;
        colors[i3 + 2] = 1;
      }
    }
    return [positions, colors];
  }, []);

  useEffect(() => {
    if (!ref.current) return;
    ref.current.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    ref.current.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  }, [positions, colors]);

  useFrame((_, delta) => {
    if (!ref.current) return;
    const posArr = ref.current.geometry.attributes.position.array as Float32Array;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      posArr[i3 + 2] += delta * speed * 40;

      if (posArr[i3 + 2] > 15) {
        const radius = Math.random() * 80 + 50;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        posArr[i3] = radius * Math.sin(phi) * Math.cos(theta);
        posArr[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
        posArr[i3 + 2] = -150 - Math.random() * 60;
      }
    }

    ref.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry />
      <pointsMaterial
        size={0.35}
        vertexColors
        transparent
        opacity={0.9}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

function DustLayer({ count = 1500, radius = 80, size = 0.12, color = '#8b7fff' }: { count?: number; radius?: number; size?: number; color?: string }) {
  const ref = useRef<THREE.Points>(null);

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const r = Math.random() * radius;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      pos[i3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.5;
      pos[i3 + 2] = r * Math.cos(phi) - 60;
    }
    return pos;
  }, [count, radius]);

  useEffect(() => {
    if (!ref.current) return;
    ref.current.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  }, [positions]);

  useFrame((_, delta) => {
    if (!ref.current) return;
    ref.current.rotation.y += delta * 0.015;
    ref.current.rotation.x += delta * 0.008;
  });

  return (
    <points ref={ref}>
      <bufferGeometry />
      <pointsMaterial
        size={size}
        color={color}
        transparent
        opacity={0.35}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

function EnergyOrb({ position, color, scale = 1, rotSpeed = 0.3 }: { position: [number, number, number]; color: string; scale?: number; rotSpeed?: number }) {
  const ref = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const offset = useMemo(() => Math.random() * Math.PI * 2, []);

  useFrame((state) => {
    if (!ref.current || !glowRef.current) return;
    const t = state.clock.elapsedTime + offset;
    ref.current.position.y = position[1] + Math.sin(t * 0.8) * 2.5;
    ref.current.position.x = position[0] + Math.cos(t * 0.5) * 1.5;
    ref.current.rotation.y = t * rotSpeed;
    ref.current.rotation.x = t * rotSpeed * 0.7;
    glowRef.current.position.copy(ref.current.position);
    const scalePulse = 1 + Math.sin(t * 1.5) * 0.2;
    glowRef.current.scale.setScalar(scale * scalePulse * 2);
  });

  return (
    <group>
      <mesh ref={ref} position={position}>
        <icosahedronGeometry args={[scale * 0.45, 1]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={2.5}
          roughness={0.1}
          metalness={0.9}
          wireframe
        />
      </mesh>
      <mesh ref={glowRef} position={position}>
        <sphereGeometry args={[scale * 1.2, 32, 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.08}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

function NebulaCloud() {
  const ref = useRef<THREE.Points>(null);
  const count = 2500;

  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const arm = Math.floor(Math.random() * 3);
      const angle = (arm / 3) * Math.PI * 2 + Math.random() * 1.8;
      const r = Math.random() * 50 + 15;
      const spread = (Math.random() - 0.5) * 18;

      pos[i3] = Math.cos(angle) * r + spread;
      pos[i3 + 1] = (Math.random() - 0.5) * 10;
      pos[i3 + 2] = Math.sin(angle) * r + spread - 60;

      const t = Math.random();
      if (arm === 0) {
        col[i3] = 0.45 + t * 0.25;
        col[i3 + 1] = 0.35 + t * 0.2;
        col[i3 + 2] = 1;
      } else if (arm === 1) {
        col[i3] = 0.25 + t * 0.25;
        col[i3 + 1] = 0.75 + t * 0.25;
        col[i3 + 2] = 1;
      } else {
        col[i3] = 1;
        col[i3 + 1] = 0.5 + t * 0.3;
        col[i3 + 2] = 0.65 + t * 0.25;
      }
    }
    return [pos, col];
  }, []);

  useEffect(() => {
    if (!ref.current) return;
    ref.current.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    ref.current.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  }, [positions, colors]);

  useFrame((_, delta) => {
    if (!ref.current) return;
    ref.current.rotation.y += delta * 0.025;
  });

  return (
    <points ref={ref}>
      <bufferGeometry />
      <pointsMaterial
        size={0.7}
        vertexColors
        transparent
        opacity={0.45}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

function CameraRig() {
  const { camera, mouse } = useThree();
  const targetPos = useRef(new THREE.Vector3(0, 0, 8));

  useFrame(() => {
    targetPos.current.x += (mouse.x * 3 - targetPos.current.x) * 0.025;
    targetPos.current.y += (mouse.y * 2 - targetPos.current.y) * 0.025;
    camera.position.x = targetPos.current.x;
    camera.position.y = targetPos.current.y;
    camera.lookAt(0, 0, -80);
  });

  return null;
}

function ShootingStars() {
  const ref = useRef<THREE.Points>(null);
  const stars = useRef<{ pos: THREE.Vector3; vel: THREE.Vector3; life: number; active: boolean }[]>([]);
  const maxStars = 30;
  const positions = useMemo(() => new Float32Array(maxStars * 3), []);

  useEffect(() => {
    if (!ref.current) return;
    ref.current.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  }, [positions]);

  useFrame((_, delta) => {
    if (Math.random() < 0.015) {
      const inactive = stars.current.findIndex(s => !s.active);
      if (inactive !== -1 || stars.current.length < maxStars) {
        const idx = inactive !== -1 ? inactive : stars.current.length;
        const angle = Math.random() * Math.PI * 0.4 + Math.PI * 0.15;
        const side = Math.random() > 0.5 ? 1 : -1;
        stars.current[idx] = {
          pos: new THREE.Vector3(
            side * (50 + Math.random() * 30),
            20 + Math.random() * 30,
            -80 - Math.random() * 50
          ),
          vel: new THREE.Vector3(
            -side * (60 + Math.random() * 40),
            -(50 + Math.random() * 30),
            30
          ),
          life: 1,
          active: true,
        };
      }
    }

    for (let i = 0; i < stars.current.length; i++) {
      const s = stars.current[i];
      if (!s.active) continue;

      s.pos.add(s.vel.clone().multiplyScalar(delta));
      s.life -= delta * 0.6;

      if (s.life <= 0) {
        s.active = false;
        const i3 = i * 3;
        positions[i3] = -1000;
        positions[i3 + 1] = -1000;
        positions[i3 + 2] = -1000;
        continue;
      }

      const i3 = i * 3;
      positions[i3] = s.pos.x;
      positions[i3 + 1] = s.pos.y;
      positions[i3 + 2] = s.pos.z;
    }

    if (ref.current) {
      ref.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry />
      <pointsMaterial
        size={0.8}
        color="#ffffff"
        transparent
        opacity={0.95}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

export default function CosmicUniverse() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none">
      <Canvas
        camera={{ position: [0, 0, 8], fov: 70, near: 0.1, far: 300 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        style={{
          background: 'radial-gradient(ellipse at 50% 40%, #0a1830 0%, #030a18 45%, #010308 100%)',
        }}
      >
        <fog attach="fog" args={['#010308', 40, 180]} />
        <ambientLight intensity={0.08} />
        <pointLight position={[15, 15, -30]} intensity={0.6} color="#635BFF" distance={100} />
        <pointLight position={[-15, -10, -60]} intensity={0.4} color="#00D4FF" distance={80} />
        <pointLight position={[0, 20, -90]} intensity={0.3} color="#FF6B9D" distance={100} />

        <CameraRig />

        <WarpStarField speed={2} />
        <DustLayer count={1200} radius={90} size={0.1} color="#7c6fff" />
        <DustLayer count={800} radius={70} size={0.08} color="#00d4ff" />

        <NebulaCloud />

        <EnergyOrb position={[-20, 10, -60]} color="#635BFF" scale={2.2} rotSpeed={0.4} />
        <EnergyOrb position={[25, -8, -80]} color="#00D4FF" scale={1.8} rotSpeed={0.5} />
        <EnergyOrb position={[8, 15, -110]} color="#FF6B9D" scale={2.8} rotSpeed={0.3} />

        <ShootingStars />
      </Canvas>

      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse 70% 50% at 15% 35%, rgba(99, 91, 255, 0.1) 0%, transparent 55%),
            radial-gradient(ellipse 55% 45% at 85% 65%, rgba(0, 212, 255, 0.08) 0%, transparent 55%),
            radial-gradient(ellipse 40% 50% at 50% 15%, rgba(255, 107, 157, 0.06) 0%, transparent 50%)
          `
        }}
      />

      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 0%, rgba(1, 3, 8, 0.5) 100%)'
        }}
      />
    </div>
  );
}
