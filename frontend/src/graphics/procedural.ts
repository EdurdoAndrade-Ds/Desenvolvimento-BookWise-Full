const UINT32_RANGE = 0x100000000;
const FNV_OFFSET_BASIS = 2166136261;
const FNV_PRIME = 16777619;
const COLOR_HUE_RANGE = 360;
const DEFAULT_SATURATION = 62;
const DEFAULT_LIGHTNESS = 42;
const SATURATION_VARIATION = 24;
const LIGHTNESS_VARIATION = 20;
const DEFAULT_OCTAVES = 4;
const DEFAULT_PERSISTENCE = 0.5;
const DEFAULT_LACUNARITY = 2;
const MAX_IMAGE_DIMENSION = 2048;
const COLOR_CHANNELS = 4;
const ALPHA_OPAQUE = 255;
const FULL_CIRCLE = 6;
const HALF = 0.5;
const PERCENT_MAX = 100;
const HUE_DRIFT = 18;
const NOISE_SCALE = 0.012;
const NOISE_CONTRAST = 24;
const GRADIENT_CONTRAST = 16;

/** Cor de matiz, saturacao e luminosidade usada pelos geradores graficos. */
export interface HslColor {
  h: number;
  s: number;
  l: number;
}

/** Opcoes das oitavas do ruido fractal. */
export interface FractalNoiseOptions {
  octaves?: number;
  persistence?: number;
  lacunarity?: number;
}

/** Opcoes textuais usadas para derivar uma capa procedural deterministica. */
export interface CoverOptions {
  title: string;
  author: string;
}

function unitHash(value: number): number {
  let hash = value >>> 0;
  hash = Math.imul(hash ^ (hash >>> 16), 2246822507);
  hash = Math.imul(hash ^ (hash >>> 13), 3266489909);
  return ((hash ^ (hash >>> 16)) >>> 0) / UINT32_RANGE;
}

function smoothstep(value: number): number {
  return value * value * (3 - 2 * value);
}

function lerp(start: number, end: number, amount: number): number {
  return start + (end - start) * amount;
}

function coordinateHash(x: number, y: number, seed: number): number {
  const seedValue = Math.floor(seed) >>> 0;
  let hash = seedValue ^ 2166136261;
  hash = Math.imul(hash ^ (x | 0), FNV_PRIME);
  hash = Math.imul(hash ^ (y | 0), FNV_PRIME);
  return unitHash(hash);
}

function hslToRgb(color: HslColor): [number, number, number] {
  const hue = (((color.h % COLOR_HUE_RANGE) + COLOR_HUE_RANGE) % COLOR_HUE_RANGE) / COLOR_HUE_RANGE;
  const saturation = color.s / PERCENT_MAX;
  const lightness = color.l / PERCENT_MAX;
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const hueSegment = hue * FULL_CIRCLE;
  const secondary = chroma * (1 - Math.abs((hueSegment % 2) - 1));
  const match = lightness - chroma * HALF;
  let red = 0;
  let green = 0;
  let blue = 0;

  if (hueSegment < 1) {
    red = chroma;
    green = secondary;
  } else if (hueSegment < 2) {
    red = secondary;
    green = chroma;
  } else if (hueSegment < 3) {
    green = chroma;
    blue = secondary;
  } else if (hueSegment < 4) {
    green = secondary;
    blue = chroma;
  } else if (hueSegment < 5) {
    red = secondary;
    blue = chroma;
  } else {
    red = chroma;
    blue = secondary;
  }
  return [
    Math.round((red + match) * 255),
    Math.round((green + match) * 255),
    Math.round((blue + match) * 255),
  ];
}

/** Calcula um hash FNV-1a estavel, sem aleatoriedade global. */
export function hashString(value: string): number {
  let hash = FNV_OFFSET_BASIS;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, FNV_PRIME);
  }
  return hash >>> 0;
}

