import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Stars } from '@react-three/drei';
import * as THREE from 'three';

function DataRainParticles() {
  const count = 800;
  const meshRef = useRef<THREE.Points>(null!);

  const [positions, colors, sizes] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const siz = new Float32Array(count);

    const palette = [
      new THREE.Color('#00d4ff'),
      new THREE.Color('#8b5cf6'),
      new THREE.Color('#00ff88'),
      new THREE.Color('#ff0080'),
      new THREE.Color('#ffd600'),
      new THREE.Color('#f97316'),
    ];

    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * 30;
      const y = (Math.random() - 0.5) * 20;
      const z = (Math.random() - 0.5) * 15;

      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;

      const color = palette[Math.floor(Math.random() * palette.length)];
      col[i * 3] = color.r;
      col[i * 3 + 1] = color.g;
      col[i * 3 + 2] = color.b;

      siz[i] = Math.random() * 0.06 + 0.02;
    }

    return [pos, col, siz];
  }, []);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    const pos = meshRef.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < count; i++) {
      pos[i * 3 + 1] -= delta * (0.3 + Math.random() * 0.5);
      if (pos[i * 3 + 1] < -10) {
        pos[i * 3 + 1] = 10;
        pos[i * 3] = (Math.random() - 0.5) * 30;
      }
    }
    meshRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={count}
          array={colors}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-size"
          count={count}
          array={sizes}
          itemSize={1}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.06}
        vertexColors
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  );
}

function FloatingGeometries() {
  const geometries = useMemo(() => {
    const items = [];
    for (let i = 0; i < 8; i++) {
      items.push({
        position: [
          (Math.random() - 0.5) * 20,
          (Math.random() - 0.5) * 12,
          (Math.random() - 0.5) * 10 - 2,
        ] as [number, number, number],
        rotation: [Math.random() * Math.PI, Math.random() * Math.PI, 0] as [number, number, number],
        scale: Math.random() * 0.4 + 0.2,
        speed: Math.random() * 0.3 + 0.1,
        type: i % 3,
      });
    }
    return items;
  }, []);

  return (
    <>
      {geometries.map((item, i) => (
        <Float key={i} speed={item.speed} rotationIntensity={0.5} floatIntensity={0.5}>
          <mesh position={item.position} rotation={item.rotation} scale={item.scale}>
            {item.type === 0 && <octahedronGeometry args={[1, 0]} />}
            {item.type === 1 && <icosahedronGeometry args={[0.7, 0]} />}
            {item.type === 2 && <torusGeometry args={[0.5, 0.15, 8, 16]} />}
            <meshBasicMaterial
              color={['#00d4ff', '#8b5cf6', '#ff0080'][i % 3]}
              wireframe
              transparent
              opacity={0.15}
            />
          </mesh>
        </Float>
      ))}
    </>
  );
}

function RingGlow() {
  const ringRef = useRef<THREE.Mesh>(null!);

  useFrame((_, delta) => {
    if (ringRef.current) {
      ringRef.current.rotation.x += delta * 0.1;
      ringRef.current.rotation.y += delta * 0.15;
      ringRef.current.rotation.z += delta * 0.05;
    }
  });

  return (
    <mesh ref={ringRef} scale={8}>
      <torusGeometry args={[1, 0.003, 16, 100]} />
      <meshBasicMaterial color="#00d4ff" transparent opacity={0.08} />
    </mesh>
  );
}

export default function ThreeBackground() {
  return (
    <div className="fixed inset-0 -z-10">
      <Canvas
        camera={{ position: [0, 0, 8], fov: 60 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.1} />
        <Stars radius={20} depth={10} count={200} factor={2} saturation={1} fade speed={0.5} />
        <DataRainParticles />
        <FloatingGeometries />
        <RingGlow />
      </Canvas>
    </div>
  );
}