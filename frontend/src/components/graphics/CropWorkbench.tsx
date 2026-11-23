import { useEffect, useMemo, useRef, useState, type PointerEvent } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { CanvasTexture, DoubleSide, SRGBColorSpace } from 'three';
import { cropImage, cropPolygon, analyzeImage, type Rect } from '../../graphics/crop';
import { clipPolygon, type Point } from '../../graphics/polygonClip';
import { transformImage } from '../../graphics/affine';
import HistogramChart from './HistogramChart';

const panel =
  'rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900';
const button =
  'rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-40';
const secondary =
  'rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800';

function Pixels({ image, label }: { image: ImageData; label: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    ref.current?.getContext('2d')?.putImageData(image, 0, 0);
  }, [image]);
  return (
    <canvas
      ref={ref}
      width={image.width}
      height={image.height}
      aria-label={label}
      className="block h-auto max-h-[460px] max-w-full"
    />
  );
}

function CropPlane({ image }: { image: ImageData }) {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    canvas.getContext('2d')?.putImageData(image, 0, 0);
    const value = new CanvasTexture(canvas);
    value.colorSpace = SRGBColorSpace;
    return value;
  }, [image]);
  useEffect(() => () => texture.dispose(), [texture]);
  const scale = 2.4 / Math.max(image.width, image.height);
  return (
    <mesh>
      <planeGeometry args={[image.width * scale, image.height * scale]} />
      <meshBasicMaterial map={texture} transparent side={DoubleSide} toneMapped={false} />
    </mesh>
  );
}

