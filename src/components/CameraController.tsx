import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useNavigationStore } from '../store/useNavigationStore';

const GALAXY_CAMERA_POS = new THREE.Vector3(0, 30, 65);
const GALAXY_TARGET = new THREE.Vector3(0, 0, 0);
const WARP_DURATION = 1.4;

interface PlanetConfig {
  cameraEnd: THREE.Vector3;
  targetPos: THREE.Vector3;
}

const PLANET_CONFIGS: Record<string, PlanetConfig> = {
  '/ai-engine': {
    cameraEnd: new THREE.Vector3(28, 10, 15),
    targetPos: new THREE.Vector3(22, 0, 0),
  },
  '/dashboard': {
    cameraEnd: new THREE.Vector3(-42, 12, 30),
    targetPos: new THREE.Vector3(-35, 0, 15),
  },
  '/flow-chamber': {
    cameraEnd: new THREE.Vector3(32, 10, -38),
    targetPos: new THREE.Vector3(25, 0, -45),
  },
  '/my-notes': {
    cameraEnd: new THREE.Vector3(-50, 15, -48),
    targetPos: new THREE.Vector3(-40, 0, -55),
  },
};

function easeInExpo(t: number): number {
  return t === 0 ? 0 : Math.pow(2, 10 * t - 10);
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function easeInOutExpo(t: number): number {
  if (t === 0) return 0;
  if (t === 1) return 1;
  if (t < 0.5) return Math.pow(2, 20 * t - 10) / 2;
  return (2 - Math.pow(2, -20 * t + 10)) / 2;
}

function getWarpIntensity(t: number): number {
  if (t < 0.15) return easeInExpo(t / 0.15) * 0.3;
  if (t < 0.45) return 0.3 + easeOutCubic((t - 0.15) / 0.3) * 0.7;
  if (t < 0.75) return 1.0;
  return Math.pow(1 - (t - 0.75) / 0.25, 2);
}

type OrbitControlsLike = {
  enabled: boolean;
  minDistance: number;
  maxDistance: number;
  target: THREE.Vector3;
  update: () => void;
  autoRotate?: boolean;
  autoRotateSpeed?: number;
};

export default function CameraController() {
  const { camera, controls, gl } = useThree();
  const orbitControls = controls as unknown as OrbitControlsLike | null;

  const view = useNavigationStore((s) => s.view);
  const targetPlanet = useNavigationStore((s) => s.targetPlanet);
  const isReturning = useNavigationStore((s) => s.isReturning);
  const setWarpProgress = useNavigationStore((s) => s.setWarpProgress);
  const setView = useNavigationStore((s) => s.setView);

  const warpTimeRef = useRef(0);
  const startPosRef = useRef(new THREE.Vector3());
  const endPosRef = useRef(new THREE.Vector3());
  const startTargetRef = useRef(new THREE.Vector3());
  const endTargetRef = useRef(new THREE.Vector3());
  const currentTargetRef = useRef(new THREE.Vector3());
  const isWarpingRef = useRef(false);
  const viewRef = useRef(view);
  const targetRef = useRef(targetPlanet);
  const returningRef = useRef(isReturning);
  const lastActivityRef = useRef(0);
  const isAutoRotatingRef = useRef(false);

  useEffect(() => {
    const onActivity = () => {
      lastActivityRef.current = performance.now();
      if (isAutoRotatingRef.current && orbitControls) {
        orbitControls.autoRotate = false;
        isAutoRotatingRef.current = false;
      }
    };
    gl.domElement.addEventListener('pointermove', onActivity);
    gl.domElement.addEventListener('pointerdown', onActivity);
    gl.domElement.addEventListener('wheel', onActivity);
    return () => {
      gl.domElement.removeEventListener('pointermove', onActivity);
      gl.domElement.removeEventListener('pointerdown', onActivity);
      gl.domElement.removeEventListener('wheel', onActivity);
    };
  }, [gl, orbitControls]);

  useEffect(() => {
    viewRef.current = view;
    targetRef.current = targetPlanet;
    returningRef.current = isReturning;

    if (view === 'warping' && !isWarpingRef.current) {
      isWarpingRef.current = true;
      warpTimeRef.current = 0;
      startPosRef.current.copy(camera.position);

      if (orbitControls) {
        startTargetRef.current.copy(orbitControls.target);
      } else {
        startTargetRef.current.set(0, 0, 0);
      }

      if (isReturning) {
        endPosRef.current.copy(GALAXY_CAMERA_POS);
        endTargetRef.current.copy(GALAXY_TARGET);
      } else if (targetPlanet && PLANET_CONFIGS[targetPlanet]) {
        const config = PLANET_CONFIGS[targetPlanet];
        endPosRef.current.copy(config.cameraEnd);
        endTargetRef.current.copy(config.targetPos);
      }
    }
  }, [view, targetPlanet, isReturning, camera, orbitControls]);

  useEffect(() => {
    if (isWarpingRef.current) return;

    if (view === 'galaxy') {
      camera.position.copy(GALAXY_CAMERA_POS);
      if (orbitControls) {
        orbitControls.target.copy(GALAXY_TARGET);
        orbitControls.enabled = true;
        orbitControls.minDistance = 25;
        orbitControls.maxDistance = 140;
        orbitControls.autoRotate = false;
        orbitControls.update();
      }
    } else if (view === 'planet' && targetPlanet && PLANET_CONFIGS[targetPlanet]) {
      const config = PLANET_CONFIGS[targetPlanet];
      camera.position.copy(config.cameraEnd);
      if (orbitControls) {
        orbitControls.target.copy(config.targetPos);
        orbitControls.enabled = true;
        orbitControls.minDistance = 6;
        orbitControls.maxDistance = 35;
        orbitControls.autoRotate = false;
        orbitControls.update();
      }
    }
  }, [view, targetPlanet, camera, orbitControls]);

  useFrame((state, delta) => {
    const now = performance.now();

    if (isWarpingRef.current && viewRef.current === 'warping') {
      warpTimeRef.current += delta;
      const t = Math.min(1, warpTimeRef.current / WARP_DURATION);
      const easedT = easeInOutExpo(t);
      const intensity = getWarpIntensity(t);

      const displayProgress = returningRef.current ? 1 - t : t;
      setWarpProgress(displayProgress);

      camera.position.lerpVectors(startPosRef.current, endPosRef.current, easedT);

      if (orbitControls) {
        orbitControls.enabled = false;
        currentTargetRef.current.lerpVectors(
          startTargetRef.current,
          endTargetRef.current,
          easedT
        );
        orbitControls.target.copy(currentTargetRef.current);
        camera.lookAt(currentTargetRef.current);
        orbitControls.update();
      } else {
        camera.lookAt(endTargetRef.current);
      }

      void intensity;

      if (t >= 1) {
        isWarpingRef.current = false;
        camera.position.copy(endPosRef.current);

        if (orbitControls) {
          orbitControls.target.copy(endTargetRef.current);
          orbitControls.enabled = true;

          if (returningRef.current) {
            orbitControls.minDistance = 25;
            orbitControls.maxDistance = 140;
          } else {
            orbitControls.minDistance = 6;
            orbitControls.maxDistance = 35;
          }
          orbitControls.update();
        }

        setView(returningRef.current ? 'galaxy' : 'planet');
        lastActivityRef.current = now;
      }
      return;
    }

    if (viewRef.current === 'galaxy' && orbitControls && !isWarpingRef.current) {
      const inactiveTime = now - lastActivityRef.current;
      if (inactiveTime > 25000 && !isAutoRotatingRef.current) {
        orbitControls.autoRotate = true;
        orbitControls.autoRotateSpeed = 0.3;
        isAutoRotatingRef.current = true;
      }
    }
  });

  return null;
}
