import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const sunVertexShader = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec2 vUv;
  varying float vNoise;
  uniform float uTime;

  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute(permute(permute(
              i.z + vec4(0.0, i1.z, i2.z, 1.0))
            + i.y + vec4(0.0, i1.y, i2.y, 1.0))
            + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }

  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vPosition = position;

    float t = uTime * 0.15;
    float noise1 = snoise(position * 0.8 + vec3(t, t * 0.7, t * 0.5)) * 0.25;
    float noise2 = snoise(position * 2.0 + vec3(-t * 1.5, t * 1.2, -t * 0.8)) * 0.1;
    float noise3 = snoise(position * 4.0 + vec3(t * 2.0, -t * 1.8, t * 1.0)) * 0.05;
    vNoise = noise1 + noise2 + noise3;

    vec3 pos = position + normal * vNoise;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const sunFragmentShader = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec2 vUv;
  varying float vNoise;
  uniform float uTime;

  void main() {
    vec3 viewDir = normalize(cameraPosition - vPosition);
    float fresnel = pow(1.0 - max(dot(viewDir, vNormal), 0.0), 2.5);

    vec3 coreColor = vec3(1.0, 1.0, 0.94);
    vec3 midColor = vec3(1.0, 0.85, 0.3);
    vec3 edgeColor = vec3(1.0, 0.42, 0.0);

    float noiseFactor = vNoise * 2.0 + 0.5;
    float distFromCenter = length(vPosition) / 6.0;
    
    vec3 baseColor;
    if (distFromCenter < 0.7) {
      baseColor = mix(coreColor, midColor, (distFromCenter / 0.7));
    } else {
      baseColor = mix(midColor, edgeColor, (distFromCenter - 0.7) / 0.3);
    }

    float pulse = sin(uTime * 0.8) * 0.1 + 1.0;
    float flare = sin(uTime * 1.5 + vPosition.x * 0.5) * 0.1 + 1.0;
    baseColor *= (0.9 + noiseFactor * 0.4) * pulse * flare;
    baseColor += fresnel * vec3(1.0, 0.6, 0.2) * 1.3;

    float alpha = 1.0;
    gl_FragColor = vec4(baseColor, alpha);
  }
`;

const coronaVertexShader = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying float vIntensity;
  uniform float uTime;
  uniform float uPulse;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vPosition = position;

    vec3 pos = position;
    float noise = sin(pos.x * 3.0 + uTime * 0.5) * cos(pos.y * 3.0 + uTime * 0.3) * sin(pos.z * 3.0 + uTime * 0.4);
    float bigNoise = sin(pos.x * 1.5 + uTime * 0.3) * cos(pos.y * 2.0 + uTime * 0.2) * 0.5 + 0.5;
    pos += normal * noise * 0.3 * uPulse;
    pos += normal * bigNoise * 0.4 * uPulse;
    vIntensity = noise * 0.5 + bigNoise * 0.5 + 0.3;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const coronaFragmentShader = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying float vIntensity;
  uniform float uTime;
  uniform float uPulse;
  uniform vec3 uColor;
  uniform float uPower;

  void main() {
    vec3 viewDir = normalize(cameraPosition - vPosition);
    float fresnel = pow(1.0 - max(dot(viewDir, vNormal), 0.0), uPower);
    
    float alpha = fresnel * vIntensity * 0.6 * uPulse;
    vec3 color = uColor * (1.0 + fresnel * 1.5);

    float streamer = sin(atan(vPosition.y, vPosition.x) * 8.0 + uTime * 0.4) * 0.5 + 0.5;
    color += uColor * streamer * fresnel * 0.3;

    gl_FragColor = vec4(color, alpha);
  }
`;

const prominenceVertexShader = `
  attribute float aSize;
  attribute float aPhase;
  attribute float aSpeed;
  varying float vAlpha;
  uniform float uTime;

  void main() {
    float t = mod(uTime * aSpeed + aPhase, 1.0);
    vec3 pos = position;
    pos += normal * t * 3.0;
    vAlpha = (1.0 - t) * (1.0 - t);

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = aSize * (1.0 - t * 0.5) * (200.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const prominenceFragmentShader = `
  varying float vAlpha;
  uniform vec3 uColor;

  void main() {
    vec2 center = gl_PointCoord - vec2(0.5);
    float dist = length(center);
    if (dist > 0.5) discard;
    float glow = 1.0 - dist * 2.0;
    glow = pow(glow, 1.2);
    gl_FragColor = vec4(uColor * glow, glow * vAlpha * 0.8);
  }
