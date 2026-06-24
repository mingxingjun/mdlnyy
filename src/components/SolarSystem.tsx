import { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import Sun from './Sun';
import Planet from './Planet';
import Starfield from './Starfield';
import Nebula from './Nebula';
import WarpSpeed from './WarpSpeed';
import CameraController from './CameraController';
import { useNavigationStore } from '../store/useNavigationStore';
import { isWebGLAvailable } from '../lib/webglSupport';
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

  return (
    <>
      <fogExp2 attach="fog" args={['#000010', 0.003]} />

      <ambientLight intensity={0.15} color="#404080" />

      <OrbitControls
        makeDefault
        enablePan={false}
        minDistance={20}
        maxDistance={150}
        minPolarAngle={Math.PI * 0.2}
        maxPolarAngle={Math.PI * 0.6}
        enableDamping
        dampingFactor={0.05}
      />

      <CameraController />
      <WarpSpeed />

      <Starfield />
      <Nebula />

      <Sun />

      <Planet
        name="AI核星"
        description="AI智能核心引擎"
        position={[22, 0, 0]}
        size={2.2}
        texture={aiCoreTexture}
        color="#b040ff"
        emissiveColor="#7030ff"
        rotationSpeed={0.005}
        orbitRadius={22}
        hasLightning
        onSelect={() => handleWarpTo('/ai-engine')}
      />

      <Planet
        name="驾驶舱星"
        description="主控制台与导航中心"
        position={[-35, 0, 15]}
        size={2.5}
        texture={cockpitTexture}
        color="#00c8ff"
        emissiveColor="#0080ff"
        rotationSpeed={0.003}
        orbitRadius={38}
        hasCityLights
        onSelect={() => handleWarpTo('/dashboard')}
      />

      <Planet
        name="专注星"
        description="沉浸式专注工作区"
        position={[25, 0, -45]}
        size={2.0}
        texture={focusTexture}
        color="#ff8800"
        emissiveColor="#cc5500"
        rotationSpeed={0.004}
        hasRings
        ringColor="#ddbb88"
        orbitRadius={52}
        hasMoon
        onSelect={() => handleWarpTo('/flow-chamber')}
      />

      <Planet
        name="知识星"
        description="知识库与学习资源"
        position={[-40, 0, -55]}
        size={2.8}
        texture={knowledgeTexture}
        color="#44ddaa"
        emissiveColor="#22aa66"
        rotationSpeed={0.002}
        orbitRadius={68}
        cloudTexture={cloudTexture}
        onSelect={() => handleWarpTo('/my-notes')}
      />

      <EffectComposer>
        <Bloom
          luminanceThreshold={0.4}
          luminanceSmoothing={0.9}
          intensity={1.1}
          mipmapBlur
        />
        <Vignette offset={0.5} darkness={0.5} />
      </EffectComposer>
    </>
  );
}

export default function SolarSystem() {
  const webglSupported = useMemo(() => isWebGLAvailable(), []);

  if (!webglSupported) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-0 pointer-events-auto">
      <Canvas
        camera={{ position: [0, 35, 70], fov: 60, near: 0.5, far: 1000 }}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.2,
        }}
        dpr={[1, 1.5]}
        shadows
        style={{ background: '#000005' }}
      >
        <Scene />
      </Canvas>
    </div>
  );
}
