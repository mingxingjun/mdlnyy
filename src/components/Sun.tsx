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
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }

  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vPosition = position;

    float t = uTime * 0.2;
    float noise1 = snoise(position * 0.8 + vec3(t, t * 0.7, t * 0.5)) * 0.3;
    float noise2 = snoise(position * 2.0 + vec3(-t * 1.5, t * 1.2, -t * 0.8)) * 0.12;
    float noise3 = snoise(position * 4.0 + vec3(t * 2.0, -t * 1.8, t * 1.0)) * 0.06;
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
    float fresnel = pow(1.0 - max(dot(viewDir, vNormal), 0.0), 3.0);

    vec3 coreColor = vec3(1.0, 1.0, 0.98);
    vec3 midColor = vec3(1.0, 0.9, 0.5);
    vec3 edgeColor = vec3(1.0, 0.5, 0.1);

    float noiseFactor = vNoise * 2.5 + 0.6;
    float distFromCenter = length(vPosition) / 6.0;

    vec3 baseColor;
    if (distFromCenter < 0.75) {
      baseColor = mix(coreColor, midColor, smoothstep(0.0, 0.75, distFromCenter));
    } else {
      baseColor = mix(midColor, edgeColor, smoothstep(0.75, 1.0, distFromCenter));
    }

    float slowPulse = sin(uTime * 0.5) * 0.15 + 1.0;
    float fastFlare = sin(uTime * 2.0 + vPosition.x * 0.8 + vPosition.y * 0.6) * 0.15 + 1.0;
    float bigFlare = pow(sin(uTime * 0.3 + vPosition.x * 0.2) * 0.5 + 0.5, 4.0) * 0.4;
    baseColor *= (0.9 + noiseFactor * 0.5) * slowPulse * fastFlare;
    baseColor += bigFlare * vec3(1.0, 0.8, 0.3);
    baseColor += fresnel * vec3(1.0, 0.7, 0.3) * 1.8;

    gl_FragColor = vec4(baseColor, 1.0);
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
    float noise = sin(pos.x * 2.0 + uTime * 0.6) * cos(pos.y * 2.5 + uTime * 0.4) * sin(pos.z * 2.2 + uTime * 0.5);
    float bigNoise = sin(pos.x * 1.0 + uTime * 0.3) * cos(pos.y * 1.5 + uTime * 0.2) * 0.5 + 0.5;
    float streamers = sin(atan(pos.y, pos.x) * 12.0 + uTime * 0.5) * 0.5 + 0.5;
    pos += normal * noise * 0.5 * uPulse;
    pos += normal * bigNoise * 0.7 * uPulse;
    pos += normal * streamers * 0.4 * uPulse;
    vIntensity = noise * 0.4 + bigNoise * 0.6 + streamers * 0.3;

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
  uniform float uOpacity;

  void main() {
    vec3 viewDir = normalize(cameraPosition - vPosition);
    float fresnel = pow(1.0 - max(dot(viewDir, vNormal), 0.0), uPower);

    float alpha = fresnel * vIntensity * uOpacity * uPulse;
    vec3 color = uColor * (1.0 + fresnel * 2.0);

    float streamer = sin(atan(vPosition.y, vPosition.x) * 16.0 + uTime * 0.6) * 0.5 + 0.5;
    color += uColor * streamer * fresnel * 0.4;

    gl_FragColor = vec4(color, alpha);
  }
