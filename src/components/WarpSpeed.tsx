import { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useNavigationStore } from '../store/useNavigationStore';

const PARTICLE_COUNT = 250;
const STREAK_LENGTH = 80;
const BASE_SPEED = 250;

export default function WarpSpeed() {
  const lineRef = useRef<THREE.LineSegments>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const { camera } = useThree();
  const warpProgress = useNavigationStore((s) => s.warpProgress);
  const view = useNavigationStore((s) => s.view);

  const { positions, directions, lengths, baseSpeeds } = useMemo(() => {
    const positions = new Float32Array(PARTICLE_COUNT * 6);
    const directions = new Float32Array(PARTICLE_COUNT * 3);
    const lengths = new Float32Array(PARTICLE_COUNT);
    const baseSpeeds = new Float32Array(PARTICLE_COUNT);

    const forwardDir = new THREE.Vector3(0, 0, -1);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const theta = Math.random() * Math.PI * 2;
      const spread = 0.15 + Math.random() * 0.85;
      const phi = spread * Math.PI * 0.45;

      const cosP = Math.cos(phi);
      const sinP = Math.sin(phi);
      const x = sinP * Math.cos(theta);
      const y = sinP * Math.sin(theta);
      const z = -cosP;

      directions[i * 3] = x;
      directions[i * 3 + 1] = y;
      directions[i * 3 + 2] = z;

      lengths[i] = 2 + Math.random() * 6;
      baseSpeeds[i] = 0.5 + Math.random() * 1.0;

      for (let j = 0; j < 3; j++) {
        positions[i * 6 + j] = 0;
        positions[i * 6 + 3 + j] = 0;
      }
    }

    void forwardDir;
    return { positions, directions, lengths, baseSpeeds };
  }, []);

  const intensityCurve = useMemo(() => {
    return (t: number) => {
      if (t < 0.15) {
        return t / 0.15 * 0.2;
      } else if (t < 0.6) {
        const mid = (t - 0.15) / 0.45;
        return 0.2 + mid * 0.8;
      } else if (t < 0.85) {
        return 1.0;
      } else {
        return 1 - ((t - 0.85) / 0.15) * 0.9;
      }
    };
  }, []);

  const distsRef = useRef(new Float32Array(PARTICLE_COUNT));
  const initializedRef = useRef(false);
  const tempRight = useRef(new THREE.Vector3());
  const tempUp = useRef(new THREE.Vector3());
  const tempForward = useRef(new THREE.Vector3());
  const tempWorldDir = useRef(new THREE.Vector3());

  useFrame((state, delta) => {
    if (!lineRef.current || !glowRef.current) return;

    const isWarping = view === 'warping';
    const lineMat = lineRef.current.material as THREE.LineBasicMaterial;
    const glowMat = glowRef.current.material as THREE.MeshBasicMaterial;

    if (!initializedRef.current) {
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        distsRef.current[i] = Math.random() * STREAK_LENGTH;
      }
      initializedRef.current = true;
    }

    if (!isWarping) {
      lineMat.opacity = 0;
      glowMat.opacity = 0;
      return;
    }

    const intensity = intensityCurve(warpProgress);
    const speed = BASE_SPEED * intensity;
    const posAttr = lineRef.current.geometry.attributes.position as THREE.BufferAttribute;
    const posArray = posAttr.array as Float32Array;

    const camPos = camera.position;
    const camMat = camera.matrixWorld;
    camMat.extractBasis(tempRight.current, tempUp.current, tempForward.current);

    lineRef.current.position.copy(camPos);
    glowRef.current.position.copy(camPos);
    glowRef.current.position.addScaledVector(tempForward.current, 5);

    const streakLenMul = 0.5 + intensity * 2.5;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      distsRef.current[i] += delta * speed * baseSpeeds[i];
      if (distsRef.current[i] > STREAK_LENGTH) {
        distsRef.current[i] = 0;
      }

      const dist = distsRef.current[i];
      const dx = directions[i * 3];
      const dy = directions[i * 3 + 1];
      const dz = directions[i * 3 + 2];

      tempWorldDir.current.set(0, 0, 0);
      tempWorldDir.current.addScaledVector(tempRight.current, dx);
      tempWorldDir.current.addScaledVector(tempUp.current, dy);
      tempWorldDir.current.addScaledVector(tempForward.current, dz);

      const streakLen = lengths[i] * streakLenMul;
      const startDist = Math.max(0.5, dist);
      const endDist = startDist + streakLen;

      posArray[i * 6] = tempWorldDir.current.x * startDist;
      posArray[i * 6 + 1] = tempWorldDir.current.y * startDist;
      posArray[i * 6 + 2] = tempWorldDir.current.z * startDist;

      posArray[i * 6 + 3] = tempWorldDir.current.x * endDist;
      posArray[i * 6 + 4] = tempWorldDir.current.y * endDist;
      posArray[i * 6 + 5] = tempWorldDir.current.z * endDist;
    }

    posAttr.needsUpdate = true;

    lineMat.opacity = Math.min(1, intensity * 1.1);
    lineMat.transparent = true;

    const glowIntensity = Math.pow(intensity, 1.5);
    glowMat.opacity = Math.min(0.9, glowIntensity * 0.5);
    const glowScale = 1 + intensity * 6;
    glowRef.current.scale.set(glowScale, glowScale, glowScale);
  });

  return (
    <group>
      <lineSegments ref={lineRef} frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={PARTICLE_COUNT * 2}
            array={positions}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial
          color="#e0f0ff"
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </lineSegments>

      <mesh ref={glowRef} frustumCulled={false}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}
