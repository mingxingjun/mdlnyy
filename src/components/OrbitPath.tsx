import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface OrbitPathProps {
  radius: number;
  color: string;
  opacity?: number;
}

export default function OrbitPath({ radius, color, opacity = 0.12 }: OrbitPathProps) {
  const ref = useRef<THREE.Line>(null);

  const geometry = useMemo(() => {
    const points: THREE.Vector3[] = [];
    const segments = 128;
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      points.push(new THREE.Vector3(Math.cos(angle) * radius, Math.sin(angle * 2) * 0.3, Math.sin(angle) * radius));
    }
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    return geo;
  }, [radius]);

  const material = useMemo(() => new THREE.LineBasicMaterial({
    color: color,
    transparent: true,
    opacity: opacity,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }), [color, opacity]);

  const line = useMemo(() => new THREE.Line(geometry, material), [geometry, material]);

  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  useFrame((state) => {
    if (ref.current) {
      const pulse = 0.5 + Math.sin(state.clock.elapsedTime * 0.8 + radius * 0.1) * 0.3;
      (ref.current.material as THREE.LineBasicMaterial).opacity = opacity * pulse;
    }
  });

  return <primitive object={line} ref={ref} />;
}
