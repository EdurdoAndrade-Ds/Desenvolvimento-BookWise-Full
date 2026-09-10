import {
  BOX_BLUR_KERNEL,
  EMBOSS_KERNEL,
  GAUSSIAN_BLUR_KERNEL,
  IDENTITY_KERNEL,
  LAPLACIAN_KERNEL,
  SHARPEN_KERNEL,
} from './kernels';

const CHANNELS = 4;
const RED_CHANNEL = 0;
const GREEN_CHANNEL = 1;
const BLUE_CHANNEL = 2;
const KERNEL_SIZE = 3;
const KERNEL_LENGTH = KERNEL_SIZE * KERNEL_SIZE;
const MAX_COLOR = 255;
const MIN_COLOR = 0;
const LUMA_RED_WEIGHT = 0.299;
const LUMA_GREEN_WEIGHT = 0.587;
const LUMA_BLUE_WEIGHT = 0.114;
const HISTOGRAM_BINS = 256;
const SOBEL_WEIGHT_SUM = 4;
const SOBEL_COMPONENT_MAX = SOBEL_WEIGHT_SUM * MAX_COLOR;
const SOBEL_MAGNITUDE_MAX = Math.sqrt(2) * SOBEL_COMPONENT_MAX;

export {
  BOX_BLUR_KERNEL,
  EMBOSS_KERNEL,
  GAUSSIAN_BLUR_KERNEL,
  IDENTITY_KERNEL,
  LAPLACIAN_KERNEL,
  SHARPEN_KERNEL,
};

/** Opcoes de ajuste linear de brilho e contraste. */
export interface BrightnessContrastOptions {
  brightness: number;
  contrast: number;
}

/** Opcoes da convolucao, com divisor da soma ponderada e deslocamento. */
export interface ConvolutionOptions {
  divisor?: number;
  offset?: number;
}

/** Histogramas de vermelho, verde, azul e luminancia, cada um com 256 bins. */
export interface ImageHistogram {
  r: Uint32Array;
  g: Uint32Array;
  b: Uint32Array;
  luma: Uint32Array;
}

function clampColor(value: number): number {
  return Math.max(MIN_COLOR, Math.min(MAX_COLOR, Math.round(value)));
}

function luminance(red: number, green: number, blue: number): number {
  return clampColor(
    LUMA_RED_WEIGHT * red
      + LUMA_GREEN_WEIGHT * green
      + LUMA_BLUE_WEIGHT * blue,
  );
}

function imageFromData(src: ImageData, data: Uint8ClampedArray): ImageData {
  return new ImageData(data, src.width, src.height);
}

/** Converte cada pixel para luminancia usando a formula Rec.601 e preserva alpha. */
export function grayscale(src: ImageData): ImageData {
  const output = new Uint8ClampedArray(src.data);
  for (let index = 0; index < src.data.length; index += CHANNELS) {
    const gray = luminance(
      src.data[index + RED_CHANNEL],
      src.data[index + GREEN_CHANNEL],
      src.data[index + BLUE_CHANNEL],
    );
    output[index + RED_CHANNEL] = gray;
    output[index + GREEN_CHANNEL] = gray;
    output[index + BLUE_CHANNEL] = gray;
  }
  return imageFromData(src, output);
}

/** Inverte os canais RGB de cada pixel e mantem o canal alpha original. */
export function invert(src: ImageData): ImageData {
  const output = new Uint8ClampedArray(src.data);
  for (let index = 0; index < src.data.length; index += CHANNELS) {
    output[index + RED_CHANNEL] = MAX_COLOR - src.data[index + RED_CHANNEL];
    output[index + GREEN_CHANNEL] = MAX_COLOR - src.data[index + GREEN_CHANNEL];
    output[index + BLUE_CHANNEL] = MAX_COLOR - src.data[index + BLUE_CHANNEL];
  }
  return imageFromData(src, output);
}

/** Aplica offset de brilho e fator de contraste, limitando cada canal a 0..255. */
export function brightnessContrast(
  src: ImageData,
  options: BrightnessContrastOptions,
): ImageData {
  const output = new Uint8ClampedArray(src.data);
  const midpoint = MAX_COLOR / 2;
  for (let index = 0; index < src.data.length; index += CHANNELS) {
    for (let channel = RED_CHANNEL; channel <= BLUE_CHANNEL; channel += 1) {
      const centered = src.data[index + channel] - midpoint;
      output[index + channel] = clampColor(
        centered * options.contrast + midpoint + options.brightness,
      );
    }
  }
  return imageFromData(src, output);
}

/** Aplica uma convolucao 3x3 manual com bordas replicadas e alpha preservado. */
export function convolve3x3(
  src: ImageData,
  kernel: readonly number[],
  options: ConvolutionOptions = {},
): ImageData {
  if (kernel.length !== KERNEL_LENGTH) {
    throw new Error(`Kernel 3x3 deve conter ${KERNEL_LENGTH} valores`);
  }

  let kernelSum = 0;
  for (let index = 0; index < kernel.length; index += 1) {
    kernelSum += kernel[index];
  }
  const divisor = options.divisor ?? (kernelSum === 0 ? 1 : kernelSum);
  if (!Number.isFinite(divisor) || divisor === 0) {
    throw new Error('O divisor da convolucao deve ser finito e diferente de zero');
  }
  const offset = options.offset ?? 0;
  const output = new Uint8ClampedArray(src.data);
  const radius = Math.floor(KERNEL_SIZE / 2);

  for (let y = 0; y < src.height; y += 1) {
    for (let x = 0; x < src.width; x += 1) {
      const targetIndex = (y * src.width + x) * CHANNELS;
      for (let channel = RED_CHANNEL; channel <= BLUE_CHANNEL; channel += 1) {
        let sum = 0;
        for (let kernelY = 0; kernelY < KERNEL_SIZE; kernelY += 1) {
          const sourceY = Math.max(
            0,
            Math.min(src.height - 1, y + kernelY - radius),
          );
          for (let kernelX = 0; kernelX < KERNEL_SIZE; kernelX += 1) {
            const sourceX = Math.max(
              0,
              Math.min(src.width - 1, x + kernelX - radius),
            );
            const sourceIndex = (sourceY * src.width + sourceX) * CHANNELS;
            const kernelIndex = kernelY * KERNEL_SIZE + kernelX;
            sum += src.data[sourceIndex + channel] * kernel[kernelIndex];
          }
        }
        output[targetIndex + channel] = clampColor(sum / divisor + offset);
      }
    }
  }
  return imageFromData(src, output);
}

