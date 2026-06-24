import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface NebulaCloudProps {
  position: [number, number, number];
  radius: number;
  color: string;
  particleCount?: number;
  rotationSpeed?: number;
  driftSpeed?: number;
}

function NebulaCloud({
  position,
  radius,
  color,
  particleCount = 1500,
  rotationSpeed = 0.01,
  driftSpeed = 0.005,
}: NebulaCloudProps) {
  const ref = useRef<THREE.Points>(null);
  const baseColor = useMemo(() => new THREE.Color(color), [color]);

  const { positions, colors } = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const col = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      const r = radius * Math.pow(Math.random(), 0.5);
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      pos[i3] = position[0] + r * Math.sin(phi) * Math.cos(theta);
      pos[i3 + 1] = position[1] + r * Math.sin(phi) * Math.sin(theta);
      pos[i3 + 2] = position[2] + r * Math.cos(phi);

      const colorVariation = 0.7 + Math.random() * 0.3;
      col[i3] = baseColor.r * colorVariation;
      col[i3 + 1] = baseColor.g * colorVariation;
      col[i3 + 2] = baseColor.b * colorVariation;
    }

    return { positions: pos, colors: col };
  }, [position, radius, particleCount, baseColor]);

  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.rotation.y = clock.elapsedTime * rotationSpeed;
      ref.current.rotation.x = Math.sin(clock.elapsedTime * driftSpeed * 0.5) * 0.1;
      ref.current.position.x = position[0] + Math.sin(clock.elapsedTime * driftSpeed) * 5;
      ref.current.position.y = position[1] + Math.cos(clock.elapsedTime * driftSpeed * 0.7) * 3;
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={particleCount}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={radius * 0.15}
        vertexColors
        transparent
        opacity={0.35}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

export default function Nebula() {
  return (
    <group>
      <NebulaCloud
        position={[-150, 80, -200]}
        radius={80}
        color="#8050ff"
        particleCount={800}
        rotationSpeed={0.008}
        driftSpeed={0.004}
      />
      <NebulaCloud
        position={[180, -60, -250]}
        radius={100}
        color="#00c0ff"
        particleCount={800}
        rotationSpeed={-0.006}
        driftSpeed={0.003}
      />
      <NebulaCloud
        position={[50, 120, -300]}
        radius={60}
        color="#ff4080"
        particleCount={500}
        rotationSpeed={0.01}
        driftSpeed={0.005}
      />
    </group>
  );
}
