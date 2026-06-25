import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface NebulaCloudProps {
  position: [number, number, number];
  radius: number;
  color: string;
  secondaryColor?: string;
  particleCount?: number;
  rotationSpeed?: number;
  driftSpeed?: number;
  opacity?: number;
}

function NebulaCloud({
  position,
  radius,
  color,
  secondaryColor,
  particleCount = 2000,
  rotationSpeed = 0.008,
  driftSpeed = 0.003,
  opacity = 0.3,
}: NebulaCloudProps) {
  const ref = useRef<THREE.Points>(null);
  const baseColor = useMemo(() => new THREE.Color(color), [color]);
  const secColor = useMemo(() => new THREE.Color(secondaryColor || color), [secondaryColor, color]);

  const { positions, colors, sizes } = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const col = new Float32Array(particleCount * 3);
    const siz = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = radius * Math.pow(Math.random(), 0.4);

      const flattening = 0.3;
      pos[i3] = position[0] + r * Math.sin(phi) * Math.cos(theta);
      pos[i3 + 1] = position[1] + r * Math.sin(phi) * Math.sin(theta) * flattening;
      pos[i3 + 2] = position[2] + r * Math.cos(phi);

      const distFromCenter = r / radius;
      const colorMix = Math.pow(Math.random(), 0.5);
      const c = colorMix < 0.6
        ? baseColor
        : secColor;
      const brightness = 0.5 + Math.random() * 0.5;
      const edgeFade = 1 - distFromCenter * 0.7;
      col[i3] = c.r * brightness * edgeFade;
      col[i3 + 1] = c.g * brightness * edgeFade;
      col[i3 + 2] = c.b * brightness * edgeFade;

      siz[i] = radius * (0.08 + Math.random() * 0.2) * (0.5 + edgeFade);
    }

    return { positions: pos, colors: col, sizes: siz };
  }, [position, radius, particleCount, baseColor, secColor]);

  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.rotation.y = clock.elapsedTime * rotationSpeed;
      ref.current.rotation.x = Math.sin(clock.elapsedTime * driftSpeed * 0.3) * 0.08;
      ref.current.rotation.z = Math.cos(clock.elapsedTime * driftSpeed * 0.2) * 0.05;
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
        size={radius * 0.2}
        vertexColors
        transparent
        opacity={opacity}
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
        position={[-120, 30, -180]}
        radius={120}
        color="#7040ff"
        secondaryColor="#ff40c0"
        particleCount={2500}
        rotationSpeed={0.005}
        driftSpeed={0.002}
        opacity={0.25}
      />
      <NebulaCloud
        position={[150, -40, -220]}
        radius={150}
        color="#20a0ff"
        secondaryColor="#40ffc0"
        particleCount={3000}
        rotationSpeed={-0.004}
        driftSpeed={0.002}
        opacity={0.2}
      />
      <NebulaCloud
        position={[30, 100, -280]}
        radius={90}
        color="#ff6040"
        secondaryColor="#ffaa30"
        particleCount={1500}
        rotationSpeed={0.007}
        driftSpeed={0.003}
        opacity={0.18}
      />
      <NebulaCloud
        position={[-80, -60, -160]}
        radius={70}
        color="#4060ff"
        secondaryColor="#a040ff"
        particleCount={1200}
        rotationSpeed={-0.006}
        driftSpeed={0.0025}
        opacity={0.15}
      />
    </group>
  );
}
