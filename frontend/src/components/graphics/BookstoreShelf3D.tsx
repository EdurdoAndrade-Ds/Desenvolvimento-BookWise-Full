import { Suspense, useEffect, useMemo, useState } from 'react';
import { Canvas, useThree, type ThreeEvent } from '@react-three/fiber';
import { Detailed, OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { DoubleSide, FrontSide } from 'three';
import type { PerspectiveCamera as ThreePerspectiveCamera, Texture } from 'three';
import type { Book } from '../../types/api';
import { useGraphicsDebug } from '../../graphics/debugState';
import { lodDistance } from '../../graphics/sceneMath';
import GraphicsDebug, { GraphicsFrame } from './GraphicsDebug';
import { createCoverTexture, createShelfLabelTexture } from '../../graphics/coverTexture';
import {
  buildStorefrontShelf,
  FACED_BOOK_DEPTH,
  FACED_BOOK_HEIGHT,
  FACED_BOOK_STEP,
  FACED_BOOK_WIDTH,
  type FacedBoard,
  type FacedBook,
} from '../../graphics/storefrontShelf';

const WOOD_COLOR = '#8a5230';
const WOOD_EDGE_COLOR = '#5d3419';
const BACK_COLOR = '#1d0f07';
const FRONT_FACE_INDEX = 4;
const FACE_COUNT = 6;
const HOVER_OFFSET = 0.22;
const CAMERA_FOV = 38;
const FRAMING_PADDING = 1.02;
const MIN_VISIBLE_BOOKS = 4;
// Sobra de madeira para a estrutura transbordar o quadro em qualquer largura.
const STRUCTURE_BLEED = 14;
const HEADROOM = 0.8;
const LABEL_HEIGHT = 0.24;
const LABEL_WIDTH = LABEL_HEIGHT * 8;
const KEY_LIGHT_POSITION: [number, number, number] = [3, 4, 7];
const WARM_LIGHT_POSITION: [number, number, number] = [-3, 1, 4];

interface BookstoreShelf3DProps {
  books: Book[];
  booksPerRow?: number;
  rows?: number;
  onSelect: (book: Book) => void;
}

/**
 * Vitrine 3D da livraria: os livros do catalogo aparecem com a capa de frente,
 * destacam-se no hover e abrem a experiencia do livro ao clique.
 */
export default function BookstoreShelf3D({
  books,
  booksPerRow = 9,
  rows = 2,
  onSelect,
}: BookstoreShelf3DProps) {
  const shelf = useMemo(
    () => buildStorefrontShelf(books, booksPerRow, rows),
    [books, booksPerRow, rows],
  );
  const verticalCenter = -(shelf.topY + shelf.bottomY) / 2;
  const minVisibleWidth = Math.min(shelf.width, MIN_VISIBLE_BOOKS * FACED_BOOK_STEP);

  return (
    <GraphicsDebug>
      <Canvas dpr={[1, 2]}>
        <PerspectiveCamera
          makeDefault
          position={[0, 0, shelf.width]}
          fov={CAMERA_FOV}
          near={0.1}
          far={100}
        />
        <FitCamera minWidth={minVisibleWidth} height={shelf.height + HEADROOM} />
        <DebugCamera />
        <color attach="background" args={[BACK_COLOR]} />
        <ambientLight intensity={1.5} />
        <directionalLight position={KEY_LIGHT_POSITION} intensity={1.3} />
        <pointLight position={WARM_LIGHT_POSITION} intensity={10} color="#e6c7a6" distance={26} />

        <Suspense fallback={null}>
          <group position={[0, verticalCenter, 0]}>
            <mesh position={[0, shelf.topY - shelf.height / 2, -shelf.depth / 2]}>
              <boxGeometry
                args={[shelf.width + STRUCTURE_BLEED, shelf.height + FACED_BOOK_HEIGHT * 3, 0.15]}
              />
              <meshStandardMaterial color={BACK_COLOR} roughness={1} />
            </mesh>

            {shelf.boards.map((board) => (
              <ShelfBoardMesh key={board.index} board={board} backDepth={shelf.depth} />
            ))}

            <ShelfBooks entries={shelf.books} onSelect={onSelect} />
          </group>
        </Suspense>
        <GraphicsFrame />
      </Canvas>
    </GraphicsDebug>
  );
}

function DebugCamera() {
  const { enabled } = useGraphicsDebug();
  return enabled ? <OrbitControls makeDefault minDistance={2} maxDistance={70} /> : null;
}

/**
 * Aproxima a camera ate a altura da vitrine preencher o quadro, recuando so o
 * necessario para manter um minimo de livros visiveis em telas estreitas.
 */
function FitCamera({ minWidth, height }: { minWidth: number; height: number }) {
  const camera = useThree((state) => state.camera) as ThreePerspectiveCamera;
  const size = useThree((state) => state.size);

  useEffect(() => {
    const halfFov = ((CAMERA_FOV / 2) * Math.PI) / 180;
    const aspect = size.height > 0 ? size.width / size.height : 1;
    const verticalFit = height / 2 / Math.tan(halfFov);
    const horizontalFit = minWidth / 2 / Math.tan(halfFov) / aspect;
    camera.position.set(0, 0, Math.max(verticalFit, horizontalFit) * FRAMING_PADDING);
    camera.updateProjectionMatrix();
  }, [camera, size.width, size.height, minWidth, height]);

  return null;
}

/** Tabua com o friso frontal e a etiqueta da fileira no fundo da vitrine. */
function ShelfBoardMesh({ board, backDepth }: { board: FacedBoard; backDepth: number }) {
  const label = `PRATELEIRA ${String(board.index + 1).padStart(2, '0')}`;
  const texture = useMemo(() => createShelfLabelTexture(label), [label]);

  useEffect(() => () => texture.dispose(), [texture]);

  return (
    <group position={[0, board.y, 0]}>
      <mesh>
        <boxGeometry args={[board.width + STRUCTURE_BLEED, board.thickness, board.depth]} />
        <meshStandardMaterial color={WOOD_COLOR} roughness={0.85} />
      </mesh>
      <mesh position={[0, 0, board.depth / 2]}>
        <boxGeometry args={[board.width + STRUCTURE_BLEED, board.thickness * 1.6, 0.08]} />
        <meshStandardMaterial color={WOOD_EDGE_COLOR} roughness={0.9} />
      </mesh>
      <mesh
        position={[
          board.width / 2 - LABEL_WIDTH / 2 - 0.3,
          board.thickness / 2 + FACED_BOOK_HEIGHT + LABEL_HEIGHT,
          -backDepth / 2 + 0.1,
        ]}
      >
        <planeGeometry args={[LABEL_WIDTH, LABEL_HEIGHT]} />
        <meshBasicMaterial map={texture} transparent depthWrite={false} />
      </mesh>
    </group>
  );
}

function ShelfBooks({
  entries,
  onSelect,
}: {
  entries: FacedBook[];
  onSelect: (book: Book) => void;
}) {
  const anisotropy = useThree((state) => state.gl.capabilities.getMaxAnisotropy());
  const textures = useMemo(() => {
    const result = new Map<Book, Texture>();
    for (const { book, color } of entries) {
      if (!result.has(book)) {
        result.set(
          book,
          createCoverTexture({
            title: book.title,
            author: book.author,
            background: color,
            anisotropy,
          }),
        );
      }
    }
    return result;
  }, [entries, anisotropy]);

  useEffect(() => () => textures.forEach((texture) => texture.dispose()), [textures]);

  return entries.map((entry) => (
    <FacedBookMesh
      key={entry.key}
      entry={entry}
      texture={textures.get(entry.book)!}
      onSelect={onSelect}
    />
  ));
}

function FacedBookMesh({
  entry,
  texture,
  onSelect,
}: {
  entry: FacedBook;
  texture: Texture;
  onSelect: (book: Book) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const { flags } = useGraphicsDebug();
  const side = flags.backface ? FrontSide : DoubleSide;

  useEffect(() => {
    if (!hovered) return;
    document.body.style.cursor = 'pointer';
    return () => {
      document.body.style.cursor = '';
    };
  }, [hovered]);

  const [x, y, z] = entry.position;

  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    onSelect(entry.book);
  };

  return (
    <group
      position={[x, hovered ? y + HOVER_OFFSET / 2 : y, hovered ? z + HOVER_OFFSET : z]}
      onClick={handleClick}
      onPointerOver={(event) => {
        event.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
    >
      <Detailed distances={[0, lodDistance(flags.lod, hovered)]}>
        <mesh frustumCulled={flags.frustum}>
          <boxGeometry
            args={[FACED_BOOK_WIDTH, FACED_BOOK_HEIGHT, FACED_BOOK_DEPTH]}
            onUpdate={(geometry) => geometry.computeBoundingSphere()}
          />
          {Array.from({ length: FACE_COUNT }, (_, face) => (
            <meshStandardMaterial
              key={face}
              attach={`material-${face}`}
              side={side}
              color={face === FRONT_FACE_INDEX ? '#ffffff' : entry.color}
              map={face === FRONT_FACE_INDEX ? texture : null}
              toneMapped={face !== FRONT_FACE_INDEX}
              roughness={0.6}
              emissive={entry.color}
              emissiveIntensity={hovered ? 0.28 : 0}
            />
          ))}
        </mesh>
        <mesh frustumCulled={flags.frustum}>
          <boxGeometry
            args={[FACED_BOOK_WIDTH, FACED_BOOK_HEIGHT, FACED_BOOK_DEPTH]}
            onUpdate={(geometry) => geometry.computeBoundingSphere()}
          />
          <meshStandardMaterial
            map={texture}
            color="#ffffff"
            side={side}
            roughness={0.6}
            toneMapped={false}
          />
        </mesh>
      </Detailed>
    </group>
  );
}
