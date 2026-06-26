import { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useCursor, Html } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import * as THREE from 'three';

interface PlanetProps {
  size: number;
  texture: THREE.Texture;
  color: string;
  emissiveColor?: string;
  rotationSpeed?: number;
  orbitSpeed?: number;
  axisTilt?: number;
  orbitRadius?: number;
  orbitAngle?: number;
  hasRings?: boolean;
  ringColor?: string;
  name: string;
  description?: string;
  onSelect?: () => void;
  cloudTexture?: THREE.Texture;
  hasLightning?: boolean;
  hasCityLights?: boolean;
  hasMoon?: boolean;
}

const atmosphereVertexShader = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const atmosphereFragmentShader = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  uniform vec3 uColor;
  uniform float uPower;
  uniform float uOpacity;
  void main() {
    vec3 viewDir = normalize(cameraPosition - vPosition);
    float fresnel = pow(1.0 - max(dot(viewDir, vNormal), 0.0), uPower);
    float alpha = fresnel * uOpacity;
    vec3 col = uColor * (0.8 + fresnel * 2.0);
    gl_FragColor = vec4(col, alpha);
  }
`;

function hexToRgba(hex: string, alpha: number): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return `rgba(255,255,255,${alpha})`;
  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function generateLightningTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = 'rgba(0,0,0,0)';
  ctx.fillRect(0, 0, 256, 256);

  const drawBolt = (x1: number, y1: number, x2: number, y2: number, width: number, brightness: number, branches: number = 0) => {
    const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
    const alpha = brightness;
    gradient.addColorStop(0, `rgba(200,220,255,0)`);
    gradient.addColorStop(0.3, `rgba(180,200,255,${alpha})`);
    gradient.addColorStop(0.7, `rgba(220,240,255,${alpha})`);
    gradient.addColorStop(1, `rgba(200,220,255,0)`);

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    const segments = 8;
    const dx = (x2 - x1) / segments;
    const dy = (y2 - y1) / segments;
    for (let i = 1; i <= segments; i++) {
      const t = i / segments;
      ctx.lineTo(x1 + dx * i + (Math.random() - 0.5) * 20 * (1 - Math.abs(t - 0.5) * 2),
                 y1 + dy * i + (Math.random() - 0.5) * 20 * (1 - Math.abs(t - 0.5) * 2));
      if (branches > 0 && Math.random() > 0.6 && i > 1 && i < segments - 1) {
        const angle = (Math.random() - 0.5) * Math.PI * 0.8;
        const len = 30 + Math.random() * 40;
        drawBolt(x1 + dx * i, y1 + dy * i,
          x1 + dx * i + Math.cos(angle) * len, y1 + dy * i + Math.sin(angle) * len,
          width * 0.5, brightness * 0.6, branches - 1);
      }
    }
    ctx.strokeStyle = gradient;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.shadowColor = 'rgba(150,180,255,0.8)';
    ctx.shadowBlur = 15;
    ctx.stroke();
    ctx.shadowBlur = 0;
  };

  const endX = 80 + Math.random() * 96;
  const endY = 200 + Math.random() * 40;
  drawBolt(128, 20, endX, endY, 4, 1, 2);
  drawBolt(158, 30, endX + 20, endY - 10, 2, 0.7, 1);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function PlanetGlow({ color, size }: { color: string; size: number }) {
  const ref = useRef<THREE.Sprite>(null);
  const refOuter = useRef<THREE.Sprite>(null);
  const col = new THREE.Color(color);
  const material = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    const r = Math.floor(col.r * 255), g = Math.floor(col.g * 255), b = Math.floor(col.b * 255);
    gradient.addColorStop(0, `rgba(${r},${g},${b},0.7)`);
    gradient.addColorStop(0.2, `rgba(${r},${g},${b},0.35)`);
    gradient.addColorStop(0.5, `rgba(${r},${g},${b},0.12)`);
    gradient.addColorStop(0.8, `rgba(${r},${g},${b},0.03)`);
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 256);
    const texture = new THREE.CanvasTexture(canvas);
    return new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
  }, [color]);

  const outerMaterial = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    const r = Math.floor(col.r * 255), g = Math.floor(col.g * 255), b = Math.floor(col.b * 255);
    gradient.addColorStop(0, `rgba(${r},${g},${b},0.25)`);
    gradient.addColorStop(0.3, `rgba(${r},${g},${b},0.12)`);
    gradient.addColorStop(0.6, `rgba(${r},${g},${b},0.04)`);
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 256);
    const texture = new THREE.CanvasTexture(canvas);
    return new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
  }, [color]);

  useEffect(() => {
    return () => {
      material.map?.dispose?.();
      material.dispose();
      outerMaterial.map?.dispose?.();
      outerMaterial.dispose();
    };
  }, [material, outerMaterial]);

  useFrame((state) => {
    if (ref.current) {
      const t = state.clock.elapsedTime;
      const s = size * 3.2 + Math.sin(t * 0.8 + size) * size * 0.15;
      ref.current.scale.set(s, s, 1);
    }
    if (refOuter.current) {
      const t = state.clock.elapsedTime;
      const s = size * 6 + Math.sin(t * 0.4 + size) * size * 0.4;
      refOuter.current.scale.set(s, s, 1);
      (refOuter.current.material as THREE.SpriteMaterial).opacity = 0.6 + Math.sin(t * 0.6) * 0.15;
    }
  });

  return (
    <group>
      <sprite ref={refOuter} material={outerMaterial} />
      <sprite ref={ref} material={material} />
    </group>
  );
}

export default function Planet({
  size,
  texture,
  color,
  emissiveColor = '#000000',
  rotationSpeed = 0.003,
  orbitSpeed = 0.05,
  axisTilt = 0.15,
  orbitRadius = 0,
  orbitAngle = 0,
  hasRings = false,
  ringColor = '#aaaaaa',
  cloudTexture,
  name,
  description,
  onSelect,
  hasLightning = false,
  hasCityLights = false,
  hasMoon = false,
}: PlanetProps) {
  const pivotRef = useRef<THREE.Group>(null);
  const orbitAngleRef = useRef(orbitAngle);
  const groupRef = useRef<THREE.Group>(null);
  const planetRef = useRef<THREE.Mesh>(null);
  const atmosphereRef = useRef<THREE.Mesh>(null);
  const cloudsRef = useRef<THREE.Mesh>(null);
  const ringsInnerRef = useRef<THREE.Mesh>(null);
  const ringsOuterRef = useRef<THREE.Mesh>(null);
  const moonRef = useRef<THREE.Mesh>(null);
  const moonGroupRef = useRef<THREE.Group>(null);
  const lightningRef = useRef<THREE.Sprite>(null);
  const cityLightsRef = useRef<THREE.Points>(null);
  const [hovered, setHovered] = useState(false);

  useCursor(hovered);

  const hoverTarget = useRef({
    scale: 1,
    emissiveIntensity: 0.18,
    atmosphereScale: 1.18,
    atmosphereOpacity: 0.55,
  });

  const lightningState = useRef({
    nextLightningTime: 2 + Math.random() * 3,
    isFlashing: false,
    flashIntensity: 0,
    flashDuration: 0,
    currentTexture: null as THREE.CanvasTexture | null,
  });

  const planetMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    map: texture,
    roughness: 0.8,
    metalness: 0.1,
    emissive: emissiveColor,
    emissiveIntensity: 0.18,
  }), [texture, emissiveColor]);

  const atmosphereMaterial = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: atmosphereVertexShader,
    fragmentShader: atmosphereFragmentShader,
    uniforms: {
      uColor: { value: new THREE.Color(color) },
      uPower: { value: 3.0 },
      uOpacity: { value: 0.6 },
    },
    transparent: true,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide,
    depthWrite: false,
  }), [color]);

  const createRingMaterial = (inner: boolean) => {
    const ringCanvas = document.createElement('canvas');
    ringCanvas.width = 512;
    ringCanvas.height = 64;
    const ctx = ringCanvas.getContext('2d')!;
    const gradient = ctx.createLinearGradient(0, 0, 512, 0);
    if (inner) {
      gradient.addColorStop(0, 'rgba(0,0,0,0)');
      gradient.addColorStop(0.3, hexToRgba(ringColor, 0.4));
      gradient.addColorStop(0.5, hexToRgba(ringColor, 0.9));
      gradient.addColorStop(0.7, hexToRgba(ringColor, 0.7));
      gradient.addColorStop(1, hexToRgba(ringColor, 0.3));
    } else {
      gradient.addColorStop(0, hexToRgba(ringColor, 0.2));
      gradient.addColorStop(0.3, hexToRgba(ringColor, 0.35));
      gradient.addColorStop(0.5, hexToRgba(ringColor, 0.5));
      gradient.addColorStop(0.8, hexToRgba(ringColor, 0.2));
      gradient.addColorStop(1, 'rgba(0,0,0,0)');
    }
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 64);
    for (let i = 0; i < 150; i++) {
      ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.25})`;
      ctx.fillRect(Math.random() * 512, 0, 1 + Math.random() * 2, 64);
    }
    const ringTexture = new THREE.CanvasTexture(ringCanvas);
    ringTexture.colorSpace = THREE.SRGBColorSpace;
    return new THREE.MeshStandardMaterial({
      map: ringTexture,
      transparent: true,
      side: THREE.DoubleSide,
      roughness: 0.9,
      metalness: 0.05,
    });
  };

  const innerRingMaterial = useMemo(() => createRingMaterial(true), [ringColor]);
  const outerRingMaterial = useMemo(() => createRingMaterial(false), [ringColor]);

  const cloudMaterial = useMemo(() => {
    if (!cloudTexture) return null;
    return new THREE.MeshStandardMaterial({
      map: cloudTexture,
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
    });
  }, [cloudTexture]);

  const lightningMaterial = useMemo(() => {
    const tex = generateLightningTexture();
    lightningState.current.currentTexture = tex;
    return new THREE.SpriteMaterial({
      map: tex,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      color: new THREE.Color('#ccddff'),
    });
  }, []);

  const cityLightsGeometry = useMemo(() => {
    const lightCount = 120;
    const positions = new Float32Array(lightCount * 3);
    const colors = new Float32Array(lightCount * 3);
    const sizes = new Float32Array(lightCount);
    for (let i = 0; i < lightCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = size * 1.01;
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.cos(phi);
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
      if (Math.random() > 0.4) {
        colors[i * 3] = 1.0; colors[i * 3 + 1] = 0.85 + Math.random() * 0.1; colors[i * 3 + 2] = 0.5 + Math.random() * 0.2;
      } else {
        colors[i * 3] = 0.7 + Math.random() * 0.3; colors[i * 3 + 1] = 0.9; colors[i * 3 + 2] = 1.0;
      }
      sizes[i] = 0.08 + Math.random() * 0.12;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return geo;
  }, [size]);

  const cityLightsMaterial = useMemo(() => new THREE.PointsMaterial({
    size: 0.15,
    vertexColors: true,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  }), []);

  const moonMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#888899',
    roughness: 0.95,
    metalness: 0.05,
  }), []);

  useEffect(() => {
    return () => {
      planetMaterial.map?.dispose?.();
      planetMaterial.dispose();
      atmosphereMaterial.dispose();
      [innerRingMaterial, outerRingMaterial].forEach((m) => {
        m.map?.dispose?.();
        m.dispose();
      });
      cloudMaterial?.map?.dispose?.();
      cloudMaterial?.dispose();
      cityLightsGeometry.dispose();
      cityLightsMaterial.dispose();
      moonMaterial.dispose();
      lightningMaterial.map?.dispose?.();
      lightningMaterial.dispose();
      lightningState.current.currentTexture?.dispose();
    };
  }, [
    planetMaterial, atmosphereMaterial, innerRingMaterial, outerRingMaterial,
    cloudMaterial, cityLightsGeometry, cityLightsMaterial, moonMaterial, lightningMaterial,
  ]);

  useFrame((state, delta) => {
    const time = state.clock.elapsedTime;

    if (orbitRadius > 0 && pivotRef.current) {
      orbitAngleRef.current += delta * orbitSpeed;
      const x = Math.cos(orbitAngleRef.current) * orbitRadius;
      const z = Math.sin(orbitAngleRef.current) * orbitRadius;
      const y = Math.sin(orbitAngleRef.current * 2) * 0.5;
      pivotRef.current.position.set(x, y, z);
    }

    if (groupRef.current) {
      groupRef.current.rotation.z = axisTilt;
    }

    if (planetRef.current) planetRef.current.rotation.y += rotationSpeed * delta * 60;
    if (atmosphereRef.current) atmosphereRef.current.rotation.y += rotationSpeed * delta * 60;
    if (cloudsRef.current && cloudMaterial) {
      cloudsRef.current.rotation.y += rotationSpeed * 1.3 * delta * 60;
      cloudMaterial.opacity = 0.4 + Math.sin(time * 0.5) * 0.08;
    }
    if (ringsInnerRef.current) ringsInnerRef.current.rotation.z += rotationSpeed * 0.2 * delta * 60;
    if (ringsOuterRef.current) ringsOuterRef.current.rotation.z += rotationSpeed * 0.15 * delta * 60;
    if (moonGroupRef.current) moonGroupRef.current.rotation.y += rotationSpeed * 2.5 * delta * 60;
    if (moonRef.current) moonRef.current.rotation.y += rotationSpeed * 2 * delta * 60;

    if (hasLightning && lightningRef.current) {
      lightningState.current.nextLightningTime -= delta;
      if (lightningState.current.nextLightningTime <= 0 && !lightningState.current.isFlashing) {
        lightningState.current.isFlashing = true;
        lightningState.current.flashDuration = 0.15 + Math.random() * 0.1;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const r = size * 1.08;
        lightningRef.current.position.set(
          r * Math.sin(phi) * Math.cos(theta),
          r * Math.cos(phi),
          r * Math.sin(phi) * Math.sin(theta)
        );
        lightningRef.current.lookAt(0, 0, 0);
        lightningRef.current.scale.setScalar(size * 1.5);
        const newTexture = generateLightningTexture();
        lightningState.current.currentTexture?.dispose();
        lightningState.current.currentTexture = newTexture;
        (lightningRef.current.material as THREE.SpriteMaterial).map = newTexture;
      }
      if (lightningState.current.isFlashing) {
        lightningState.current.flashDuration -= delta;
        const fp = 1 - (lightningState.current.flashDuration / 0.2);
        lightningState.current.flashIntensity = fp < 0.2 ? fp / 0.2 : Math.max(0, 1 - (fp - 0.2) / 0.8);
        lightningState.current.flashIntensity *= 0.7 + Math.random() * 0.3;
        (lightningRef.current.material as THREE.SpriteMaterial).opacity = lightningState.current.flashIntensity;
        if (planetMaterial) {
          planetMaterial.emissiveIntensity = hoverTarget.current.emissiveIntensity + lightningState.current.flashIntensity;
        }
        if (lightningState.current.flashDuration <= 0) {
          lightningState.current.isFlashing = false;
          lightningState.current.nextLightningTime = 2 + Math.random() * 4;
          (lightningRef.current.material as THREE.SpriteMaterial).opacity = 0;
        }
      }
    }

    const target = hovered
      ? { scale: 1.12, emissiveIntensity: 0.7, atmosphereScale: 1.3, atmosphereOpacity: 0.9 }
      : { scale: 1, emissiveIntensity: 0.18, atmosphereScale: 1.18, atmosphereOpacity: 0.55 };
    const lerpFactor = 1 - Math.pow(0.001, delta);
    hoverTarget.current.scale = THREE.MathUtils.lerp(hoverTarget.current.scale, target.scale, lerpFactor);
    hoverTarget.current.emissiveIntensity = THREE.MathUtils.lerp(hoverTarget.current.emissiveIntensity, target.emissiveIntensity, lerpFactor);
    hoverTarget.current.atmosphereScale = THREE.MathUtils.lerp(hoverTarget.current.atmosphereScale, target.atmosphereScale, lerpFactor);
    hoverTarget.current.atmosphereOpacity = THREE.MathUtils.lerp(hoverTarget.current.atmosphereOpacity, target.atmosphereOpacity, lerpFactor);

    if (groupRef.current) {
      groupRef.current.scale.setScalar(hoverTarget.current.scale);
    }
    if (planetMaterial && !lightningState.current.isFlashing) {
      planetMaterial.emissiveIntensity = hoverTarget.current.emissiveIntensity;
    }
    if (atmosphereRef.current) {
      atmosphereRef.current.scale.setScalar(hoverTarget.current.atmosphereScale / 1.18);
    }
    if (atmosphereMaterial.uniforms) {
      atmosphereMaterial.uniforms.uOpacity.value = hoverTarget.current.atmosphereOpacity;
    }
  });

  return (
    <group ref={pivotRef}>
      <group ref={groupRef}>
        <PlanetGlow color={color} size={size} />
        <mesh
          ref={planetRef}
          material={planetMaterial}
          onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
          onPointerOut={(e) => { e.stopPropagation(); setHovered(false); }}
          onClick={(e) => { e.stopPropagation(); onSelect?.(); }}
        >
          <sphereGeometry args={[size, 48, 48]} />
        </mesh>
        <mesh ref={atmosphereRef} material={atmosphereMaterial} raycast={() => {}}>
          <sphereGeometry args={[size * 1.18, 32, 32]} />
        </mesh>
        {cloudMaterial && (
          <mesh ref={cloudsRef} material={cloudMaterial} raycast={() => {}}>
            <sphereGeometry args={[size * 1.1, 32, 32]} />
          </mesh>
        )}
        {hasRings && (
          <>
            <mesh ref={ringsInnerRef} material={innerRingMaterial} rotation={[0.3, 0, 0]}>
              <ringGeometry args={[size * 1.5, size * 1.95, 64]} />
            </mesh>
            <mesh ref={ringsOuterRef} material={outerRingMaterial} rotation={[0.3, 0, 0]}>
              <ringGeometry args={[size * 1.95, size * 2.6, 64]} />
            </mesh>
          </>
        )}
        {hasCityLights && (
          <points ref={cityLightsRef} geometry={cityLightsGeometry} material={cityLightsMaterial} />
        )}
        {hasLightning && <sprite ref={lightningRef} material={lightningMaterial} />}
        {hasMoon && (
          <group ref={moonGroupRef} rotation={[0.25, 0, 0]}>
            <mesh ref={moonRef} material={moonMaterial} position={[size * 3.5, 0.5, 0]}>
              <sphereGeometry args={[size * 0.22, 20, 20]} />
            </mesh>
          </group>
        )}
        <Html center distanceFactor={15} position={[0, size + 1.2, 0]} style={{ pointerEvents: 'none' }}>
          <AnimatePresence>
            {hovered && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.9 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                style={{
                  background: 'rgba(8, 15, 30, 0.92)',
                  backdropFilter: 'blur(12px)',
                  border: `1px solid ${color}70`,
                  boxShadow: `0 0 30px ${color}50`,
                  padding: '8px 16px',
                  borderRadius: '10px',
                  whiteSpace: 'nowrap',
                  textAlign: 'center',
                }}
              >
                <div style={{ color: '#ffffff', fontWeight: 'bold', fontSize: '15px', textShadow: `0 0 10px ${color}` }}>
                  {name}
                </div>
                {description && (
                  <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: '12px', marginTop: '2px' }}>
                    {description}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </Html>
      </group>
    </group>
  );
}