`;

const prominenceVertexShader = `
  attribute float aSize;
  attribute float aPhase;
  attribute float aSpeed;
  attribute float aAngle;
  varying float vAlpha;
  varying float vLife;
  uniform float uTime;

  void main() {
    float t = mod(uTime * aSpeed + aPhase, 1.0);
    vLife = t;
    vec3 pos = position;
    float angle = aAngle + uTime * aSpeed * 0.3;
    vec3 tangent = normalize(cross(pos, vec3(0.0, 1.0, 0.0)));
    vec3 up = normalize(cross(tangent, pos));
    pos += normal * t * 4.5;
    pos += tangent * sin(t * 6.0 + aPhase) * t * 0.8;
    pos += up * cos(t * 5.0 + aPhase) * t * 0.5;
    vAlpha = pow(1.0 - t, 1.5);

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = aSize * (1.0 + t * 0.5) * (250.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const prominenceFragmentShader = `
  varying float vAlpha;
  varying float vLife;
  uniform vec3 uColor;

  void main() {
    vec2 center = gl_PointCoord - vec2(0.5);
    float dist = length(center);
    if (dist > 0.5) discard;
    float glow = 1.0 - dist * 2.0;
    glow = pow(glow, 1.0);
    vec3 col = mix(uColor, vec3(1.0, 0.95, 0.8), vLife * 0.5);
    gl_FragColor = vec4(col * glow, glow * vAlpha * 0.9);
  }
`;

function SunGlowSprite() {
  const ref = useRef<THREE.Sprite>(null);
  const refOuter = useRef<THREE.Sprite>(null);
  const material = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    const gradient = ctx.createRadialGradient(256, 256, 0, 256, 256, 256);
    gradient.addColorStop(0, 'rgba(255,245,210,1)');
    gradient.addColorStop(0.1, 'rgba(255,220,140,0.9)');
    gradient.addColorStop(0.25, 'rgba(255,170,70,0.55)');
    gradient.addColorStop(0.5, 'rgba(255,110,30,0.25)');
    gradient.addColorStop(0.75, 'rgba(255,70,15,0.08)');
    gradient.addColorStop(1, 'rgba(255,40,0,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 512);
    const texture = new THREE.CanvasTexture(canvas);
    return new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      color: 0xffffff,
    });
  }, []);

  const outerMaterial = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    const gradient = ctx.createRadialGradient(256, 256, 0, 256, 256, 256);
    gradient.addColorStop(0, 'rgba(255,180,100,0.3)');
    gradient.addColorStop(0.2, 'rgba(255,140,60,0.2)');
    gradient.addColorStop(0.5, 'rgba(255,90,20,0.08)');
    gradient.addColorStop(0.8, 'rgba(255,60,10,0.02)');
    gradient.addColorStop(1, 'rgba(255,40,0,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 512);
    const texture = new THREE.CanvasTexture(canvas);
    return new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      color: 0xfff0d0,
    });
  }, []);

  useFrame((state) => {
    if (ref.current) {
      const t = state.clock.elapsedTime;
      const scale = 30 + Math.sin(t * 0.5) * 2;
      ref.current.scale.set(scale, scale, 1);
      (ref.current.material as THREE.SpriteMaterial).opacity = 0.95 + Math.sin(t * 0.7) * 0.05;
    }
    if (refOuter.current) {
      const t = state.clock.elapsedTime;
      const scale = 70 + Math.sin(t * 0.3) * 5;
      refOuter.current.scale.set(scale, scale, 1);
      (refOuter.current.material as THREE.SpriteMaterial).opacity = 0.5 + Math.sin(t * 0.4) * 0.15;
    }
  });

  return (
    <group>
      <sprite ref={refOuter} material={outerMaterial} position={[0, 0, 0]} />
      <sprite ref={ref} material={material} position={[0, 0, 0]} />
    </group>
  );
}