`;

export default function Sun() {
  const coreRef = useRef<THREE.Mesh>(null);
  const innerCoronaRef = useRef<THREE.Mesh>(null);
  const outerCoronaRef = useRef<THREE.Mesh>(null);
  const outerCoronaRingRef = useRef<THREE.Mesh>(null);
  const prominencesRef = useRef<THREE.Points>(null);
  const lightRef = useRef<THREE.PointLight>(null);

  const sunMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: sunVertexShader,
      fragmentShader: sunFragmentShader,
      uniforms: {
        uTime: { value: 0 },
      },
    });
  }, []);

  const innerCoronaMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: coronaVertexShader,
      fragmentShader: coronaFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uPulse: { value: 1 },
        uColor: { value: new THREE.Color(0xff8833) },
        uPower: { value: 3.0 },
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
  }, []);

  const outerCoronaMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: coronaVertexShader,
      fragmentShader: coronaFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uPulse: { value: 1 },
        uColor: { value: new THREE.Color(0xffaa44) },
        uPower: { value: 4.0 },
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
  }, []);

  const outerCoronaRingMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: coronaVertexShader,
      fragmentShader: coronaFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uPulse: { value: 1 },
        uColor: { value: new THREE.Color(0xffcc66) },
        uPower: { value: 6.0 },
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
  }, []);

  const prominencesGeometry = useMemo(() => {
    const particleCount = 80;
    const positions = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    const phases = new Float32Array(particleCount);
    const speeds = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 6.5;

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.cos(phi);
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);

      sizes[i] = 2 + Math.random() * 4;
      phases[i] = Math.random();
      speeds[i] = 0.15 + Math.random() * 0.2;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
    geometry.setAttribute('aSpeed', new THREE.BufferAttribute(speeds, 1));

    return geometry;
  }, []);

  const prominencesMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color(0xffaa44) },
      },
      vertexShader: prominenceVertexShader,
      fragmentShader: prominenceFragmentShader,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
  }, []);

  useFrame((state, delta) => {
    const time = state.clock.elapsedTime;

    if (coreRef.current) {
      coreRef.current.rotation.y += delta * 0.08;
      coreRef.current.rotation.x += delta * 0.03;
      (coreRef.current.material as THREE.ShaderMaterial).uniforms.uTime.value = time;
    }

    const innerPulse = Math.sin(time * 0.6) * 0.2 + Math.sin(time * 1.2) * 0.1 + 1.0;
    const outerPulse = Math.sin(time * 0.4 + 1.0) * 0.25 + Math.sin(time * 0.9) * 0.1 + 1.0;

    if (innerCoronaRef.current) {
      innerCoronaRef.current.scale.setScalar(innerPulse * 1.02);
      (innerCoronaRef.current.material as THREE.ShaderMaterial).uniforms.uTime.value = time * 0.7;
      (innerCoronaRef.current.material as THREE.ShaderMaterial).uniforms.uPulse.value = innerPulse;
      innerCoronaRef.current.rotation.y += delta * 0.02;
    }

    if (outerCoronaRef.current) {
      outerCoronaRef.current.scale.setScalar(outerPulse * 1.05);
      (outerCoronaRef.current.material as THREE.ShaderMaterial).uniforms.uTime.value = time * 0.4;
      (outerCoronaRef.current.material as THREE.ShaderMaterial).uniforms.uPulse.value = outerPulse;
      outerCoronaRef.current.rotation.y -= delta * 0.01;
    }

    if (outerCoronaRingRef.current) {
      const ringPulse = Math.sin(time * 0.3 + 2.0) * 0.3 + Math.sin(time * 0.7) * 0.1 + 1.0;
      outerCoronaRingRef.current.scale.setScalar(ringPulse * 1.1);
      (outerCoronaRingRef.current.material as THREE.ShaderMaterial).uniforms.uTime.value = time * 0.25;
      (outerCoronaRingRef.current.material as THREE.ShaderMaterial).uniforms.uPulse.value = ringPulse;
      outerCoronaRingRef.current.rotation.y += delta * 0.005;
      outerCoronaRingRef.current.rotation.x = Math.sin(time * 0.2) * 0.15;
    }

    if (prominencesRef.current) {
      (prominencesRef.current.material as THREE.ShaderMaterial).uniforms.uTime.value = time;
    }

    if (lightRef.current) {
      const lightPulse = Math.sin(time * 0.8) * 0.4 + Math.sin(time * 1.5) * 0.2 + 3.5;
      lightRef.current.intensity = lightPulse;
    }
  });

  return (
    <group position={[0, 0, 0]}>
      <pointLight
        ref={lightRef}
        position={[0, 0, 0]}
        intensity={3.5}
        color="#fff5d0"
        distance={300}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />

      <mesh ref={coreRef} material={sunMaterial}>
        <sphereGeometry args={[6, 64, 64]} />
      </mesh>

      <mesh ref={innerCoronaRef} material={innerCoronaMaterial}>
        <sphereGeometry args={[7.5, 32, 32]} />
      </mesh>

      <mesh ref={outerCoronaRef} material={outerCoronaMaterial}>
        <sphereGeometry args={[10, 32, 32]} />
      </mesh>

      <mesh ref={outerCoronaRingRef} material={outerCoronaRingMaterial}>
        <sphereGeometry args={[12.5, 32, 32]} />
      </mesh>

      <points ref={prominencesRef} geometry={prominencesGeometry} material={prominencesMaterial} />
    </group>
  );
}
