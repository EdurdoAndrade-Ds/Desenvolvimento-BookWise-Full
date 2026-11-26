import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { DoubleSide, FrontSide, Mesh } from 'three';
import {
  DEFAULT_GRAPHICS_FLAGS,
  GraphicsDebugContext,
  useGraphicsDebug,
  type GraphicsFlags,
} from '../../graphics/debugState';
import { isGraphicsDebug } from '../../graphics/sceneMath';

interface Stats {
  fps: number;
  calls: number;
  triangles: number;
}

const LABELS: Record<keyof GraphicsFlags, string> = {
  frustum: 'Frustum culling',
  backface: 'Back-face culling',
  lod: 'LOD',
  clipping: 'Plano de corte (modal)',
};

export default function GraphicsDebug({ children }: { children: ReactNode }) {
  const [enabled] = useState(() => isGraphicsDebug(window.location.search));
  const [flags, setFlags] = useState(DEFAULT_GRAPHICS_FLAGS);
  const [stats, setStats] = useState<Stats>({ fps: 0, calls: 0, triangles: 0 });
  const report = useCallback((next: Stats) => setStats(next), []);

  return (
    <GraphicsDebugContext.Provider value={{ enabled, flags }}>
      <div className="relative h-full w-full">
        <StatsReporterContext.Provider value={report}>{children}</StatsReporterContext.Provider>
        {enabled && (
          <div
            data-graphics-debug
            className="absolute left-3 top-3 z-20 rounded-lg border border-cream-200 bg-cream-50/95 p-3 text-xs text-slate-800 shadow"
          >
            <p className="font-semibold">Debug 3D</p>
            <p className="my-2 tabular-nums" data-graphics-stats>
              FPS {stats.fps} · Draw calls {stats.calls} · Triangles {stats.triangles}
            </p>
            {Object.entries(LABELS).map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 py-0.5">
                <input
                  type="checkbox"
                  checked={flags[key as keyof GraphicsFlags]}
                  onChange={(event) =>
                    setFlags((current) => ({ ...current, [key]: event.target.checked }))
                  }
                />
                {label}
              </label>
            ))}
            <p className="mt-2 text-[10px]">Zoom/arraste para testar o frustum.</p>
          </div>
        )}
      </div>
    </GraphicsDebugContext.Provider>
  );
}

const StatsReporterContext = createContext<(stats: Stats) => void>(() => {});

export function GraphicsFrame() {
  const { enabled } = useGraphicsDebug();
  return enabled ? <MeasuredFrame /> : null;
}

function MeasuredFrame() {
  const { gl } = useThree();
  const { flags } = useGraphicsDebug();
  const report = useContext(StatsReporterContext);
  const sample = useRef({ elapsed: 0, frames: 0 });

  useEffect(() => {
    const autoReset = gl.info.autoReset;
    gl.info.autoReset = false;
    return () => {
      gl.info.autoReset = autoReset;
    };
  }, [gl]);

  useFrame(({ scene, camera }, delta) => {
    scene.traverse((object) => {
      if (!(object instanceof Mesh)) return;
      object.frustumCulled = flags.frustum;
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      const side = flags.backface ? FrontSide : DoubleSide;
      for (const material of materials) {
        if (material.side !== side) {
          material.side = side;
          material.needsUpdate = true;
        }
      }
    });
    gl.info.reset();
    gl.render(scene, camera);
    sample.current.elapsed += delta;
    sample.current.frames += 1;
    if (sample.current.elapsed >= 0.4) {
      report({
        fps: Math.round(sample.current.frames / sample.current.elapsed),
        calls: gl.info.render.calls,
        triangles: gl.info.render.triangles,
      });
      sample.current = { elapsed: 0, frames: 0 };
    }
  }, 1);
  return null;
}