/** Deriva uma cor HSL deterministica a partir do hash de uma string. */
export function colorFromString(value: string): HslColor {
  const hash = hashString(value);
  return {
    h: hash % COLOR_HUE_RANGE,
    s: DEFAULT_SATURATION + ((hash >>> 8) % SATURATION_VARIATION),
    l: DEFAULT_LIGHTNESS + ((hash >>> 16) % LIGHTNESS_VARIATION),
  };
}

/** Formata uma cor HSL como uma string CSS hsl(). */
export function hslToCss(color: HslColor): string {
  return `hsl(${color.h} ${color.s}% ${color.l}%)`;
}

/** Calcula value noise 2D com valores de grade e interpolacao smoothstep. */
export function valueNoise2D(x: number, y: number, seed: number): number {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const xFraction = smoothstep(x - x0);
  const yFraction = smoothstep(y - y0);
  const top = lerp(coordinateHash(x0, y0, seed), coordinateHash(x0 + 1, y0, seed), xFraction);
  const bottom = lerp(
    coordinateHash(x0, y0 + 1, seed),
    coordinateHash(x0 + 1, y0 + 1, seed),
    xFraction,
  );
  return lerp(top, bottom, yFraction);
}

/** Soma oitavas de value noise para obter ruido fractal normalizado em 0..1. */
export function fractalNoise2D(
  x: number,
  y: number,
  seed: number,
  options: FractalNoiseOptions = {},
): number {
  const octaves = options.octaves ?? DEFAULT_OCTAVES;
  const persistence = options.persistence ?? DEFAULT_PERSISTENCE;
  const lacunarity = options.lacunarity ?? DEFAULT_LACUNARITY;
  if (!Number.isInteger(octaves) || octaves <= 0) {
    throw new Error('octaves deve ser um inteiro positivo');
  }
  if (!Number.isFinite(persistence) || persistence < 0) {
    throw new Error('persistence deve ser um numero finito nao negativo');
  }
  if (!Number.isFinite(lacunarity) || lacunarity <= 0) {
    throw new Error('lacunarity deve ser um numero finito positivo');
  }

  let frequency = 1;
  let amplitude = 1;
  let total = 0;
  let amplitudeTotal = 0;
  for (let octave = 0; octave < octaves; octave += 1) {
    total += amplitude * valueNoise2D(x * frequency, y * frequency, seed + octave);
    amplitudeTotal += amplitude;
    frequency *= lacunarity;
    amplitude *= persistence;
  }
  return total / amplitudeTotal;
}

function validateDimension(name: string, value: number): void {
  if (!Number.isInteger(value) || value <= 0 || value > MAX_IMAGE_DIMENSION) {
    throw new Error(`${name} deve ser inteiro entre 1 e ${MAX_IMAGE_DIMENSION}`);
  }
}

/** Gera ImageData de capa com gradiente HSL e textura fractal, sem desenhar texto. */
export function generateCoverImageData(
  width: number,
  height: number,
  options: CoverOptions,
): ImageData {
  validateDimension('width', width);
  validateDimension('height', height);
  const baseColor = colorFromString(options.title);
  const seed = hashString(`${options.title}:${options.author}`);
  const data = new Uint8ClampedArray(width * height * COLOR_CHANNELS);

  for (let y = 0; y < height; y += 1) {
    const vertical = height === 1 ? 0 : y / (height - 1);
    for (let x = 0; x < width; x += 1) {
      const horizontal = width === 1 ? 0 : x / (width - 1);
      const noise = fractalNoise2D(x * NOISE_SCALE, y * NOISE_SCALE, seed);
      const lightness =
        baseColor.l + (noise - HALF) * NOISE_CONTRAST + (HALF - vertical) * GRADIENT_CONTRAST;
      const color = hslToRgb({
        h: baseColor.h + horizontal * HUE_DRIFT,
        s: baseColor.s,
        l: Math.max(0, Math.min(100, lightness)),
      });
      const index = (y * width + x) * COLOR_CHANNELS;
      data[index] = color[0];
      data[index + 1] = color[1];
      data[index + 2] = color[2];
      data[index + 3] = ALPHA_OPAQUE;
    }
  }
  return new ImageData(data, width, height);
}