export default function CropWorkbench({
  source,
  process,
  onReset,
}: {
  source: ImageData;
  process: (image: ImageData) => ImageData;
  onReset: () => void;
}) {
  const [selection, setSelection] = useState<Rect>({
    x: source.width * 0.15,
    y: source.height * 0.15,
    width: source.width * 0.7,
    height: source.height * 0.7,
  });
  const [crop, setCrop] = useState<ImageData | null>(null);
  const [mode, setMode] = useState<'rectangle' | 'polygon'>('rectangle');
  const [points, setPoints] = useState<Point[]>([]);
  const [closed, setClosed] = useState(false);
  const clipped = useMemo(
    () => (points.length >= 3 ? clipPolygon(points, source.width, source.height) : []),
    [points, source],
  );
  const [angle, setAngle] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [channels, setChannels] = useState(true);
  const [show3d, setShow3d] = useState(false);
  const [error, setError] = useState('');
  const drag = useRef<{ x: number; y: number; rect: Rect; handle: string } | null>(null);
  const transformed = useMemo(
    () => (crop ? transformImage(crop, angle, zoom, flipH, flipV) : null),
    [crop, angle, zoom, flipH, flipV],
  );
  const result = useMemo(
    () => (transformed ? process(transformed.image) : null),
    [transformed, process],
  );
  const analysis = useMemo(() => (result ? analyzeImage(result) : null), [result]);

  function point(event: PointerEvent<SVGSVGElement>) {
    const bounds = event.currentTarget
      .parentElement!.querySelector('canvas')!
      .getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width) * source.width;
    const y = ((event.clientY - bounds.top) / bounds.height) * source.height;
    if (mode === 'polygon') return { x, y };
    return {
      x: Math.max(
        0,
        Math.min(source.width, ((event.clientX - bounds.left) / bounds.width) * source.width),
      ),
      y: Math.max(
        0,
        Math.min(source.height, ((event.clientY - bounds.top) / bounds.height) * source.height),
      ),
    };
  }
  function start(event: PointerEvent<SVGSVGElement>) {
    event.preventDefault();
    if (mode === 'polygon') {
      if (closed) return;
      const p = point(event);
      const bounds = event.currentTarget
        .parentElement!.querySelector('canvas')!
        .getBoundingClientRect();
      if (
        points.length >= 3 &&
        (Math.hypot(p.x - points[0].x, p.y - points[0].y) * bounds.width) / source.width <= 12
      ) {
        setClosed(true);
        return;
      }
      const last = points[points.length - 1];
      if (!last || Math.hypot(p.x - last.x, p.y - last.y) > 1)
        setPoints((current) => [...current, p]);
      return;
    }
    event.currentTarget.setPointerCapture(event.pointerId);
    const p = point(event);
    const handle = (event.target as SVGElement).dataset.handle ?? 'new';
    drag.current = { ...p, rect: { ...selection }, handle };
    if (handle === 'new') setSelection({ ...p, width: 0, height: 0 });
  }
  function move(event: PointerEvent<SVGSVGElement>) {
    if (mode === 'polygon' || !drag.current) return;
    const p = point(event),
      { x, y, rect, handle } = drag.current;
    if (handle === 'move') {
      setSelection({
        ...rect,
        x: Math.max(0, Math.min(source.width - rect.width, rect.x + p.x - x)),
        y: Math.max(0, Math.min(source.height - rect.height, rect.y + p.y - y)),
      });
      return;
    }
    let left = rect.x,
      top = rect.y,
      right = rect.x + rect.width,
      bottom = rect.y + rect.height;
    if (handle === 'new') {
      left = x;
      top = y;
      right = p.x;
      bottom = p.y;
    } else {
      if (handle.includes('w')) left = p.x;
      if (handle.includes('e')) right = p.x;
      if (handle.includes('n')) top = p.y;
      if (handle.includes('s')) bottom = p.y;
    }
    setSelection({
      x: Math.min(left, right),
      y: Math.min(top, bottom),
      width: Math.abs(right - left),
      height: Math.abs(bottom - top),
    });
  }
  function reset() {
    setAngle(0);
    setZoom(1);
    setFlipH(false);
    setFlipV(false);
    setError('');
  }
  function cut() {
    try {
      setCrop(mode === 'polygon' ? cropPolygon(source, points) : cropImage(source, selection));
      reset();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível recortar.');
    }
  }
  function download() {
    if (!result) return;
    const canvas = document.createElement('canvas');
    canvas.width = result.width;
    canvas.height = result.height;
    canvas.getContext('2d')?.putImageData(result, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) {
        setError('Não foi possível exportar o PNG.');
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'bookwise-recorte.png';
      a.click();
      URL.revokeObjectURL(url);
    });
  }
  const handles = [
    ['nw', 0, 0],
    ['n', 0.5, 0],
    ['ne', 1, 0],
    ['e', 1, 0.5],
    ['se', 1, 1],
    ['s', 0.5, 1],
    ['sw', 0, 1],
    ['w', 0, 0.5],
  ] as const;
  return (
    <div className="min-w-0 space-y-4 text-slate-800 dark:text-slate-100">
      <div className="grid gap-4 md:grid-cols-2">
        <section className={panel}>
          <h2 className="mb-2 font-semibold">1. Selecionar área</h2>
          <div className="mb-3 flex flex-wrap gap-2" role="group" aria-label="Modo de seleção">
            <button
              className={mode === 'rectangle' ? button : secondary}
              aria-pressed={mode === 'rectangle'}
              onClick={() => {
                setMode('rectangle');
                drag.current = null;
                setError('');
              }}
            >
              Retângulo
            </button>
            <button
              className={mode === 'polygon' ? button : secondary}
              aria-pressed={mode === 'polygon'}
              onClick={() => {
                setMode('polygon');
                drag.current = null;
                setError('');
              }}
            >
              Polígono livre
            </button>
          </div>
          <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
            {mode === 'polygon'
              ? 'Toque para adicionar pontos, inclusive na margem fora da capa. Feche pelo primeiro ponto, duplo clique ou botão. Contorno verde: recorte limitado por Sutherland–Hodgman.'
              : 'Arraste para selecionar. Mova pelo centro e redimensione pelas alças. Funciona por toque.'}
          </p>
          <div
            className={mode === 'polygon' ? 'rounded-lg bg-slate-100 p-6 dark:bg-slate-800' : ''}
          >
            <div className="relative mx-auto w-fit max-w-full">
              <Pixels image={source} label="Capa de origem" />
              <svg
                aria-label={
                  mode === 'polygon' ? 'Seleção poligonal da capa' : 'Seleção retangular da capa'
                }
                className="absolute touch-none select-none"
                style={
                  mode === 'polygon'
                    ? {
                        left: `${(-32 / source.width) * 100}%`,
                        top: `${(-32 / source.height) * 100}%`,
                        width: `${((source.width + 64) / source.width) * 100}%`,
                        height: `${((source.height + 64) / source.height) * 100}%`,
                      }
                    : { inset: 0, width: '100%', height: '100%' }
                }
                viewBox={
                  mode === 'polygon'
                    ? `-32 -32 ${source.width + 64} ${source.height + 64}`
                    : `0 0 ${source.width} ${source.height}`
                }
                onPointerDown={start}
                onPointerMove={move}
                onDoubleClick={() => {
                  if (mode === 'polygon' && points.length >= 3) setClosed(true);
                }}
                onPointerUp={() => {
                  drag.current = null;
                }}
                onPointerCancel={() => {
                  drag.current = null;
                }}
              >
                <rect
                  x={-32}
                  y={-32}
                  width={source.width + 64}
                  height={source.height + 64}
                  fill="transparent"
                />
                {mode === 'polygon' ? (
                  <>
                    <rect
                      width={source.width}
                      height={source.height}
                      fill="none"
                      stroke="#94a3b8"
                      strokeDasharray="4 3"
                    />
                    <polyline
                      data-polygon="original"
                      points={[...points, ...(closed && points.length ? [points[0]] : [])]
                        .map((p) => `${p.x},${p.y}`)
                        .join(' ')}
                      fill={closed ? '#f59e0b22' : 'none'}
                      stroke="#f59e0b"
                      strokeWidth={2}
                    />
                    {closed && clipped.length >= 3 && (
                      <polygon
                        data-polygon="clipped"
                        points={clipped.map((p) => `${p.x},${p.y}`).join(' ')}
                        fill="#14b8a633"
                        stroke="#10b981"
                        strokeWidth={3}
                        strokeDasharray="5 3"
                        pointerEvents="none"
                      />
                    )}
                    {points.map((p, i) => (
                      <g key={i} pointerEvents="none">
                        <circle
                          cx={p.x}
                          cy={p.y}
                          r={i === 0 ? 7 : 5}
                          fill={i === 0 ? '#0d9488' : '#f59e0b'}
                          stroke="white"
                          strokeWidth={2}
                        />
                        <text
                          x={p.x + 8}
                          y={p.y - 8}
                          fill="#0f172a"
                          stroke="white"
                          strokeWidth={3}
                          paintOrder="stroke"
                          fontSize={12}
                        >
                          {i + 1}
                        </text>
                      </g>
                    ))}
                  </>
                ) : (
                  <>
                    <rect
                      data-handle="move"
                      x={selection.x}
                      y={selection.y}
                      width={selection.width}
                      height={selection.height}
                      fill="#14b8a633"
                      stroke="#ffffff"
                      strokeWidth={2}
                      strokeDasharray="6 3"
                      className="cursor-move"
                    />
                    {handles.map(([handle, x, y]) => (
                      <rect
                        key={handle}
                        data-handle={handle}
                        x={selection.x + x * selection.width - 7}
                        y={selection.y + y * selection.height - 7}
                        width={14}
                        height={14}
                        rx={2}
                        fill="#0d9488"
                        stroke="white"
                        strokeWidth={2}
                        style={{ cursor: `${handle}-resize` }}
                      />
                    ))}
                  </>
                )}
              </svg>
            </div>
          </div>
          {mode === 'polygon' ? (
            <>
              <p className="my-3 text-xs text-slate-500 dark:text-slate-400">
                {points.length} pontos · {closed ? 'Polígono fechado' : 'Em construção'}
                {closed ? ` · ${clipped.length} vértices após clipping` : ''}
              </p>
              <div className="mb-3 flex flex-wrap gap-2">
                <button
                  className={`${secondary} disabled:opacity-40`}
                  disabled={closed || points.length < 3}
                  onClick={() => setClosed(true)}
                >
                  Fechar polígono
                </button>
                <button
                  className={`${secondary} disabled:opacity-40`}
                  disabled={!points.length}
                  onClick={() => {
                    setPoints((p) => p.slice(0, -1));
                    setClosed(false);
                  }}
                >
                  Desfazer ponto
                </button>
                <button
                  className={secondary}
                  onClick={() => {
                    setPoints([]);
                    setClosed(false);
                    setError('');
                  }}
                >
                  Limpar polígono
                </button>
              </div>
            </>
          ) : (
            <p className="my-3 text-xs tabular-nums text-slate-500 dark:text-slate-400">
              x {Math.round(selection.x)} · y {Math.round(selection.y)} ·{' '}
              {Math.round(selection.width)} × {Math.round(selection.height)} px
            </p>
          )}
          <button
            className={button}
            disabled={
              mode === 'polygon'
                ? !closed || points.length < 3
                : selection.width < 1 || selection.height < 1
            }
            onClick={cut}
          >
            Recortar
          </button>
        </section>
        <section className={panel}>
          <h2 className="mb-3 font-semibold">2. Recorte</h2>
          {result ? (
            <div className="flex min-h-[220px] items-center justify-center overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">
              <Pixels image={result} label="Recorte transformado e filtrado" />
            </div>
          ) : (
            <div className="flex min-h-[280px] items-center justify-center rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
              Selecione parte da capa e clique em Recortar para transformar e analisar somente essa
              área.
            </div>
          )}
          <fieldset disabled={!crop} className="mt-4 space-y-3 disabled:opacity-40">
            <label className="block text-sm">
              Rotação: {angle}°
              <input
                aria-label="Rotação do recorte"
                type="range"
                min={-180}
                max={180}
                value={angle}
                onChange={(e) => setAngle(Number(e.target.value))}
                className="block w-full accent-brand-600"
              />
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                className={secondary}
                onClick={() => setAngle((v) => ((v - 90 + 540) % 360) - 180)}
              >
                −90°
              </button>
              <button
                className={secondary}
                onClick={() => setAngle((v) => ((v + 90 + 540) % 360) - 180)}
              >
                +90°
              </button>
              <button
                className={secondary}
                aria-pressed={flipH}
                onClick={() => setFlipH((v) => !v)}
              >
                Espelhar H
              </button>
              <button
                className={secondary}
                aria-pressed={flipV}
                onClick={() => setFlipV((v) => !v)}
              >
                Espelhar V
              </button>
            </div>
            <label className="block text-sm">
              Zoom: {zoom.toFixed(2)}×
              <input
                aria-label="Zoom do recorte"
                type="range"
                min={0.25}
                max={3}
                step={0.05}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="block w-full accent-brand-600"
              />
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                className={secondary}
                onClick={() => {
                  reset();
                  onReset();
                }}
              >
                Resetar
              </button>
              <button className={button} onClick={download}>
                Baixar PNG
              </button>
            </div>
          </fieldset>
          {transformed && (
            <div className="mt-4">
              <h3 className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Matriz afim 2×3 · origem → resultado (coordenadas de borda)
              </h3>
              <pre className="mt-1 overflow-auto rounded-lg bg-slate-100 p-2 text-xs dark:bg-slate-800">{`[ ${transformed.matrix
                .slice(0, 3)
                .map((v) => v.toFixed(3))
                .join('  ')} ]\n[ ${transformed.matrix
                .slice(3)
                .map((v) => v.toFixed(3))
                .join('  ')} ]`}</pre>
            </div>
          )}
          {error && (
            <p role="alert" className="mt-2 text-sm text-red-600">
              {error}
            </p>
          )}
        </section>
      </div>
      {analysis && result && (
        <>
          <section className={panel} aria-label="Análise do recorte">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-semibold">3. Análise do recorte</h2>
              <span className="text-sm">
                {result.width} × {result.height} px · {analysis.count.toLocaleString('pt-BR')}{' '}
                pixels visíveis
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Transformação → filtro → análise. Pixels totalmente transparentes são ignorados.
            </p>
            <div className="mt-4 grid gap-4 xl:grid-cols-2">
              <div>
                <button className={secondary} onClick={() => setChannels((v) => !v)}>
                  {channels ? 'Ver luminância' : 'Ver RGB'}
                </button>
                <HistogramChart histogram={analysis.histogram} showChannels={channels} />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-right text-sm">
                  <thead>
                    <tr>
                      {['Canal', 'Média', 'Mín.', 'Máx.', 'Desvio'].map((x) => (
                        <th className="p-2" key={x}>
                          {x}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {analysis.channels.map((ch, i) => (
                      <tr className="border-t border-slate-200 dark:border-slate-700" key={i}>
                        <th className="p-2">{['R', 'G', 'B', 'Luma'][i]}</th>
                        {[ch.mean, ch.min, ch.max, ch.std].map((v, j) => (
                          <td className="p-2 tabular-nums" key={j}>
                            {v.toFixed(1)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
          <section className={panel} aria-label="Prévia 3D do recorte">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-semibold">4. Recorte em 3D</h2>
              <button className={button} onClick={() => setShow3d((v) => !v)}>
                {show3d ? 'Ocultar 3D' : 'Ativar prévia 3D'}
              </button>
            </div>
            <p className="my-2 text-xs text-slate-500 dark:text-slate-400">
              Textura do resultado atual. Arraste para orbitar; use a roda ou pinça para aproximar.
            </p>
            {show3d && (
              <div className="h-80 overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
                <Canvas frameloop="demand" camera={{ position: [0, 0, 4], near: 0.1, far: 30 }}>
                  <CropPlane image={result} />
                  <OrbitControls />
                </Canvas>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
