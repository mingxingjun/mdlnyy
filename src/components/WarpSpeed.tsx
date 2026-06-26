import { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useNavigationStore } from '../store/useNavigationStore';

const PARTICLE_COUNT = 800;
const STREAK_LENGTH = 120;
const BASE_SPEED = 400;

export default function WarpSpeed() {
  const lineRef = useRef<THREE.LineSegments>(null);
  const coreGlowRef = useRef<THREE.Mesh>(null);
  const outerGlowRef = useRef<THREE.Mesh>(null);
  const tunnelRingRef = useRef<THREE.Mesh>(null);
  const { camera } = useThree();
  const warpProgress = useNavigationStore((s) => s.warpProgress);
  const view = useNavigationStore((s) => s.view);

  const { positions, directions, lengths, baseSpeeds } = useMemo(() => {
    const positions = new Float32Array(PARTICLE_COUNT * 6);
    const directions = new Float32Array(PARTICLE_COUNT * 3);
    const lengths = new Float32Array(PARTICLE_COUNT);
    const baseSpeeds = new Float32Array(PARTICLE_COUNT);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const theta = Math.random() * Math.PI * 2;
      const spread = Math.pow(Math.random(), 0.7);
      const phi = spread * Math.PI * 0.48;

      const cosP = Math.cos(phi);
      const sinP = Math.sin(phi);
      directions[i * 3] = sinP * Math.cos(theta);
      directions[i * 3 + 1] = sinP * Math.sin(theta);
      directions[i * 3 + 2] = -cosP;

      lengths[i] = 3 + Math.random() * 12;
      baseSpeeds[i] = 0.4 + Math.random() * 1.2;
    }
    return { positions, directions, lengths, baseSpeeds };
  }, []);

  const tunnelMaterial = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    const grad = ctx.createRadialGradient(128, 32, 0, 128, 32, 128);
    grad.addColorStop(0, 'rgba(150,200,255,0.9)');
    grad.addColorStop(0.3, 'rgba(100,150,255,0.5)');
    grad.addColorStop(0.6, 'rgba(80,100,200,0.2)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 64);
    const tex = new THREE.CanvasTexture(canvas);
    return new THREE.MeshBasicMaterial({
      map: tex,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
  }, []);

  useEffect(() => {
    return () => {
      tunnelMaterial.map?.dispose?.();
      tunnelMaterial.dispose();
    };
  }, [tunnelMaterial]);

  const intensityCurve = useMemo(() => {
    return (t: number) => {
      if (t < 0.1) return Math.pow(t / 0.1, 3) * 0.3;
      if (t < 0.5) return 0.3 + ((t - 0.1) / 0.4) * 0.7;
      if (t < 0.8) return 1.0;
      return Math.pow(1 - (t - 0.8) / 0.2, 2.5);
    };
  }, []);

  const distsRef = useRef(new Float32Array(PARTICLE_COUNT));
  const initializedRef = useRef(false);
  const tempRight = useRef(new THREE.Vector3());
  const tempUp = useRef(new THREE.Vector3());
  const tempForward = useRef(new THREE.Vector3());
  const tempWorldDir = useRef(new THREE.Vector3());

  useFrame((state, delta) => {
    if (!lineRef.current || !coreGlowRef.current || !outerGlowRef.current || !tunnelRingRef.current) return;

    const isWarping = view === 'warping';
    const lineMat = lineRef.current.material as THREE.LineBasicMaterial;
    const coreMat = coreGlowRef.current.material as THREE.MeshBasicMaterial;
    const outerMat = outerGlowRef.current.material as THREE.MeshBasicMaterial;
    const tunnelMat = tunnelRingRef.current.material as THREE.MeshBasicMaterial;

    if (!initializedRef.current) {
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        distsRef.current[i] = Math.random() * STREAK_LENGTH;
      }
      initializedRef.current = true;
    }

    if (!isWarping) {
      lineMat.opacity = 0;
      coreMat.opacity = 0;
      outerMat.opacity = 0;
      tunnelMat.opacity = 0;
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
    coreGlowRef.current.position.copy(camPos);
    outerGlowRef.current.position.copy(camPos);
    tunnelRingRef.current.position.copy(camPos);
    coreGlowRef.current.position.addScaledVector(tempForward.current, 8);
    outerGlowRef.current.position.addScaledVector(tempForward.current, 15);
    tunnelRingRef.current.position.addScaledVector(tempForward.current, 20);
    tunnelRingRef.current.lookAt(camPos);

    const streakLenMul = 0.3 + intensity * 4.0;
    const colorShift = Math.min(1, intensity * 1.5);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      distsRef.current[i] += delta * speed * baseSpeeds[i];
      if (distsRef.current[i] > STREAK_LENGTH) distsRef.current[i] = 0;

      const dist = distsRef.current[i];
      const dx = directions[i * 3];
      const dy = directions[i * 3 + 1];
      const dz = directions[i * 3 + 2];

      tempWorldDir.current.set(0, 0, 0);
      tempWorldDir.current.addScaledVector(tempRight.current, dx);
      tempWorldDir.current.addScaledVector(tempUp.current, dy);
      tempWorldDir.current.addScaledVector(tempForward.current, dz);

      const streakLen = lengths[i] * streakLenMul;
      const startDist = Math.max(1, dist);
      const endDist = startDist + streakLen;

      posArray[i * 6] = tempWorldDir.current.x * startDist;
      posArray[i * 6 + 1] = tempWorldDir.current.y * startDist;
      posArray[i * 6 + 2] = tempWorldDir.current.z * startDist;
      posArray[i * 6 + 3] = tempWorldDir.current.x * endDist;
      posArray[i * 6 + 4] = tempWorldDir.current.y * endDist;
      posArray[i * 6 + 5] = tempWorldDir.current.z * endDist;
    }
    posAttr.needsUpdate = true;

    lineMat.opacity = Math.min(1, intensity * 1.2);
    lineMat.color.setRGB(
      0.85 + colorShift * 0.15,
      0.9 + colorShift * 0.1,
      1.0
    );

    const coreIntensity = Math.pow(intensity, 1.2);
    coreMat.opacity = coreIntensity * 0.9;
    const coreScale = 1 + intensity * 8;
    coreGlowRef.current.scale.set(coreScale, coreScale, coreScale);
    coreMat.color.setRGB(1, 0.95, 0.9);

    const outerIntensity = Math.pow(intensity, 1.6);
    outerMat.opacity = outerIntensity * 0.4;
    const outerScale = 1 + intensity * 18;
    outerGlowRef.current.scale.set(outerScale, outerScale, outerScale);
    outerMat.color.setRGB(0.7, 0.85, 1);

    tunnelMat.opacity = intensity * 0.6;
    const tunnelScale = 2 + intensity * 25;
    tunnelRingRef.current.scale.set(tunnelScale, tunnelScale, 1);
    tunnelRingRef.current.rotation.z += delta * 3 * intensity;
  });

  return (
    <group>
      <lineSegments ref={lineRef} frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={PARTICLE_COUNT * 2} array={positions} itemSize={3} />
        </bufferGeometry>
        <lineBasicMaterial color="#e8f2ff" transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </lineSegments>

      <mesh ref={coreGlowRef} frustumCulled={false}>
        <sphereGeometry args={[1, 24, 24]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>

      <mesh ref={outerGlowRef} frustumCulled={false}>
        <sphereGeometry args={[1, 24, 24]} />
        <meshBasicMaterial color="#88bbff" transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>

      <mesh ref={tunnelRingRef} frustumCulled={false} material={tunnelMaterial}>
        <ringGeometry args={[0.3, 1, 48]} />
      </mesh>
    </group>
  );
}
