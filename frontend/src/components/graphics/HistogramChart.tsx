import { useEffect, useRef } from 'react';
import type { ImageHistogram } from '../../graphics/imageFilters';

const WIDTH = 256;
const HEIGHT = 96;
const CHANNEL_COLORS = ['rgba(239,68,68,0.75)', 'rgba(34,197,94,0.75)', 'rgba(59,130,246,0.75)'];
const LUMA_COLOR = 'rgba(226,232,240,0.9)';

interface HistogramChartProps {
  histogram: ImageHistogram | null;
  showChannels: boolean;
}

function drawSeries(
  context: CanvasRenderingContext2D,
  bins: Uint32Array,
  peak: number,
  color: string,
): void {
  // Escala logaritmica: sem ela um pico dominante (ex.: fundo preto do Sobel)
  // achata todos os outros bins e o histograma parece vazio.
  const peakScale = Math.log1p(peak);
  context.strokeStyle = color;
  context.lineWidth = 1;
  context.beginPath();
  for (let bin = 0; bin < bins.length; bin += 1) {
    const height = peakScale === 0 ? 0 : (Math.log1p(bins[bin]) / peakScale) * HEIGHT;
    context.moveTo(bin + 0.5, HEIGHT);
    context.lineTo(bin + 0.5, HEIGHT - height);
  }
  context.stroke();
}

/** Desenha o histograma em Canvas 2D: uma coluna por bin, normalizada pelo pico. */
export default function HistogramChart({ histogram, showChannels }: HistogramChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;

    context.clearRect(0, 0, WIDTH, HEIGHT);
    context.fillStyle = '#0f172a';
    context.fillRect(0, 0, WIDTH, HEIGHT);
    if (!histogram) return;

    if (showChannels) {
      const channels = [histogram.r, histogram.g, histogram.b];
      const peak = Math.max(...channels.map((bins) => Math.max(...bins)));
      channels.forEach((bins, index) => drawSeries(context, bins, peak, CHANNEL_COLORS[index]));
      return;
    }
    drawSeries(context, histogram.luma, Math.max(...histogram.luma), LUMA_COLOR);
  }, [histogram, showChannels]);

  return (
    <canvas
      ref={canvasRef}
      width={WIDTH}
      height={HEIGHT}
      className="w-full rounded-lg border border-slate-200 dark:border-slate-700"
    />
  );
}
