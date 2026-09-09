import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, OrthographicCamera, PerspectiveCamera } from '@react-three/drei';
import Book3D, { type BookMaterialSettings } from './Book3D';
import type { ShelfBook, ShelfLayout } from '../../graphics/shelfLayout';

const FLOOR_SIZE = 40;
const WOOD_COLOR = '#8b5a2b';
const FLOOR_COLOR = '#1e293b';
const SIDE_PANEL_THICKNESS = 0.2;
const CAMERA_DISTANCE_FACTOR = 1.15;
const CAMERA_MIN_DISTANCE = 5;
const ORTHOGRAPHIC_ZOOM_FACTOR = 380;
const AMBIENT_RATIO = 0.35;
const KEY_LIGHT_POSITION: [number, number, number] = [4, 6, 6];
const SHADOW_MAP_SIZE = 2048;

/** Ajustes de camera, luz e material expostos no painel de controles. */
export interface SceneSettings extends BookMaterialSettings {
  lightIntensity: number;
  shadows: boolean;
  orthographic: boolean;
}

interface Bookshelf3DProps {
  layout: ShelfLayout;
  settings: SceneSettings;
  selectedBookId: number | null;
  onSelect: (entry: ShelfBook) => void;
}

/** Indica se o navegador tem contexto WebGL, para exibir um fallback textual. */
export function isWebGLAvailable(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(
      window.WebGLRenderingContext
        && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')),
    );
  } catch {
    return false;
  }
}

/**
 * Cena WebGL da estante: malhas da estrutura, livros posicionados pelo layout,
 * iluminacao com mapa de sombras e camera orbital (perspectiva ou ortografica).
 */
export default function Bookshelf3D({
  layout,
  settings,
  selectedBookId,
  onSelect,
}: Bookshelf3DProps) {
  // A estante e desenhada com o topo em y=0 e cresce para baixo: deslocamos o
  // grupo para que o centro geometrico fique na origem, alvo da camera orbital.
  const verticalCenter = -(layout.topY + layout.bottomY) / 2;
  const structureHeight = layout.height;
  const framing = Math.max(layout.width + 1, structureHeight + 1);
  const distance = Math.max(CAMERA_MIN_DISTANCE, framing * CAMERA_DISTANCE_FACTOR);
  const cameraPosition: [number, number, number] = [distance * 0.35, distance * 0.25, distance];

  return (
    <Canvas shadows dpr={[1, 2]} className="rounded-2xl">
      {settings.orthographic ? (
        <OrthographicCamera
          makeDefault
          position={[0, 0, distance]}
          zoom={ORTHOGRAPHIC_ZOOM_FACTOR / framing}
        />
      ) : (
        <PerspectiveCamera makeDefault position={cameraPosition} fov={45} />
      )}
      <OrbitControls makeDefault enablePan target={[0, 0, 0]} />

      <color attach="background" args={['#0f172a']} />
      <ambientLight intensity={settings.lightIntensity * AMBIENT_RATIO} />
      <directionalLight
        position={KEY_LIGHT_POSITION}
        intensity={settings.lightIntensity}
        castShadow={settings.shadows}
        shadow-mapSize-width={SHADOW_MAP_SIZE}
        shadow-mapSize-height={SHADOW_MAP_SIZE}
      />

      <Suspense fallback={null}>
        <group position={[0, verticalCenter, 0]}>
          {layout.boards.map((board) => (
            <mesh key={board.index} position={[0, board.y, 0]} castShadow receiveShadow>
              <boxGeometry args={[board.width + SIDE_PANEL_THICKNESS * 2, board.thickness, board.depth]} />
              <meshStandardMaterial color={WOOD_COLOR} roughness={0.8} />
            </mesh>
          ))}

          {[-1, 1].map((side) => (
            <mesh
              key={side}
              position={[
                side * (layout.width / 2 + SIDE_PANEL_THICKNESS / 2),
                (layout.topY + layout.bottomY) / 2,
                0,
              ]}
              castShadow
              receiveShadow
            >
              <boxGeometry args={[SIDE_PANEL_THICKNESS, structureHeight, layout.depth + 0.1]} />
              <meshStandardMaterial color={WOOD_COLOR} roughness={0.8} />
            </mesh>
          ))}

          {layout.books.map((entry) => (
            <Book3D
              key={entry.book.id}
              entry={entry}
              selected={entry.book.id === selectedBookId}
              settings={settings}
              onSelect={onSelect}
            />
          ))}
        </group>

        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, verticalCenter + layout.bottomY - 0.02, 0]}
          receiveShadow
        >
          <planeGeometry args={[FLOOR_SIZE, FLOOR_SIZE]} />
          <meshStandardMaterial color={FLOOR_COLOR} roughness={1} />
        </mesh>
      </Suspense>
    </Canvas>
  );
}
