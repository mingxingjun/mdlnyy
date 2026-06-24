import { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import Sun from './Sun';
import Planet from './Planet';
import Starfield from './Starfield';
import Nebula from './Nebula';
import WarpSpeed from './WarpSpeed';
import CameraController from './CameraController';
import OrbitPath from './OrbitPath';
import AsteroidBelt from './AsteroidBelt';
import { useNavigationStore } from '../store/useNavigationStore';
import {
  generateEnergyTexture,
  generateTechTexture,
  generateDesertTexture,
  generateLifeTexture,
  generateCloudTexture,
} from '../lib/planetTextures';

function Scene() {
  const warpTo = useNavigationStore((s) => s.warpTo);

  const handleWarpTo = (planetPath: string) => {
    warpTo(planetPath, true);
  };

  const aiCoreTexture = useMemo(() => generateEnergyTexture(), []);
  const cockpitTexture = useMemo(() => generateTechTexture(), []);
  const focusTexture = useMemo(() => generateDesertTexture(), []);
  const knowledgeTexture = useMemo(() => generateLifeTexture(), []);
  const cloudTexture = useMemo(() => generateCloudTexture(), []);

  const planets = [
    {
      name: 'AI核星',
      description: 'AI智能核心引擎',
      radius: 22,
      angle: 0,
      size: 2.2,
      texture: aiCoreTexture,
      color: '#b040ff',
      emissiveColor: '#7030ff',
      rotationSpeed: 0.005,
      orbitSpeed: 0.08,
      axisTilt: 0.1,
      hasLightning: true,
      path: '/ai-engine',
    },
    {
      name: '驾驶舱星',
      description: '主控制台与导航中心',
      radius: 38,
      angle: Math.PI * 0.4,
      size: 2.5,
      texture: cockpitTexture,
      color: '#00c8ff',
      emissiveColor: '#0080ff',
      rotationSpeed: 0.003,
      orbitSpeed: 0.05,
      axisTilt: 0.2,
      hasCityLights: true,
      path: '/dashboard',
    },
    {
      name: '专注星',
      description: '沉浸式专注工作区',
      radius: 52,
      angle: Math.PI * 1.2,
      size: 2.0,
      texture: focusTexture,
      color: '#ff8800',
      emissiveColor: '#cc5500',
      rotationSpeed: 0.004,
      orbitSpeed: 0.035,
      axisTilt: 0.18,
      hasRings: true,
      ringColor: '#ddbb88',
      hasMoon: true,
      path: '/flow-chamber',
    },
    {
      name: '知识星',
      description: '知识库与学习资源',
      radius: 68,
      angle: Math.PI * 1.6,
      size: 2.8,
      texture: knowledgeTexture,
      color: '#44ddaa',
      emissiveColor: '#22aa66',
      rotationSpeed: 0.002,
      orbitSpeed: 0.025,
      axisTilt: 0.25,
      cloudTexture: cloudTexture,
      path: '/my-notes',
    },
  ];

  return (
    <>
      <ambientLight intensity={0.18} color="#5050a0" />

      <OrbitControls
        makeDefault
        enablePan={false}
        minDistance={18}
        maxDistance={180}
        minPolarAngle={Math.PI * 0.15}
        maxPolarAngle={Math.PI * 0.65}
        enableDamping
        dampingFactor={0.06}
        rotateSpeed={0.6}
      />

      <CameraController />
      <WarpSpeed />

      <Starfield />
      <Nebula />

      {planets.map((p, i) => (
        <OrbitPath
          key={`orbit-${i}`}
          radius={p.radius}
          color={p.color}
        />
      ))}

      <Sun />

      <AsteroidBelt innerRadius={28} outerRadius={34} />

      {planets.map((p) => (
        <Planet
          key={p.name}
          name={p.name}
          description={p.description}
          size={p.size}
          texture={p.texture}
          color={p.color}
          emissiveColor={p.emissiveColor}
          rotationSpeed={p.rotationSpeed}
          orbitSpeed={p.orbitSpeed}
          axisTilt={p.axisTilt}
          orbitRadius={p.radius}
          orbitAngle={p.angle}
          hasRings={p.hasRings}
          ringColor={p.ringColor}
          cloudTexture={p.cloudTexture}
          hasLightning={p.hasLightning}
          hasCityLights={p.hasCityLights}
          hasMoon={p.hasMoon}
          onSelect={() => handleWarpTo(p.path)}
        />
      ))}
    </>
  );
}

export default function SolarSystem() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-auto">
      <Canvas
        camera={{ position: [0, 40, 85], fov: 60, near: 0.5, far: 1000 }}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.4,
          powerPreference: 'high-performance',
          failIfMajorPerformanceCaveat: false,
        }}
        dpr={[1, 1.5]}
        style={{ background: '#000005' }}
      >
        <Scene />
      </Canvas>
    </div>
  );
}
