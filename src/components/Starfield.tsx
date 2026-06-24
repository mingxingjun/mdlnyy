import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function Starfield() {
  return (
    <group>
      <FarStars />
      <MidStars />
      <NearStars />
      <GalacticBand />
      <TwinkleStars />
    </group>
  );
}

function FarStars() {
  const ref = useRef<THREE.Points>(null);
  const count = 6000;

  const [positions, colors] = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const radius = 200 + Math.random() * 300;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = radius * Math.cos(phi);
      colors[i3] = 0.9 + Math.random() * 0.1;
      colors[i3 + 1] = 0.9 + Math.random() * 0.1;
      colors[i3 + 2] = 1.0;
    }
    return [positions, colors];
  }, []);

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.4}
        vertexColors
        transparent
        opacity={0.7}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

function MidStars() {
  const ref = useRef<THREE.Points>(null);
  const count = 2500;

  const [positions, colors] = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const radius = 80 + Math.random() * 100;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = radius * Math.cos(phi);
      const c = Math.random();
      if (c < 0.7) {
        colors[i3] = 1; colors[i3 + 1] = 1; colors[i3 + 2] = 1;
      } else if (c < 0.82) {
        colors[i3] = 0.8; colors[i3 + 1] = 0.9; colors[i3 + 2] = 1;
      } else if (c < 0.92) {
        colors[i3] = 1; colors[i3 + 1] = 0.95; colors[i3 + 2] = 0.8;
      } else {
        colors[i3] = 0.7; colors[i3 + 1] = 0.7; colors[i3 + 2] = 1;
      }
    }
    return [positions, colors];
  }, []);

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.6}
        vertexColors
        transparent
        opacity={0.85}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

function NearStars() {
  const ref = useRef<THREE.Points>(null);
  const count = 500;

  const [positions, colors] = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const radius = 40 + Math.random() * 50;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = radius * Math.cos(phi);
      const c = Math.random();
      if (c < 0.5) {
        colors[i3] = 1; colors[i3 + 1] = 1; colors[i3 + 2] = 1;
      } else if (c < 0.7) {
        colors[i3] = 0.7 + Math.random() * 0.3; colors[i3 + 1] = 0.85 + Math.random() * 0.15; colors[i3 + 2] = 1;
      } else if (c < 0.88) {
        colors[i3] = 1; colors[i3 + 1] = 0.85 + Math.random() * 0.15; colors[i3 + 2] = 0.6 + Math.random() * 0.2;
      } else {
        colors[i3] = 0.6 + Math.random() * 0.3; colors[i3 + 1] = 0.5 + Math.random() * 0.3; colors[i3 + 2] = 1;
      }
    }
    return [positions, colors];
  }, []);

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.9}
        vertexColors
        transparent
        opacity={0.95}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

function GalacticBand() {
  const ref = useRef<THREE.Points>(null);
  const count = 8000;

  const [positions, colors] = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const radius = 150 + Math.random() * 250;
      const angle = Math.random() * Math.PI * 2;
      const bandWidth = (Math.random() - 0.5) * 25;
      const tilt = 0.4;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = bandWidth + Math.sin(angle * 2) * 8;
      const rotatedX = x;
      const rotatedY = y * Math.cos(tilt) - z * Math.sin(tilt);
      const rotatedZ = y * Math.sin(tilt) + z * Math.cos(tilt);
      positions[i3] = rotatedX;
      positions[i3 + 1] = rotatedY;
      positions[i3 + 2] = rotatedZ;
      const c = Math.random();
      if (c < 0.4) {
        colors[i3] = 0.5 + Math.random() * 0.3; colors[i3 + 1] = 0.4 + Math.random() * 0.3; colors[i3 + 2] = 0.8 + Math.random() * 0.2;
      } else if (c < 0.7) {
        colors[i3] = 0.7 + Math.random() * 0.2; colors[i3 + 1] = 0.5 + Math.random() * 0.3; colors[i3 + 2] = 0.9;
      } else {
        colors[i3] = 0.9; colors[i3 + 1] = 0.8 + Math.random() * 0.2; colors[i3 + 2] = 0.7 + Math.random() * 0.2;
      }
    }
    return [positions, colors];
  }, []);

  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.002;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.5}
        vertexColors
        transparent
        opacity={0.35}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

function TwinkleStars() {
  const ref = useRef<THREE.Points>(null);
  const count = 30;

  const [positions, phases] = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const phases = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const radius = 60 + Math.random() * 80;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = radius * Math.cos(phi);
      phases[i] = Math.random() * Math.PI * 2;
    }
    return [positions, phases];
  }, []);

  const sizes = useMemo(() => {
    const s = new Float32Array(count);
    for (let i = 0; i < count; i++) s[i] = 1.5 + Math.random() * 1.5;
    return s;
  }, []);

  useFrame((state) => {
    if (!ref.current) return;
    const mat = ref.current.material as THREE.PointsMaterial;
    const t = state.clock.elapsedTime;
    mat.opacity = 0.6 + Math.sin(t * 1.5) * 0.3;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-size" args={[sizes, 1]} />
      </bufferGeometry>
      <pointsMaterial
        size={2}
        color="#ffffff"
        transparent
        opacity={0.9}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
