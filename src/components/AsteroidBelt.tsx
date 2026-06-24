import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface AsteroidBeltProps {
  innerRadius?: number;
  outerRadius?: number;
  count?: number;
}

export default function AsteroidBelt({
  innerRadius = 42,
  outerRadius = 50,
  count = 1200,
}: AsteroidBeltProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const asteroids = useMemo(() => {
    const data = [];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radiusDist = Math.random();
      const beltZones = [
        { inner: innerRadius, outer: innerRadius + 2, density: 0.6 },
        { inner: innerRadius + 3, outer: outerRadius - 2, density: 1.0 },
        { inner: outerRadius - 2, outer: outerRadius, density: 0.4 },
      ];
      let radius = innerRadius + radiusDist * (outerRadius - innerRadius);
      const zonePick = Math.random();
      if (zonePick < 0.3) {
        radius = beltZones[0].inner + Math.random() * (beltZones[0].outer - beltZones[0].inner);
      } else if (zonePick < 0.85) {
        radius = beltZones[1].inner + Math.random() * (beltZones[1].outer - beltZones[1].inner);
      } else {
        radius = beltZones[2].inner + Math.random() * (beltZones[2].outer - beltZones[2].inner);
      }

      data.push({
        angle,
        radius,
        incline: (Math.random() - 0.5) * 0.15,
        size: 0.08 + Math.random() * 0.25,
        rotX: Math.random() * Math.PI,
        rotY: Math.random() * Math.PI,
        rotZ: Math.random() * Math.PI,
        rotSpeed: (Math.random() - 0.5) * 0.8,
        orbitSpeed: 0.02 + Math.random() * 0.03,
        color: new THREE.Color().setHSL(0.08 + Math.random() * 0.08, 0.1 + Math.random() * 0.2, 0.3 + Math.random() * 0.3),
      });
    }
    return data;
  }, [count, innerRadius, outerRadius]);

  const geometry = useMemo(() => {
    const geo = new THREE.IcosahedronGeometry(1, 0);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      pos.setXYZ(
        i,
        pos.getX(i) + (Math.random() - 0.5) * 0.3,
        pos.getY(i) + (Math.random() - 0.5) * 0.3,
        pos.getZ(i) + (Math.random() - 0.5) * 0.3
      );
    }
    geo.computeVertexNormals();
    return geo;
  }, []);

  const material = useMemo(() => new THREE.MeshStandardMaterial({
    roughness: 0.9,
    metalness: 0.2,
    vertexColors: false,
  }), []);

  useFrame((_, delta) => {
    if (!meshRef.current) return;

    for (let i = 0; i < asteroids.length; i++) {
      const a = asteroids[i];
      a.angle += delta * a.orbitSpeed;
      a.rotX += delta * a.rotSpeed;
      a.rotY += delta * a.rotSpeed * 0.7;
      a.rotZ += delta * a.rotSpeed * 0.5;

      const x = Math.cos(a.angle) * a.radius;
      const z = Math.sin(a.angle) * a.radius;
      const y = Math.sin(a.angle * 2) * a.incline * a.radius * 0.3;

      dummy.position.set(x, y, z);
      dummy.rotation.set(a.rotX, a.rotY, a.rotZ);
      dummy.scale.setScalar(a.size);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
      meshRef.current.setColorAt(i, a.color);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, count]}
      castShadow={false}
      receiveShadow={false}
    />
  );
}
