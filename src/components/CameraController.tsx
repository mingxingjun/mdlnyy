import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useNavigationStore } from '../store/useNavigationStore';

const GALAXY_CAMERA_POS = new THREE.Vector3(0, 35, 70);
const GALAXY_TARGET = new THREE.Vector3(0, 0, 0);
const WARP_DURATION = 1.8;

interface PlanetConfig {
  cameraEnd: THREE.Vector3;
  targetPos: THREE.Vector3;
}

const PLANET_CONFIGS: Record<string, PlanetConfig> = {
  '/ai-engine': {
    cameraEnd: new THREE.Vector3(22, 8, 12),
    targetPos: new THREE.Vector3(22, 0, 0),
  },
  '/dashboard': {
    cameraEnd: new THREE.Vector3(-35, 10, 25),
    targetPos: new THREE.Vector3(-35, 0, 15),
  },
  '/flow-chamber': {
    cameraEnd: new THREE.Vector3(25, 8, -35),
    targetPos: new THREE.Vector3(25, 0, -45),
  },
  '/my-notes': {
    cameraEnd: new THREE.Vector3(-40, 12, -42),
    targetPos: new THREE.Vector3(-40, 0, -55),
  },
};

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function getWarpIntensity(t: number): number {
  if (t < 0.2) {
    return (t / 0.2) * 0.3;
  } else if (t < 0.7) {
    const mid = (t - 0.2) / 0.5;
    return 0.3 + mid * 0.7;
  } else {
    return 1 - ((t - 0.7) / 0.3) * 0.95;
  }
}

type OrbitControlsLike = {
  enabled: boolean;
  minDistance: number;
  maxDistance: number;
  target: THREE.Vector3;
  update: () => void;
};

export default function CameraController() {
  const { camera, controls } = useThree();
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
        orbitControls.minDistance = 20;
        orbitControls.maxDistance = 150;
        orbitControls.update();
      }
    } else if (view === 'planet' && targetPlanet && PLANET_CONFIGS[targetPlanet]) {
      const config = PLANET_CONFIGS[targetPlanet];
      camera.position.copy(config.cameraEnd);
      if (orbitControls) {
        orbitControls.target.copy(config.targetPos);
        orbitControls.enabled = true;
        orbitControls.minDistance = 5;
        orbitControls.maxDistance = 30;
        orbitControls.update();
      }
    }
  }, [view, targetPlanet, camera, orbitControls]);

  useFrame((_, delta) => {
    if (!isWarpingRef.current || viewRef.current !== 'warping') {
      return;
    }

    warpTimeRef.current += delta;
    const t = Math.min(1, warpTimeRef.current / WARP_DURATION);
    const easedT = easeInOutCubic(t);
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
          orbitControls.minDistance = 20;
          orbitControls.maxDistance = 150;
        } else {
          orbitControls.minDistance = 5;
          orbitControls.maxDistance = 30;
        }
        orbitControls.update();
      }

      setView(returningRef.current ? 'galaxy' : 'planet');
    }
  });

  return null;
}