export default function Sun() {
  const coreRef = useRef<THREE.Mesh>(null);
  const innerCoronaRef = useRef<THREE.Mesh>(null);
  const midCoronaRef = useRef<THREE.Mesh>(null);
  const outerCoronaRef = useRef<THREE.Mesh>(null);
  const outerCoronaRingRef = useRef<THREE.Mesh>(null);
  const prominencesRef = useRef<THREE.Points>(null);
  const lightRef = useRef<THREE.PointLight>(null);

  const sunMaterial = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: sunVertexShader,
    fragmentShader: sunFragmentShader,
    uniforms: { uTime: { value: 0 } },
  }), []);

  const coronaMat = (color: THREE.Color, power: number, opacity: number) =>
    new THREE.ShaderMaterial({
      vertexShader: coronaVertexShader,
      fragmentShader: coronaFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uPulse: { value: 1 },
        uColor: { value: color },
        uPower: { value: power },
        uOpacity: { value: opacity },
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

  const innerCoronaMaterial = useMemo(() => coronaMat(new THREE.Color(0xff9944), 2.5, 0.9), []);
  const midCoronaMaterial = useMemo(() => coronaMat(new THREE.Color(0xffaa55), 3.5, 0.7), []);
  const outerCoronaMaterial = useMemo(() => coronaMat(new THREE.Color(0xffcc77), 5.0, 0.5), []);
  const outerCoronaRingMaterial = useMemo(() => coronaMat(new THREE.Color(0xffdd99), 7.0, 0.3), []);

  const prominencesGeometry = useMemo(() => {
    const particleCount = 120;
    const positions = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    const phases = new Float32Array(particleCount);
    const speeds = new Float32Array(particleCount);
    const angles = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 6.2;
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.cos(phi);
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
      sizes[i] = 1.5 + Math.random() * 3.5;
      phases[i] = Math.random();
      speeds[i] = 0.1 + Math.random() * 0.18;
      angles[i] = Math.random() * Math.PI * 2;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
    geometry.setAttribute('aSpeed', new THREE.BufferAttribute(speeds, 1));
    geometry.setAttribute('aAngle', new THREE.BufferAttribute(angles, 1));
    return geometry;
  }, []);

  const prominencesMaterial = useMemo(() => new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uColor: { value: new THREE.Color(0xffcc77) } },
    vertexShader: prominenceVertexShader,
    fragmentShader: prominenceFragmentShader,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }), []);

  useFrame((state, delta) => {
    const time = state.clock.elapsedTime;

    if (coreRef.current) {
      coreRef.current.rotation.y += delta * 0.1;
      coreRef.current.rotation.x += delta * 0.04;
      (coreRef.current.material as THREE.ShaderMaterial).uniforms.uTime.value = time;
    }

    const innerPulse = Math.sin(time * 0.6) * 0.25 + Math.sin(time * 1.3) * 0.12 + 1.0;
    const midPulse = Math.sin(time * 0.45 + 0.8) * 0.3 + Math.sin(time * 1.0) * 0.15 + 1.0;
    const outerPulse = Math.sin(time * 0.35 + 1.5) * 0.35 + Math.sin(time * 0.8) * 0.12 + 1.0;

    const updateCorona = (ref: React.RefObject<THREE.Mesh>, mat: THREE.ShaderMaterial, scale: number, rotSpeed: number, tiltAmount: number = 0) => {
      if (!ref.current) return;
      ref.current.scale.setScalar(scale);
      mat.uniforms.uTime.value = time * (0.3 + Math.random() * 0.01);
      ref.current.rotation.y += delta * rotSpeed;
      if (tiltAmount) ref.current.rotation.x = Math.sin(time * 0.25) * tiltAmount;
    };

    updateCorona(innerCoronaRef, innerCoronaMaterial as THREE.ShaderMaterial, innerPulse * 1.04, 0.03);
    (innerCoronaRef.current?.material as THREE.ShaderMaterial)?.uniforms.uPulse && (
      (innerCoronaRef.current!.material as THREE.ShaderMaterial).uniforms.uPulse.value = innerPulse
    );
    updateCorona(midCoronaRef, midCoronaMaterial as THREE.ShaderMaterial, midPulse * 1.08, -0.02);
    (midCoronaRef.current?.material as THREE.ShaderMaterial)?.uniforms.uPulse && (
      (midCoronaRef.current!.material as THREE.ShaderMaterial).uniforms.uPulse.value = midPulse
    );
    updateCorona(outerCoronaRef, outerCoronaMaterial as THREE.ShaderMaterial, outerPulse * 1.15, 0.01, 0.1);
    (outerCoronaRef.current?.material as THREE.ShaderMaterial)?.uniforms.uPulse && (
      (outerCoronaRef.current!.material as THREE.ShaderMaterial).uniforms.uPulse.value = outerPulse
    );

    if (outerCoronaRingRef.current) {
      const ringPulse = Math.sin(time * 0.25 + 2.0) * 0.4 + Math.sin(time * 0.6) * 0.15 + 1.0;
      outerCoronaRingRef.current.scale.setScalar(ringPulse * 1.25);
      (outerCoronaRingRef.current.material as THREE.ShaderMaterial).uniforms.uTime.value = time * 0.2;
      (outerCoronaRingRef.current.material as THREE.ShaderMaterial).uniforms.uPulse.value = ringPulse;
      outerCoronaRingRef.current.rotation.y += delta * 0.008;
      outerCoronaRingRef.current.rotation.x = Math.sin(time * 0.18) * 0.2;
      outerCoronaRingRef.current.rotation.z = Math.cos(time * 0.15) * 0.12;
    }

    if (prominencesRef.current) {
      (prominencesRef.current.material as THREE.ShaderMaterial).uniforms.uTime.value = time;
    }

    if (lightRef.current) {
      const lightPulse = Math.sin(time * 0.7) * 0.5 + Math.sin(time * 1.8) * 0.3 + 4.0;
      lightRef.current.intensity = lightPulse;
    }
  });

  return (
    <group position={[0, 0, 0]}>
      <SunGlowSprite />
      <pointLight
        ref={lightRef}
        position={[0, 0, 0]}
        intensity={4.0}
        color="#fff8e0"
        distance={400}
      />

      <mesh ref={coreRef} material={sunMaterial}>
        <sphereGeometry args={[6, 64, 64]} />
      </mesh>

      <mesh ref={innerCoronaRef} material={innerCoronaMaterial}>
        <sphereGeometry args={[8, 48, 48]} />
      </mesh>

      <mesh ref={midCoronaRef} material={midCoronaMaterial}>
        <sphereGeometry args={[11, 40, 40]} />
      </mesh>

      <mesh ref={outerCoronaRef} material={outerCoronaMaterial}>
        <sphereGeometry args={[16, 32, 32]} />
      </mesh>

      <mesh ref={outerCoronaRingRef} material={outerCoronaRingMaterial}>
        <sphereGeometry args={[22, 32, 32]} />
      </mesh>

      <points ref={prominencesRef} geometry={prominencesGeometry} material={prominencesMaterial} />
    </group>
  );
}