/** Detecta bordas com Sobel sobre luminancia, normalizando a magnitude para 0..255. */
export function sobel(src: ImageData): ImageData {
  const output = new Uint8ClampedArray(src.data);
  const horizontal = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
  const vertical = [-1, -2, -1, 0, 0, 0, 1, 2, 1];

  for (let y = 0; y < src.height; y += 1) {
    for (let x = 0; x < src.width; x += 1) {
      let gradientX = 0;
      let gradientY = 0;
      for (let kernelY = 0; kernelY < KERNEL_SIZE; kernelY += 1) {
        const sourceY = Math.max(0, Math.min(src.height - 1, y + kernelY - 1));
        for (let kernelX = 0; kernelX < KERNEL_SIZE; kernelX += 1) {
          const sourceX = Math.max(0, Math.min(src.width - 1, x + kernelX - 1));
          const sourceIndex = (sourceY * src.width + sourceX) * CHANNELS;
          const sourceLuma = luminance(
            src.data[sourceIndex + RED_CHANNEL],
            src.data[sourceIndex + GREEN_CHANNEL],
            src.data[sourceIndex + BLUE_CHANNEL],
          );
          const kernelIndex = kernelY * KERNEL_SIZE + kernelX;
          gradientX += sourceLuma * horizontal[kernelIndex];
          gradientY += sourceLuma * vertical[kernelIndex];
        }
      }
      const magnitude = Math.sqrt(gradientX ** 2 + gradientY ** 2);
      const edge = clampColor((magnitude / SOBEL_MAGNITUDE_MAX) * MAX_COLOR);
      const targetIndex = (y * src.width + x) * CHANNELS;
      output[targetIndex + RED_CHANNEL] = edge;
      output[targetIndex + GREEN_CHANNEL] = edge;
      output[targetIndex + BLUE_CHANNEL] = edge;
    }
  }
  return imageFromData(src, output);
}

/** Conta os canais RGB e a luminancia Rec.601 em quatro histogramas de 256 bins. */
export function histogram(src: ImageData): ImageHistogram {
  const result: ImageHistogram = {
    r: new Uint32Array(HISTOGRAM_BINS),
    g: new Uint32Array(HISTOGRAM_BINS),
    b: new Uint32Array(HISTOGRAM_BINS),
    luma: new Uint32Array(HISTOGRAM_BINS),
  };
  for (let index = 0; index < src.data.length; index += CHANNELS) {
    result.r[src.data[index + RED_CHANNEL]] += 1;
    result.g[src.data[index + GREEN_CHANNEL]] += 1;
    result.b[src.data[index + BLUE_CHANNEL]] += 1;
    result.luma[luminance(
      src.data[index + RED_CHANNEL],
      src.data[index + GREEN_CHANNEL],
      src.data[index + BLUE_CHANNEL],
    )] += 1;
  }
  return result;
}

/**
 * Equaliza o CDF da luminancia e ajusta RGB proporcionalmente, preservando a croma.
 */
export function equalizeHistogram(src: ImageData): ImageData {
  const sourceHistogram = histogram(src).luma;
  const cumulative = new Uint32Array(HISTOGRAM_BINS);
  let runningTotal = 0;
  let firstNonEmpty = -1;
  for (let bin = 0; bin < HISTOGRAM_BINS; bin += 1) {
    runningTotal += sourceHistogram[bin];
    cumulative[bin] = runningTotal;
    if (firstNonEmpty < 0 && sourceHistogram[bin] > 0) {
      firstNonEmpty = bin;
    }
  }

  const output = new Uint8ClampedArray(src.data);
  const totalPixels = src.width * src.height;
  const minimumCdf = firstNonEmpty < 0 ? 0 : cumulative[firstNonEmpty];
  const cdfRange = totalPixels - minimumCdf;

  for (let index = 0; index < src.data.length; index += CHANNELS) {
    const sourceRed = src.data[index + RED_CHANNEL];
    const sourceGreen = src.data[index + GREEN_CHANNEL];
    const sourceBlue = src.data[index + BLUE_CHANNEL];
    const sourceLuma = luminance(sourceRed, sourceGreen, sourceBlue);
    const equalizedLuma = cdfRange <= 0
      ? sourceLuma
      : ((cumulative[sourceLuma] - minimumCdf) / cdfRange) * MAX_COLOR;
    const ratio = sourceLuma === 0 ? 0 : equalizedLuma / sourceLuma;
    output[index + RED_CHANNEL] = clampColor(sourceRed * ratio);
    output[index + GREEN_CHANNEL] = clampColor(sourceGreen * ratio);
    output[index + BLUE_CHANNEL] = clampColor(sourceBlue * ratio);
  }
  return imageFromData(src, output);
}
