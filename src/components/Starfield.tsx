import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface StarLayerConfig {
  count: number;
  minRadius: number;
  maxRadius: number;
  minSize: number;
  maxSize: number;
  colors: THREE.Color[];
}

function createStarLayer(config: StarLayerConfig) {
  const positions = new Float32Array(config.count * 3);
  const colors = new Float32Array(config.count * 3);

  for (let i = 0; i < config.count; i++) {
    const i3 = i * 3;
    const radius = config.minRadius + Math.random() * (config.maxRadius - config.minRadius);
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);

    positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    positions[i3 + 2] = radius * Math.cos(phi);

    const color = config.colors[Math.floor(Math.random() * config.colors.length)];
    colors[i3] = color.r;
    colors[i3 + 1] = color.g;
    colors[i3 + 2] = color.b;
  }

  return { positions, colors };
}

function StarLayer({ config }: { config: StarLayerConfig }) {
  const ref = useRef<THREE.Points>(null);
  const { positions, colors } = useMemo(() => createStarLayer(config), []);
  const materialSize = useMemo(
    () => (config.minSize + config.maxSize) / 2,
    [config.minSize, config.maxSize]
  );

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={config.count}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={config.count}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={materialSize}
        vertexColors
        transparent
        opacity={0.9}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

function TwinklingStars() {
  const ref = useRef<THREE.Points>(null);
  const count = 15;

  const { positions, colors } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const colorPalette = [
      new THREE.Color('#ffffff'),
      new THREE.Color('#a0d0ff'),
      new THREE.Color('#ffd700'),
    ];

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const radius = 100 + Math.random() * 400;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      pos[i3] = radius * Math.sin(phi) * Math.cos(theta);
      pos[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      pos[i3 + 2] = radius * Math.cos(phi);

      const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
      col[i3] = color.r;
      col[i3 + 1] = color.g;
      col[i3 + 2] = color.b;
    }
    return { positions: pos, colors: col };
  }, []);

  useFrame(({ clock }) => {
    if (ref.current) {
      const material = ref.current.material as THREE.PointsMaterial;
      material.opacity = 0.6 + Math.sin(clock.elapsedTime * 2) * 0.4;
    }
  });

  return (
    <points ref={ref}>
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
      </bufferGeometry>
      <pointsMaterial
        size={2.5}
        vertexColors
        transparent
        opacity={0.8}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

export default function Starfield() {
  const farLayerConfig: StarLayerConfig = {
    count: 2500,
    minRadius: 500,
    maxRadius: 800,
    minSize: 0.1,
    maxSize: 0.3,
    colors: [
      new THREE.Color('#ffffff'),
      new THREE.Color('#e0e8ff'),
      new THREE.Color('#c0d0ff'),
    ],
  };

  const midLayerConfig: StarLayerConfig = {
    count: 1200,
    minRadius: 200,
    maxRadius: 400,
    minSize: 0.2,
    maxSize: 0.5,
    colors: [
      new THREE.Color('#ffffff'),
      new THREE.Color('#f0f4ff'),
      new THREE.Color('#d0e0ff'),
      new THREE.Color('#fffff0'),
    ],
  };

  const nearLayerConfig: StarLayerConfig = {
    count: 300,
    minRadius: 80,
    maxRadius: 150,
    minSize: 0.4,
    maxSize: 0.9,
    colors: [
      new THREE.Color('#ffffff'),
      new THREE.Color('#80b0ff'),
      new THREE.Color('#ffd060'),
      new THREE.Color('#ff9060'),
    ],
  };

  return (
    <group>
      <StarLayer config={farLayerConfig} />
      <StarLayer config={midLayerConfig} />
      <StarLayer config={nearLayerConfig} />
      <TwinklingStars />
    </group>
  );
}
