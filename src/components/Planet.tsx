import { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useCursor, Html } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import * as THREE from 'three';

interface PlanetProps {
  position: [number, number, number];
  size: number;
  texture: THREE.Texture;
  color: string;
  emissiveColor?: string;
  rotationSpeed?: number;
  hasRings?: boolean;
  ringColor?: string;
  orbitRadius?: number;
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
    vec3 color = uColor * (0.5 + fresnel * 1.0);
    gl_FragColor = vec4(color, alpha);
  }
`;

function generateLightningTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = 'rgba(0,0,0,0)';
  ctx.fillRect(0, 0, 256, 256);

  const drawBolt = (
    x1: number, y1: number, x2: number, y2: number,
    width: number, brightness: number, branches: number = 0
  ) => {
    const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
    const alpha = Math.floor(brightness * 255).toString(16).padStart(2, '0');
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
      const px = x1 + dx * i + (Math.random() - 0.5) * 20 * (1 - Math.abs(t - 0.5) * 2);
      const py = y1 + dy * i + (Math.random() - 0.5) * 20 * (1 - Math.abs(t - 0.5) * 2);
      ctx.lineTo(px, py);

      if (branches > 0 && Math.random() > 0.6 && i > 1 && i < segments - 1) {
        const branchAngle = (Math.random() - 0.5) * Math.PI * 0.8;
        const branchLen = 30 + Math.random() * 40;
        drawBolt(
          px, py,
          px + Math.cos(branchAngle) * branchLen,
          py + Math.sin(branchAngle) * branchLen,
          width * 0.5, brightness * 0.6, branches - 1
        );
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

  const startX = 128;
  const startY = 20;
  const endX = 80 + Math.random() * 96;
  const endY = 200 + Math.random() * 40;

  drawBolt(startX, startY, endX, endY, 4, 1, 2);
  drawBolt(startX + 30, startY + 10, endX + 20, endY - 10, 2, 0.7, 1);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export default function Planet({
  position,
  size,
  texture,
  color,
  emissiveColor = '#000000',
  rotationSpeed = 0.003,
  hasRings = false,
  ringColor = '#aaaaaa',
  orbitRadius = 0,
  cloudTexture,
  name,
  description,
  onSelect,
  hasLightning = false,
  hasCityLights = false,
  hasMoon = false,
}: PlanetProps) {
  const groupRef = useRef<THREE.Group>(null);
  const planetRef = useRef<THREE.Mesh>(null);
  const atmosphereRef = useRef<THREE.Mesh>(null);
  const cloudsRef = useRef<THREE.Mesh>(null);
  const ringsInnerRef = useRef<THREE.Mesh>(null);
  const ringsOuterRef = useRef<THREE.Mesh>(null);
  const orbitRef = useRef<THREE.Mesh>(null);
  const moonRef = useRef<THREE.Mesh>(null);
  const moonGroupRef = useRef<THREE.Group>(null);
  const lightningRef = useRef<THREE.Sprite>(null);
  const cityLightsRef = useRef<THREE.Points>(null);
  const [hovered, setHovered] = useState(false);

  useCursor(hovered);

  const hoverTarget = useRef({
    scale: 1,
    emissiveIntensity: 0.2,
    atmosphereScale: 1.15,
    atmosphereOpacity: 0.6,
    orbitOpacity: 0.15,
  });

  const tempVec3 = useRef(new THREE.Vector3());

  const lightningState = useRef({
    nextLightningTime: 2 + Math.random() * 3,
    isFlashing: false,
    flashIntensity: 0,
    flashDuration: 0,
    currentTexture: null as THREE.CanvasTexture | null,
  });

  const planetMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.85,
      metalness: 0.15,
      emissive: emissiveColor,
      emissiveIntensity: 0.2,
    });
  }, [texture, emissiveColor]);

  const atmosphereMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
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
    });
  }, [color]);

  const createRingMaterial = (inner: boolean) => {
    const ringCanvas = document.createElement('canvas');
    ringCanvas.width = 512;
    ringCanvas.height = 64;
    const ctx = ringCanvas.getContext('2d')!;

    const gradient = ctx.createLinearGradient(0, 0, 512, 0);
    if (inner) {
      gradient.addColorStop(0, 'rgba(0,0,0,0)');
      gradient.addColorStop(0.3, ringColor + '60');
      gradient.addColorStop(0.5, ringColor + 'dd');
      gradient.addColorStop(0.7, ringColor + 'aa');
      gradient.addColorStop(1, ringColor + '40');
    } else {
      gradient.addColorStop(0, ringColor + '30');
      gradient.addColorStop(0.3, ringColor + '50');
      gradient.addColorStop(0.5, ringColor + '70');
      gradient.addColorStop(0.8, ringColor + '30');
      gradient.addColorStop(1, 'rgba(0,0,0,0)');
    }

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 64);

    for (let i = 0; i < 200; i++) {
      const x = Math.random() * 512;
      const w = 1 + Math.random() * 3;
      const a = Math.random() * 0.3;
      ctx.fillStyle = `rgba(255,255,255,${a})`;
      ctx.fillRect(x, 0, w, 64);
    }

    const ringTexture = new THREE.CanvasTexture(ringCanvas);
    ringTexture.colorSpace = THREE.SRGBColorSpace;

    return new THREE.MeshStandardMaterial({
      map: ringTexture,
      transparent: true,
      side: THREE.DoubleSide,
      roughness: 0.9,
      metalness: 0.1,
    });
  };

  const innerRingMaterial = useMemo(() => createRingMaterial(true), [ringColor]);
  const outerRingMaterial = useMemo(() => createRingMaterial(false), [ringColor]);

  const cloudMaterial = useMemo(() => {
    if (!cloudTexture) return null;
    return new THREE.MeshStandardMaterial({
      map: cloudTexture,
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
    });
  }, [cloudTexture]);

  const orbitMaterial = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.15,
      side: THREE.DoubleSide,
    });
  }, [color]);

  const lightningMaterial = useMemo(() => {
    return new THREE.SpriteMaterial({
      map: generateLightningTexture(),
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      color: new THREE.Color('#ccddff'),
    });
  }, []);

  const cityLightsGeometry = useMemo(() => {
    const lightCount = 150;
    const positions = new Float32Array(lightCount * 3);
    const colors = new Float32Array(lightCount * 3);
    const sizes = new Float32Array(lightCount);
    const phases = new Float32Array(lightCount);

    for (let i = 0; i < lightCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = size * 1.01;

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.cos(phi);
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);

      const useWarm = Math.random() > 0.4;
      if (useWarm) {
        colors[i * 3] = 1.0;
        colors[i * 3 + 1] = 0.85 + Math.random() * 0.1;
        colors[i * 3 + 2] = 0.5 + Math.random() * 0.2;
      } else {
        colors[i * 3] = 0.7 + Math.random() * 0.3;
        colors[i * 3 + 1] = 0.9 + Math.random() * 0.1;
        colors[i * 3 + 2] = 1.0;
      }

      sizes[i] = 0.08 + Math.random() * 0.12;
      phases[i] = Math.random() * Math.PI * 2;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('phase', new THREE.BufferAttribute(phases, 1));

    return geometry;
  }, [size]);

  const cityLightsMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        pixelRatio: { value: window.devicePixelRatio || 1 },
      },
      vertexShader: `
        attribute float size;
        attribute float phase;
        varying vec3 vColor;
        varying float vPhase;
        uniform float pixelRatio;
        void main() {
          vColor = color;
          vPhase = phase;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * pixelRatio * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vPhase;
        uniform float time;
        void main() {
          vec2 center = gl_PointCoord - vec2(0.5);
          float dist = length(center);
          if (dist > 0.5) discard;
          float glow = 1.0 - dist * 2.0;
          glow = pow(glow, 1.5);
          float flicker = 0.7 + 0.3 * sin(time * 2.0 + vPhase * 5.0);
          gl_FragColor = vec4(vColor * glow * flicker * 1.5, glow * 0.9);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      vertexColors: true,
    });
  }, []);

  const moonMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: '#888899',
      roughness: 0.9,
      metalness: 0.1,
    });
  }, []);

  useFrame((state, delta) => {
    const time = state.clock.elapsedTime;

    if (planetRef.current) {
      planetRef.current.rotation.y += rotationSpeed * delta * 60;
    }
    if (atmosphereRef.current) {
      atmosphereRef.current.rotation.y += rotationSpeed * delta * 60;
    }
    if (cloudsRef.current && cloudMaterial) {
      cloudsRef.current.rotation.y += rotationSpeed * 1.3 * delta * 60;
      const cloudPulse = 0.4 + Math.sin(time * 0.5) * 0.08 + Math.sin(time * 1.3) * 0.04;
      cloudMaterial.opacity = cloudPulse;
    }
    if (ringsInnerRef.current) {
      ringsInnerRef.current.rotation.z += rotationSpeed * 0.2 * delta * 60;
    }
    if (ringsOuterRef.current) {
      ringsOuterRef.current.rotation.z += rotationSpeed * 0.15 * delta * 60;
    }
    if (moonGroupRef.current) {
      moonGroupRef.current.rotation.y += rotationSpeed * 2.5 * delta * 60;
    }
    if (moonRef.current) {
      moonRef.current.rotation.y += rotationSpeed * 2 * delta * 60;
    }

    if (cityLightsRef.current && cityLightsMaterial.uniforms) {
      cityLightsMaterial.uniforms.time.value = time;
    }

    if (hasLightning && lightningRef.current) {
      lightningState.current.nextLightningTime -= delta;

      if (lightningState.current.nextLightningTime <= 0 && !lightningState.current.isFlashing) {
        lightningState.current.isFlashing = true;
        lightningState.current.flashDuration = 0.15 + Math.random() * 0.1;
        lightningState.current.flashIntensity = 0;

        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const r = size * 1.08;
        lightningRef.current.position.set(
          r * Math.sin(phi) * Math.cos(theta),
          r * Math.cos(phi),
          r * Math.sin(phi) * Math.sin(theta)
        );
        lightningRef.current.lookAt(0, 0, 0);
        lightningRef.current.scale.setScalar(size * 1.5 + Math.random() * 0.5);

        const newTexture = generateLightningTexture();
        if (lightningState.current.currentTexture) {
          lightningState.current.currentTexture.dispose();
        }
        lightningState.current.currentTexture = newTexture;
        (lightningRef.current.material as THREE.SpriteMaterial).map = newTexture;
      }

      if (lightningState.current.isFlashing) {
        lightningState.current.flashDuration -= delta;
        const flashProgress = 1 - (lightningState.current.flashDuration / 0.2);
        if (flashProgress < 0.2) {
          lightningState.current.flashIntensity = flashProgress / 0.2;
        } else {
          lightningState.current.flashIntensity = Math.max(0, 1 - (flashProgress - 0.2) / 0.8);
        }
        lightningState.current.flashIntensity *= (0.7 + Math.random() * 0.3);

        (lightningRef.current.material as THREE.SpriteMaterial).opacity = lightningState.current.flashIntensity;

        if (planetMaterial) {
          planetMaterial.emissiveIntensity = hoverTarget.current.emissiveIntensity + lightningState.current.flashIntensity * 1.3;
        }

        if (lightningState.current.flashDuration <= 0) {
          lightningState.current.isFlashing = false;
          lightningState.current.nextLightningTime = 2 + Math.random() * 3;
          (lightningRef.current.material as THREE.SpriteMaterial).opacity = 0;
        }
      }
    }

    const target = hovered
      ? {
          scale: 1.15,
          emissiveIntensity: 0.8,
          atmosphereScale: 1.25,
          atmosphereOpacity: 0.9,
          orbitOpacity: 0.4,
        }
      : {
          scale: 1,
          emissiveIntensity: 0.2,
          atmosphereScale: 1.15,
          atmosphereOpacity: 0.6,
          orbitOpacity: 0.15,
        };

    const lerpFactor = 1 - Math.pow(0.001, delta);

    hoverTarget.current.scale = THREE.MathUtils.lerp(hoverTarget.current.scale, target.scale, lerpFactor);
    hoverTarget.current.emissiveIntensity = THREE.MathUtils.lerp(hoverTarget.current.emissiveIntensity, target.emissiveIntensity, lerpFactor);
    hoverTarget.current.atmosphereScale = THREE.MathUtils.lerp(hoverTarget.current.atmosphereScale, target.atmosphereScale, lerpFactor);
    hoverTarget.current.atmosphereOpacity = THREE.MathUtils.lerp(hoverTarget.current.atmosphereOpacity, target.atmosphereOpacity, lerpFactor);
    hoverTarget.current.orbitOpacity = THREE.MathUtils.lerp(hoverTarget.current.orbitOpacity, target.orbitOpacity, lerpFactor);

    if (groupRef.current) {
      const s = hoverTarget.current.scale;
      tempVec3.current.set(s, s, s);
      groupRef.current.scale.lerp(tempVec3.current, lerpFactor);
    }

    if (planetMaterial && !lightningState.current.isFlashing) {
      planetMaterial.emissiveIntensity = hoverTarget.current.emissiveIntensity;
    }

    if (atmosphereRef.current) {
      const as = hoverTarget.current.atmosphereScale / 1.15;
      tempVec3.current.set(as, as, as);
      atmosphereRef.current.scale.lerp(tempVec3.current, lerpFactor);
    }

    if (atmosphereMaterial.uniforms) {
      atmosphereMaterial.uniforms.uOpacity.value = hoverTarget.current.atmosphereOpacity;
    }

    if (orbitMaterial) {
      orbitMaterial.opacity = hoverTarget.current.orbitOpacity;
    }
  });

  return (
    <group position={position}>
      {orbitRadius > 0 && orbitMaterial && (
        <mesh ref={orbitRef} rotation={[-Math.PI / 2, 0, 0]} material={orbitMaterial}>
          <ringGeometry args={[orbitRadius - 0.05, orbitRadius + 0.05, 64]} />
        </mesh>
      )}

      <group ref={groupRef}>
        <mesh
          ref={planetRef}
          material={planetMaterial}
          castShadow
          receiveShadow
          onPointerOver={(e) => {
            e.stopPropagation();
            setHovered(true);
          }}
          onPointerOut={(e) => {
            e.stopPropagation();
            setHovered(false);
          }}
          onClick={(e) => {
            e.stopPropagation();
            onSelect?.();
          }}
        >
          <sphereGeometry args={[size, 48, 48]} />
        </mesh>

        <mesh
          ref={atmosphereRef}
          material={atmosphereMaterial}
          raycast={() => {}}
        >
          <sphereGeometry args={[size * 1.15, 32, 32]} />
        </mesh>

        {cloudMaterial && (
          <mesh
            ref={cloudsRef}
            material={cloudMaterial}
            raycast={() => {}}
          >
            <sphereGeometry args={[size * 1.15, 32, 32]} />
          </mesh>
        )}

        {hasRings && (
          <>
            <mesh ref={ringsInnerRef} material={innerRingMaterial} rotation={[0.3, 0, 0]} receiveShadow>
              <ringGeometry args={[size * 1.4, size * 1.8, 64]} />
            </mesh>
            <mesh ref={ringsOuterRef} material={outerRingMaterial} rotation={[0.3, 0, 0]} receiveShadow>
              <ringGeometry args={[size * 1.8, size * 2.4, 64]} />
            </mesh>
          </>
        )}

        {hasCityLights && (
          <points ref={cityLightsRef} geometry={cityLightsGeometry} material={cityLightsMaterial} />
        )}

        {hasLightning && (
          <sprite ref={lightningRef} material={lightningMaterial} />
        )}

        {hasMoon && (
          <group ref={moonGroupRef} rotation={[0.2, 0, 0]}>
            <mesh ref={moonRef} material={moonMaterial} position={[6, 0.5, 0]} castShadow receiveShadow>
              <sphereGeometry args={[0.35, 24, 24]} />
            </mesh>
          </group>
        )}

        <Html
          center
          distanceFactor={15}
          position={[0, size + 1, 0]}
          style={{ pointerEvents: 'none' }}
        >
          <AnimatePresence>
            {hovered && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.9 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                style={{
                  background: 'rgba(10, 20, 40, 0.9)',
                  backdropFilter: 'blur(10px)',
                  border: `1px solid ${color}80`,
                  boxShadow: `0 0 20px ${color}`,
                  padding: '6px 12px',
                  borderRadius: '8px',
                  whiteSpace: 'nowrap',
                  textAlign: 'center',
                }}
              >
                <div style={{ color: '#ffffff', fontWeight: 'bold', fontSize: '14px' }}>
                  {name}
                </div>
                {description && (
                  <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '11px', marginTop: '2px' }}>
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
