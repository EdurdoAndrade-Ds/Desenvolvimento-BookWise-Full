import { Suspense, useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, type ThreeEvent } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { Color } from 'three';
import type { Group, Texture } from 'three';
import type { Book } from '../../types/api';
import { facedCoverColor } from '../../graphics/storefrontShelf';
import {
  createBackCoverTexture,
  createCoverTexture,
  createPageTexture,
} from '../../graphics/coverTexture';

const BOOK_WIDTH = 2.2;
const BOOK_HEIGHT = 3.2;
const BOOK_DEPTH = 0.5;
const COVER_THICKNESS = 0.12;
const COVER_OVERHANG = 0.06;
const HINGE_WIDTH = 0.22;
const COVER_OPEN_ANGLE = -2.3;
const COVER_LERP = 0.12;
const COVER_EPSILON = 0.01;
const FACE_COUNT = 6;
const FRONT_FACE_INDEX = 4;
const BACK_FACE_INDEX = 5;
const SPINE_FACE_INDEX = 1;
const PAGE_EDGE_COLOR = '#f2e9da';
const CAMERA_POSITION: [number, number, number] = [0, 0, 6];
const MIN_ZOOM_DISTANCE = 3.5;
const MAX_ZOOM_DISTANCE = 9;

interface BookViewer3DProps {
  book: Book;
  coverOpen: boolean;
  onCoverClick: () => void;
}

/**
 * Livro em destaque: arraste para girar, use o scroll para aproximar e clique
 * na capa para abri-la.
 */
export default function BookViewer3D({ book, coverOpen, onCoverClick }: BookViewer3DProps) {
  return (
    <Canvas dpr={[1, 2]}>
      <PerspectiveCamera makeDefault position={CAMERA_POSITION} fov={42} />
      <OrbitControls
        makeDefault
        enablePan={false}
        minDistance={MIN_ZOOM_DISTANCE}
        maxDistance={MAX_ZOOM_DISTANCE}
      />
      <ambientLight intensity={1.2} />
      <directionalLight position={[4, 5, 6]} intensity={2} />
      <pointLight position={[-4, 1, 4]} intensity={2.5} color="#d7ad88" distance={20} />
      <Suspense fallback={null}>
        <OpenableBook book={book} coverOpen={coverOpen} onCoverClick={onCoverClick} />
      </Suspense>
    </Canvas>
  );
}

/** Miolo em tom de papel; lombada e contracapa recebem a cor do livro. */
function faceColor(face: number, color: string): string {
  if (face === SPINE_FACE_INDEX) return color;
  if (face === FRONT_FACE_INDEX || face === BACK_FACE_INDEX) return '#ffffff';
  return PAGE_EDGE_COLOR;
}

/** Tom mais fechado da cor do livro para bordas, verso da capa e dobradica. */
function shade(color: string, factor: number): string {
  return `#${new Color(color).multiplyScalar(factor).getHexString()}`;
}

/** Capa com volume: face externa recebe a arte e o resto (bordas e verso) fica pintado. */
function coverFaceColor(face: number, color: string): string {
  if (face === FRONT_FACE_INDEX) return '#ffffff';
  return shade(color, 0.7);
}

function faceTexture(
  face: number,
  pageTexture: Texture,
  backCoverTexture: Texture,
): Texture | null {
  if (face === FRONT_FACE_INDEX) return pageTexture;
  if (face === BACK_FACE_INDEX) return backCoverTexture;
  return null;
}

function OpenableBook({ book, coverOpen, onCoverClick }: BookViewer3DProps) {
  const hinge = useRef<Group>(null);
  const color = useMemo(() => facedCoverColor(book), [book]);
  const coverTexture = useMemo(
    () => createCoverTexture({ title: book.title, author: book.author, background: color }),
    [book.title, book.author, color],
  );
  const pageTexture = useMemo(
    () => createPageTexture({ title: book.title, author: book.author, background: color }),
    [book.title, book.author, color],
  );
  const backCoverTexture = useMemo(
    () => createBackCoverTexture({ title: book.title, author: book.author, background: color }),
    [book.title, book.author, color],
  );

  useEffect(
    () => () => {
      coverTexture.dispose();
      pageTexture.dispose();
      backCoverTexture.dispose();
    },
    [coverTexture, pageTexture, backCoverTexture],
  );

  useFrame(() => {
    if (!hinge.current) return;
    const target = coverOpen ? COVER_OPEN_ANGLE : 0;
    hinge.current.rotation.y += (target - hinge.current.rotation.y) * COVER_LERP;
  });

  const handleCoverClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    onCoverClick();
  };

  return (
    <group>
      <mesh>
        <boxGeometry args={[BOOK_WIDTH, BOOK_HEIGHT, BOOK_DEPTH]} />
        {Array.from({ length: FACE_COUNT }, (_, face) => (
          <meshStandardMaterial
            key={face}
            attach={`material-${face}`}
            color={faceColor(face, color)}
            map={faceTexture(face, pageTexture, backCoverTexture)}
            roughness={0.75}
          />
        ))}
      </mesh>

      <mesh position={[-BOOK_WIDTH / 2, 0, 0]}>
        <boxGeometry
          args={[HINGE_WIDTH, BOOK_HEIGHT + COVER_OVERHANG, BOOK_DEPTH + COVER_THICKNESS * 2]}
        />
        <meshStandardMaterial color={shade(color, 0.55)} roughness={1} />
      </mesh>

      <group
        ref={hinge}
        position={[-BOOK_WIDTH / 2, 0, BOOK_DEPTH / 2 + COVER_EPSILON + COVER_THICKNESS / 2]}
      >
        <mesh position={[BOOK_WIDTH / 2, 0, 0]} onClick={handleCoverClick}>
          <boxGeometry args={[BOOK_WIDTH, BOOK_HEIGHT + COVER_OVERHANG, COVER_THICKNESS]} />
          {Array.from({ length: FACE_COUNT }, (_, face) => (
            <meshStandardMaterial
              key={face}
              attach={`material-${face}`}
              color={coverFaceColor(face, color)}
              map={face === FRONT_FACE_INDEX ? coverTexture : null}
              roughness={face === FRONT_FACE_INDEX ? 0.55 : 0.8}
            />
          ))}
        </mesh>
      </group>
    </group>
  );
}
