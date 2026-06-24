import { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface Comet {
  active: boolean;
  startTime: number;
  duration: number;
  from: THREE.Vector3;
  to: THREE.Vector3;
  trailLength: number;
}

export default function Comets() {
  const trailRef = useRef<THREE.Points>(null);
  const nucleusRef = useRef<THREE.Mesh>(null);
  const [comet, setComet] = useState<Comet>(() => spawnComet(3));

  const trailCount = 80;

  const trailGeometry = useMemo(() => {
    const positions = new Float32Array(trailCount * 3);
    const alphas = new Float32Array(trailCount);
    const sizes = new Float32Array(trailCount);
    for (let i = 0; i < trailCount; i++) {
      alphas[i] = 0;
      sizes[i] = 0;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('alpha', new THREE.BufferAttribute(alphas, 1));
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    return geo;
  }, []);

  const trailMaterial = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(0x88ccff) },
    },
    vertexShader: `
      attribute float alpha;
      attribute float size;
      varying float vAlpha;
      void main() {
        vAlpha = alpha;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = size * (300.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      varying float vAlpha;
      uniform vec3 uColor;
      void main() {
        vec2 center = gl_PointCoord - vec2(0.5);
        float dist = length(center);
        if (dist > 0.5) discard;
        float glow = 1.0 - dist * 2.0;
        glow = pow(glow, 1.2);
        gl_FragColor = vec4(uColor * glow * 1.5, glow * vAlpha);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }), []);

  const nucleusMaterial = useMemo(() => new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
  }), []);

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    if (!comet.active) {
      if (time > comet.startTime) {
        setComet(spawnComet(time + 8 + Math.random() * 15));
      }
      if (nucleusRef.current) nucleusRef.current.visible = false;
      return;
    }

    const elapsed = time - comet.startTime;
    const progress = Math.min(elapsed / comet.duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3);
    const currentPos = new THREE.Vector3().lerpVectors(comet.from, comet.to, ease);

    if (nucleusRef.current) {
      nucleusRef.current.visible = true;
      nucleusRef.current.position.copy(currentPos);
      const scale = 0.3 + Math.sin(progress * Math.PI) * 0.2;
      nucleusRef.current.scale.setScalar(scale);
      nucleusMaterial.opacity = Math.sin(progress * Math.PI);
    }

    const posArr = trailGeometry.attributes.position.array as Float32Array;
    const alphaArr = trailGeometry.attributes.alpha.array as Float32Array;
    const sizeArr = trailGeometry.attributes.size.array as Float32Array;

    const dirToSun = currentPos.clone().normalize();
    for (let i = trailCount - 1; i > 0; i--) {
      posArr[i * 3] = posArr[(i - 1) * 3];
      posArr[i * 3 + 1] = posArr[(i - 1) * 3 + 1];
      posArr[i * 3 + 2] = posArr[(i - 1) * 3 + 2];
      alphaArr[i] = alphaArr[i - 1] * 0.92;
      sizeArr[i] = sizeArr[i - 1] * 0.95;
    }
    const tailOffset = dirToSun.multiplyScalar(-2 - progress * 6);
    posArr[0] = currentPos.x + tailOffset.x * 0.3;
    posArr[1] = currentPos.y + tailOffset.y * 0.3;
    posArr[2] = currentPos.z + tailOffset.z * 0.3;
    alphaArr[0] = 0.9;
    sizeArr[0] = 1.5;

    trailGeometry.attributes.position.needsUpdate = true;
    trailGeometry.attributes.alpha.needsUpdate = true;
    trailGeometry.attributes.size.needsUpdate = true;

    if (progress >= 1) {
      setComet(spawnComet(time + 10 + Math.random() * 20));
    }
  });

  return (
    <group>
      <points ref={trailRef} geometry={trailGeometry} material={trailMaterial} />
      <mesh ref={nucleusRef} material={nucleusMaterial}>
        <sphereGeometry args={[0.3, 8, 8]} />
      </mesh>
    </group>
  );
}

function spawnComet(startTime: number): Comet {
  const angle1 = Math.random() * Math.PI * 2;
  const angle2 = Math.random() * Math.PI * 2;
  const r1 = 80 + Math.random() * 30;
  const r2 = 80 + Math.random() * 30;
  const from = new THREE.Vector3(
    Math.cos(angle1) * r1,
    (Math.random() - 0.5) * 30,
    Math.sin(angle1) * r1
  );
  const to = new THREE.Vector3(
    Math.cos(angle2) * r2,
    (Math.random() - 0.5) * 30,
    Math.sin(angle2) * r2
  );
  return {
    active: true,
    startTime,
    duration: 3 + Math.random() * 3,
    from,
    to,
    trailLength: 80,
  };
}
