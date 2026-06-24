import * as THREE from "three";

const TEXTURE_WIDTH = 512;
const TEXTURE_HEIGHT = 256;

function random(): number {
  return Math.random();
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function smoothstep(t: number): number {
  return t * t * (3 - 2 * t);
}

function fade(t: number): number {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

function hash(x: number, y: number, seed: number = 0): number {
  let h = x * 374761393 + y * 668265263 + seed * 1013904223;
  h = (h ^ (h >> 13)) * 1274126177;
  return ((h ^ (h >> 16)) & 0x7fffffff) / 0x7fffffff;
}

function valueNoise(x: number, y: number, seed: number = 0): number {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const x1 = x0 + 1;
  const y1 = y0 + 1;
  const fx = fade(x - x0);
  const fy = fade(y - y0);

  const v00 = hash(x0, y0, seed);
  const v10 = hash(x1, y0, seed);
  const v01 = hash(x0, y1, seed);
  const v11 = hash(x1, y1, seed);

  const vx0 = lerp(v00, v10, fx);
  const vx1 = lerp(v01, v11, fx);
  return lerp(vx0, vx1, fy);
}

function fbm(x: number, y: number, octaves: number = 4, seed: number = 0): number {
  let value = 0;
  let amplitude = 1;
  let frequency = 1;
  let maxValue = 0;

  for (let i = 0; i < octaves; i++) {
    value += amplitude * valueNoise(x * frequency, y * frequency, seed + i * 100);
    maxValue += amplitude;
    amplitude *= 0.5;
    frequency *= 2;
  }

  return value / maxValue;
}

function createCanvas(): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement("canvas");
  canvas.width = TEXTURE_WIDTH;
  canvas.height = TEXTURE_HEIGHT;
  const ctx = canvas.getContext("2d")!;
  return { canvas, ctx };
}

function createTexture(canvas: HTMLCanvasElement): THREE.CanvasTexture {
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
}

function lerpColor(
  c1: { r: number; g: number; b: number },
  c2: { r: number; g: number; b: number },
  t: number
): { r: number; g: number; b: number } {
  return {
    r: Math.round(lerp(c1.r, c2.r, t)),
    g: Math.round(lerp(c1.g, c2.g, t)),
    b: Math.round(lerp(c1.b, c2.b, t)),
  };
}

export function generateTechTexture(): THREE.CanvasTexture {
  const { canvas, ctx } = createCanvas();
  const imageData = ctx.createImageData(TEXTURE_WIDTH, TEXTURE_HEIGHT);
  const data = imageData.data;

  const darkBlue = hexToRgb("#0a1628");
  const midBlue = hexToRgb("#1a3a5c");
  const brightBlue = { r: 0, g: 150, b: 255 };
  const cyan = { r: 0, g: 220, b: 255 };
  const white = { r: 255, g: 255, b: 255 };

  const gridSize = 32;
  const hexCenters: { x: number; y: number; size: number }[] = [];
  for (let i = 0; i < 15; i++) {
    hexCenters.push({
      x: random() * TEXTURE_WIDTH,
      y: random() * TEXTURE_HEIGHT,
      size: 20 + random() * 40,
    });
  }

  const cityLights: { x: number; y: number; brightness: number }[] = [];
  for (let i = 0; i < 300; i++) {
    cityLights.push({
      x: random() * TEXTURE_WIDTH,
      y: random() * TEXTURE_HEIGHT,
      brightness: 0.3 + random() * 0.7,
    });
  }

  for (let y = 0; y < TEXTURE_HEIGHT; y++) {
    for (let x = 0; x < TEXTURE_WIDTH; x++) {
      const idx = (y * TEXTURE_WIDTH + x) * 4;
      const nx = x / TEXTURE_WIDTH;
      const ny = y / TEXTURE_HEIGHT;

      const noiseVal = fbm(nx * 6, ny * 6, 4, 42);
      let baseColor = lerpColor(darkBlue, midBlue, noiseVal);

      const gridX = x % gridSize;
      const gridY = y % gridSize;
      const gridLineWidth = 1 + Math.floor(noiseVal * 2);
      let gridIntensity = 0;
      if (gridX < gridLineWidth || gridY < gridLineWidth) {
        gridIntensity = 0.3 + noiseVal * 0.4;
      }

      const diagGridX = (x + y) % (gridSize * 1.5);
      if (diagGridX < 1 && random() > 0.7) {
        gridIntensity = Math.max(gridIntensity, 0.5);
      }

      let hexIntensity = 0;
      for (const hex of hexCenters) {
        const dx = Math.abs(x - hex.x);
        const dy = Math.abs(y - hex.y);
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < hex.size) {
          const edgeDist = Math.abs(dist - hex.size * 0.8);
          if (edgeDist < 3) {
            hexIntensity = Math.max(hexIntensity, 0.8 * (1 - edgeDist / 3));
          }
          if (dist < hex.size * 0.2) {
            hexIntensity = Math.max(hexIntensity, 0.6);
          }
        }
      }

      let lightIntensity = 0;
      for (const light of cityLights) {
        const dx = Math.abs(x - light.x);
        const dy = Math.abs(y - light.y);
        const wrapDx = Math.min(dx, TEXTURE_WIDTH - dx);
        const dist = Math.sqrt(wrapDx * wrapDx + dy * dy);
        if (dist < 4) {
          lightIntensity = Math.max(lightIntensity, light.brightness * (1 - dist / 4));
        }
      }

      let r = baseColor.r;
      let g = baseColor.g;
      let b = baseColor.b;

      if (gridIntensity > 0) {
        const gridColor = lerpColor(brightBlue, cyan, noiseVal);
        r = lerp(r, gridColor.r, gridIntensity);
        g = lerp(g, gridColor.g, gridIntensity);
        b = lerp(b, gridColor.b, gridIntensity);
      }

      if (hexIntensity > 0) {
        r = lerp(r, cyan.r, hexIntensity);
        g = lerp(g, cyan.g, hexIntensity);
        b = lerp(b, cyan.b, hexIntensity);
      }

      if (lightIntensity > 0) {
        r = lerp(r, white.r, lightIntensity);
        g = lerp(g, white.g, lightIntensity);
        b = lerp(b, white.b, lightIntensity);
      }

      data[idx] = Math.min(255, Math.max(0, r));
      data[idx + 1] = Math.min(255, Math.max(0, g));
      data[idx + 2] = Math.min(255, Math.max(0, b));
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return createTexture(canvas);
}

export function generateEnergyTexture(): THREE.CanvasTexture {
  const { canvas, ctx } = createCanvas();
  const imageData = ctx.createImageData(TEXTURE_WIDTH, TEXTURE_HEIGHT);
  const data = imageData.data;

  const darkPurple = hexToRgb("#1a0a2e");
  const midPurple = hexToRgb("#2d0f5e");
  const purple = hexToRgb("#9945ff");
  const cyan = hexToRgb("#00d4ff");
  const pink = hexToRgb("#ff45a0");
  const white = { r: 255, g: 255, b: 255 };

  const time = 0;
  const lightningBolts: { x: number; y: number; length: number; angle: number }[] = [];
  for (let i = 0; i < 25; i++) {
    lightningBolts.push({
      x: random() * TEXTURE_WIDTH,
      y: random() * TEXTURE_HEIGHT,
      length: 20 + random() * 60,
      angle: random() * Math.PI * 2,
    });
  }

  for (let y = 0; y < TEXTURE_HEIGHT; y++) {
    for (let x = 0; x < TEXTURE_WIDTH; x++) {
      const idx = (y * TEXTURE_WIDTH + x) * 4;
      const nx = x / TEXTURE_WIDTH;
      const ny = y / TEXTURE_HEIGHT;

      const noiseScale = 8;
      const n1 = fbm(nx * noiseScale + time * 0.1, ny * noiseScale, 5, 100);
      const n2 = fbm(nx * noiseScale * 1.5 + 100, ny * noiseScale * 1.5 + time * 0.08, 5, 200);
      const n3 = fbm(nx * noiseScale * 0.8 + 50, ny * noiseScale * 0.8 + time * 0.12, 5, 300);

      let baseColor = lerpColor(darkPurple, midPurple, n1 * 0.5 + n2 * 0.3);

      let energyIntensity = 0;
      if (n2 > 0.55) {
        energyIntensity = (n2 - 0.55) * 3;
      }
      const swirl = Math.sin(nx * 20 + n3 * 10) * 0.5 + 0.5;
      energyIntensity *= 0.7 + swirl * 0.5;

      let r = baseColor.r;
      let g = baseColor.g;
      let b = baseColor.b;

      if (energyIntensity > 0) {
        const col1 = lerpColor(purple, cyan, n1);
        const col2 = lerpColor(col1, pink, n3 * 0.8);
        r = lerp(r, col2.r, Math.min(1, energyIntensity));
        g = lerp(g, col2.g, Math.min(1, energyIntensity));
        b = lerp(b, col2.b, Math.min(1, energyIntensity));
      }

      let lightningGlow = 0;
      for (const bolt of lightningBolts) {
        const dx = x - bolt.x;
        const wrapDx = Math.min(Math.abs(dx), TEXTURE_WIDTH - Math.abs(dx));
        const dy = y - bolt.y;
        const dist = Math.sqrt(wrapDx * wrapDx + dy * dy);

        const perpDist = Math.abs(
          Math.cos(bolt.angle) * dy - Math.sin(bolt.angle) * wrapDx
        );
        const alongDist =
          Math.cos(bolt.angle) * wrapDx + Math.sin(bolt.angle) * dy;

        if (alongDist > -5 && alongDist < bolt.length && perpDist < 3 + random() * 2) {
          const jaggedness = Math.sin(alongDist * 0.5 + n1 * 10) * 3;
          if (Math.abs(perpDist - jaggedness) < 2) {
            lightningGlow = Math.max(
              lightningGlow,
              1 - Math.abs(perpDist - jaggedness) / 2
            );
          }
        }

        if (dist < 15) {
          lightningGlow = Math.max(lightningGlow, 0.3 * (1 - dist / 15));
        }
      }

      if (lightningGlow > 0) {
        const glowColor = lerpColor(cyan, white, lightningGlow);
        r = lerp(r, glowColor.r, lightningGlow * 0.9);
        g = lerp(g, glowColor.g, lightningGlow * 0.9);
        b = lerp(b, glowColor.b, lightningGlow * 0.9);
      }

      const pulse = Math.sin(time * 2 + nx * 30 + ny * 20) * 0.1 + 0.9;
      r *= pulse;
      g *= pulse;
      b *= pulse;

      data[idx] = Math.min(255, Math.max(0, r));
      data[idx + 1] = Math.min(255, Math.max(0, g));
      data[idx + 2] = Math.min(255, Math.max(0, b));
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return createTexture(canvas);
}

export function generateLifeTexture(): THREE.CanvasTexture {
  const { canvas, ctx } = createCanvas();
  const imageData = ctx.createImageData(TEXTURE_WIDTH, TEXTURE_HEIGHT);
  const data = imageData.data;

  const deepOcean = hexToRgb("#0a2463");
  const shallowOcean = hexToRgb("#1e3a8a");
  const deepLand = hexToRgb("#2d6a4f");
  const midLand = hexToRgb("#40916c");
  const lightLand = { r: 144, g: 169, b: 85 };
  const desert = { r: 194, g: 154, b: 108 };
  const ice = hexToRgb("#f0f9ff");

  const seed = 777;

  for (let y = 0; y < TEXTURE_HEIGHT; y++) {
    for (let x = 0; x < TEXTURE_WIDTH; x++) {
      const idx = (y * TEXTURE_WIDTH + x) * 4;
      const nx = x / TEXTURE_WIDTH;
      const ny = y / TEXTURE_HEIGHT;

      const lat = Math.abs(ny - 0.5) * 2;

      const continentNoise = fbm(nx * 4, ny * 4, 6, seed);
      const detailNoise = fbm(nx * 12, ny * 12, 4, seed + 500);
      const mountainNoise = fbm(nx * 8, ny * 8, 5, seed + 1000);

      const elevation = continentNoise * 0.7 + detailNoise * 0.3;

      let r: number, g: number, b: number;

      const iceThreshold = 0.9;
      const landThreshold = 0.48;

      if (lat > iceThreshold - (continentNoise - 0.5) * 0.3) {
        const iceFactor = smoothstep((lat - (iceThreshold - 0.1)) / 0.2);
        if (lat > iceThreshold) {
          r = ice.r;
          g = ice.g;
          b = ice.b;
        } else {
          const baseCol =
            elevation > landThreshold
              ? lerpColor(midLand, lightLand, detailNoise)
              : lerpColor(deepOcean, shallowOcean, elevation * 2);
          const iceCol = lerpColor(baseCol, ice, iceFactor);
          r = iceCol.r;
          g = iceCol.g;
          b = iceCol.b;
        }
      } else if (elevation > landThreshold) {
        const landHeight = (elevation - landThreshold) / (1 - landThreshold);

        if (landHeight > 0.75) {
          const mountainFactor = (landHeight - 0.75) * 4;
          const mountainCol = lerpColor(midLand, lightLand, mountainNoise);
          const snowCol = lerpColor(mountainCol, ice, mountainFactor * 0.8);
          r = snowCol.r;
          g = snowCol.g;
          b = snowCol.b;
        } else if (landHeight > 0.4) {
          const forest = fbm(nx * 16, ny * 16, 3, seed + 200);
          const landCol = lerpColor(deepLand, midLand, forest);
          r = landCol.r;
          g = landCol.g;
          b = landCol.b;
        } else if (landHeight > 0.15) {
          const plains = fbm(nx * 10, ny * 10, 3, seed + 300);
          const landCol = lerpColor(midLand, lightLand, plains);
          r = landCol.r;
          g = landCol.g;
          b = landCol.b;
        } else {
          const beachNoise = fbm(nx * 20, ny * 20, 2, seed + 400);
          const desertFactor = beachNoise * (1 - landHeight * 3);
          const beachCol = lerpColor(lightLand, desert, desertFactor);
          r = beachCol.r;
          g = beachCol.g;
          b = beachCol.b;
        }
      } else {
        const oceanDepth = elevation / landThreshold;
        const oceanCol = lerpColor(deepOcean, shallowOcean, oceanDepth);

        const ridgeNoise = Math.abs(mountainNoise - 0.5) * 2;
        if (ridgeNoise > 0.7 && oceanDepth < 0.5) {
          const ridgeFactor = (ridgeNoise - 0.7) * 3;
          const ridgeCol = lerpColor(oceanCol, { r: 50, g: 100, b: 150 }, ridgeFactor * 0.5);
          r = ridgeCol.r;
          g = ridgeCol.g;
          b = ridgeCol.b;
        } else {
          r = oceanCol.r;
          g = oceanCol.g;
          b = oceanCol.b;
        }
      }

      data[idx] = r;
      data[idx + 1] = g;
      data[idx + 2] = b;
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return createTexture(canvas);
}

export function generateCloudTexture(): THREE.CanvasTexture {
  const { canvas, ctx } = createCanvas();
  const imageData = ctx.createImageData(TEXTURE_WIDTH, TEXTURE_HEIGHT);
  const data = imageData.data;

  const seed = 999;

  for (let y = 0; y < TEXTURE_HEIGHT; y++) {
    for (let x = 0; x < TEXTURE_WIDTH; x++) {
      const idx = (y * TEXTURE_WIDTH + x) * 4;
      const nx = x / TEXTURE_WIDTH;
      const ny = y / TEXTURE_HEIGHT;

      const lat = Math.abs(ny - 0.5) * 2;

      let cloudNoise = fbm(nx * 5 + 0.3, ny * 3, 5, seed);
      cloudNoise += fbm(nx * 10, ny * 6, 4, seed + 100) * 0.5;
      cloudNoise *= 0.6;

      const bandNoise = Math.sin(ny * Math.PI * 6 + nx * 2) * 0.5 + 0.5;
      cloudNoise = cloudNoise * 0.7 + bandNoise * 0.2;

      let alpha = 0;
      const threshold = 0.45;
      if (cloudNoise > threshold) {
        alpha = (cloudNoise - threshold) / (1 - threshold);
        alpha = Math.pow(alpha, 0.7);
        alpha *= 0.85;
      }

      if (lat > 0.85) {
        const polarAlpha = ((lat - 0.85) / 0.15) * 0.6;
        alpha = Math.max(alpha, polarAlpha);
      }

      data[idx] = 255;
      data[idx + 1] = 255;
      data[idx + 2] = 255;
      data[idx + 3] = Math.round(alpha * 255);
    }
  }

  ctx.putImageData(imageData, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

export function generateDesertTexture(): THREE.CanvasTexture {
  const { canvas, ctx } = createCanvas();
  const imageData = ctx.createImageData(TEXTURE_WIDTH, TEXTURE_HEIGHT);
  const data = imageData.data;

  const darkOrange = hexToRgb("#8b3a0f");
  const midOrange = hexToRgb("#c2410c");
  const lightOrange = { r: 217, g: 119, b: 6 };
  const darkCrater = { r: 80, g: 30, b: 10 };
  const highlightCrater = { r: 180, g: 90, b: 40 };

  const seed = 555;

  const craters: { x: number; y: number; radius: number; depth: number }[] = [];
  for (let i = 0; i < 25; i++) {
    craters.push({
      x: random() * TEXTURE_WIDTH,
      y: random() * TEXTURE_HEIGHT,
      radius: 8 + random() * 35,
      depth: 0.3 + random() * 0.5,
    });
  }

  for (let y = 0; y < TEXTURE_HEIGHT; y++) {
    for (let x = 0; x < TEXTURE_WIDTH; x++) {
      const idx = (y * TEXTURE_WIDTH + x) * 4;
      const nx = x / TEXTURE_WIDTH;
      const ny = y / TEXTURE_HEIGHT;

      const baseNoise = fbm(nx * 6, ny * 6, 5, seed);
      const duneNoise = fbm(nx * 3 + ny * 0.5, ny * 8, 4, seed + 200);
      const fineNoise = fbm(nx * 20, ny * 20, 3, seed + 400);

      let r = lerp(darkOrange.r, midOrange.r, baseNoise);
      let g = lerp(darkOrange.g, midOrange.g, baseNoise);
      let b = lerp(darkOrange.b, midOrange.b, baseNoise);

      const duneStreaks = Math.sin(nx * 40 + duneNoise * 10) * 0.5 + 0.5;
      if (duneStreaks > 0.6) {
        const duneIntensity = (duneStreaks - 0.6) * 2.5;
        r = lerp(r, lightOrange.r, duneIntensity * 0.4);
        g = lerp(g, lightOrange.g, duneIntensity * 0.4);
        b = lerp(b, lightOrange.b, duneIntensity * 0.4);
      }

      const fineDetail = fineNoise * 0.15;
      r += fineDetail * 30;
      g += fineDetail * 20;
      b += fineDetail * 10;

      for (const crater of craters) {
        const dx = x - crater.x;
        const wrapDx = Math.min(Math.abs(dx), TEXTURE_WIDTH - Math.abs(dx));
        const dy = y - crater.y;
        const dist = Math.sqrt(wrapDx * wrapDx + dy * dy);
        const normalizedDist = dist / crater.radius;

        if (normalizedDist < 1.2) {
          if (normalizedDist < 0.7) {
            const craterFactor = 1 - normalizedDist / 0.7;
            const shadowFactor = craterFactor * crater.depth;
            r = lerp(r, darkCrater.r, shadowFactor);
            g = lerp(g, darkCrater.g, shadowFactor);
            b = lerp(b, darkCrater.b, shadowFactor);
          } else if (normalizedDist < 1.0) {
            const rimFactor = (1.0 - normalizedDist) / 0.3;
            const highlight = rimFactor * crater.depth * 0.8;
            r = lerp(r, highlightCrater.r, highlight);
            g = lerp(g, highlightCrater.g, highlight);
            b = lerp(b, highlightCrater.b, highlight);
          } else if (normalizedDist < 1.2) {
            const ejectaFactor = (1.2 - normalizedDist) / 0.2;
            r = lerp(r, darkCrater.r + 20, ejectaFactor * 0.2);
            g = lerp(g, darkCrater.g + 15, ejectaFactor * 0.2);
            b = lerp(b, darkCrater.b + 10, ejectaFactor * 0.2);
          }
        }
      }

      const lat = Math.abs(ny - 0.5) * 2;
      if (lat > 0.9) {
        const polarDark = (lat - 0.9) / 0.1;
        r = lerp(r, darkOrange.r - 20, polarDark * 0.3);
        g = lerp(g, darkOrange.g - 15, polarDark * 0.3);
        b = lerp(b, darkOrange.b - 10, polarDark * 0.3);
      }

      data[idx] = Math.min(255, Math.max(0, r));
      data[idx + 1] = Math.min(255, Math.max(0, g));
      data[idx + 2] = Math.min(255, Math.max(0, b));
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return createTexture(canvas);
}
