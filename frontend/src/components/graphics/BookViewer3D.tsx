import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { CanvasTexture, Color, DoubleSide, FrontSide, Plane, Vector3 } from 'three';
import type { Group, Texture } from 'three';
import type { Book } from '../../types/api';
import { facedCoverColor } from '../../graphics/storefrontShelf';
import { useGraphicsDebug } from '../../graphics/debugState';
import { cutHeight, revealProgress } from '../../graphics/sceneMath';
import GraphicsDebug, { GraphicsFrame } from './GraphicsDebug';
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
const COVER_OFFSET = BOOK_DEPTH / 2 + COVER_EPSILON + COVER_THICKNESS / 2;
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
  const [cut, setCut] = useState(0);

  return (
    <GraphicsDebug>
      <Canvas dpr={[1, 2]} gl={{ localClippingEnabled: true }}>
        <PerspectiveCamera makeDefault position={CAMERA_POSITION} fov={42} near={0.1} far={30} />
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
          <OpenableBook book={book} coverOpen={coverOpen} onCoverClick={onCoverClick} cut={cut} />
        </Suspense>
        <GraphicsFrame />
      </Canvas>
      <div className="absolute bottom-5 left-1/2 z-10 w-56 -translate-x-1/2 rounded-xl border border-cream-200 bg-cream-50/95 px-4 py-3 text-xs text-slate-700 shadow-sm sm:left-6 sm:translate-x-0">
        <label className="flex items-center justify-between" htmlFor="book-section">
          <span>Espiar por dentro</span>
          <span className="tabular-nums">{Math.round(cut * 100)}%</span>
        </label>
        <input
          id="book-section"
          aria-label="Espiar por dentro"
          type="range"
          min="0"
          max="100"
          value={Math.round(cut * 100)}
          onChange={(event) => setCut(Number(event.target.value) / 100)}
          className="mt-2 w-full accent-[#8a6b4f]"
        />
        <p className="mt-1 text-[10px] text-slate-500">Arraste o livro para observar o corte.</p>
      </div>
    </GraphicsDebug>
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
function coverFaceColor(face: number, color: string, outerFace = FRONT_FACE_INDEX): string {
  if (face === outerFace) return '#ffffff';
  return shade(color, 0.7);
}

function faceTexture(face: number, pageTexture: Texture): Texture | null {
  if (face === FRONT_FACE_INDEX || face === BACK_FACE_INDEX) return pageTexture;
  return null;
}

function OpenableBook({ book, coverOpen, onCoverClick, cut }: BookViewer3DProps & { cut: number }) {
  const hinge = useRef<Group>(null);
  const anisotropy = useThree((state) => state.gl.capabilities.getMaxAnisotropy());
  const { flags } = useGraphicsDebug();
  const [reducedMotion, setReducedMotion] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  const elapsed = useRef(0);
  const halfHeight = (BOOK_HEIGHT + COVER_OVERHANG) / 2 + 0.02;
  const revealPlane = useMemo(() => new Plane(new Vector3(0, -1, 0), -halfHeight), [halfHeight]);
  const sectionPlane = useMemo(() => new Plane(new Vector3(0, -1, 0), halfHeight), [halfHeight]);
  const clippingPlanes = useMemo(
    () => (flags.clipping ? [revealPlane, sectionPlane] : []),
    [flags.clipping, revealPlane, sectionPlane],
  );
  const capPlanes = useMemo(
    () => (flags.clipping ? [revealPlane] : []),
    [flags.clipping, revealPlane],
  );
  const side = flags.backface ? FrontSide : DoubleSide;
  const sectionY = cutHeight(cut, halfHeight);
  sectionPlane.constant = sectionY;
  const showSection = flags.clipping && cut > 0 && cut < 1 && Math.abs(sectionY) < BOOK_HEIGHT / 2;
  const sectionTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const context = canvas.getContext('2d');
    if (context) {
      context.fillStyle = PAGE_EDGE_COLOR;
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.strokeStyle = '#cfc5b3';
      context.lineWidth = 1;
      for (let y = 2; y < canvas.height; y += 4) {
        context.beginPath();
        context.moveTo(0, y);
        context.lineTo(canvas.width, y);
        context.stroke();
      }
    }
    return new CanvasTexture(canvas);
  }, []);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(query.matches);
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  useEffect(() => () => sectionTexture.dispose(), [sectionTexture]);
  const color = useMemo(() => facedCoverColor(book), [book]);
  const coverTexture = useMemo(
    () =>
      createCoverTexture({ title: book.title, author: book.author, background: color, anisotropy }),
    [book.title, book.author, color, anisotropy],
  );
  const pageTexture = useMemo(
    () =>
      createPageTexture({ title: book.title, author: book.author, background: color, anisotropy }),
    [book.title, book.author, color, anisotropy],
  );
  const backCoverTexture = useMemo(
    () =>
      createBackCoverTexture({
        title: book.title,
        author: book.author,
        background: color,
        anisotropy,
      }),
    [book.title, book.author, color, anisotropy],
  );

  useEffect(
    () => () => {
      coverTexture.dispose();
      pageTexture.dispose();
      backCoverTexture.dispose();
    },
    [coverTexture, pageTexture, backCoverTexture],
  );

  useFrame((_, delta) => {
    elapsed.current += Math.min(delta, 0.1);
    revealPlane.constant = cutHeight(
      1 - revealProgress(elapsed.current, reducedMotion),
      halfHeight,
    );
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
            side={side}
            clippingPlanes={clippingPlanes}
            key={face}
            attach={`material-${face}`}
            color={faceColor(face, color)}
            map={faceTexture(face, pageTexture)}
            roughness={0.75}
          />
        ))}
      </mesh>

      <mesh name="back-cover" position={[0, 0, -COVER_OFFSET]}>
        <boxGeometry args={[BOOK_WIDTH, BOOK_HEIGHT + COVER_OVERHANG, COVER_THICKNESS]} />
        {Array.from({ length: FACE_COUNT }, (_, face) => (
          <meshStandardMaterial
            key={face}
            attach={`material-${face}`}
            side={side}
            clippingPlanes={clippingPlanes}
            color={coverFaceColor(face, color, BACK_FACE_INDEX)}
            map={face === BACK_FACE_INDEX ? backCoverTexture : null}
            toneMapped={face !== BACK_FACE_INDEX}
            roughness={face === BACK_FACE_INDEX ? 0.55 : 0.8}
          />
        ))}
      </mesh>

      <mesh position={[-BOOK_WIDTH / 2, 0, 0]}>
        <boxGeometry
          args={[HINGE_WIDTH, BOOK_HEIGHT + COVER_OVERHANG, BOOK_DEPTH + COVER_THICKNESS * 2]}
        />
        <meshStandardMaterial
          color={shade(color, 0.55)}
          roughness={1}
          side={side}
          clippingPlanes={clippingPlanes}
        />
      </mesh>

      {showSection && (
        <group position={[0, sectionY, 0]}>
          <mesh name="back-cover-section" position={[0, 0, -COVER_OFFSET]}>
            <boxGeometry args={[BOOK_WIDTH, 0.006, COVER_THICKNESS]} />
            <meshStandardMaterial
              color={shade(color, 0.7)}
              side={FrontSide}
              clippingPlanes={capPlanes}
            />
          </mesh>
          <mesh>
            <boxGeometry args={[BOOK_WIDTH, 0.004, BOOK_DEPTH]} />
            <meshStandardMaterial
              map={sectionTexture}
              roughness={1}
              side={FrontSide}
              clippingPlanes={capPlanes}
            />
          </mesh>
          <mesh position={[-BOOK_WIDTH / 2, 0, 0]}>
            <boxGeometry args={[HINGE_WIDTH, 0.006, BOOK_DEPTH + COVER_THICKNESS * 2]} />
            <meshStandardMaterial
              color={shade(color, 0.55)}
              side={FrontSide}
              clippingPlanes={capPlanes}
            />
          </mesh>
        </group>
      )}

      <group ref={hinge} position={[-BOOK_WIDTH / 2, 0, COVER_OFFSET]}>
        <mesh position={[BOOK_WIDTH / 2, 0, 0]} onClick={handleCoverClick}>
          <boxGeometry args={[BOOK_WIDTH, BOOK_HEIGHT + COVER_OVERHANG, COVER_THICKNESS]} />
          {Array.from({ length: FACE_COUNT }, (_, face) => (
            <meshStandardMaterial
              side={side}
              clippingPlanes={clippingPlanes}
              key={face}
              attach={`material-${face}`}
              color={coverFaceColor(face, color)}
              map={face === FRONT_FACE_INDEX ? coverTexture : null}
              toneMapped={face !== FRONT_FACE_INDEX}
              roughness={face === FRONT_FACE_INDEX ? 0.55 : 0.8}
            />
          ))}
        </mesh>
        {showSection && (
          <mesh position={[BOOK_WIDTH / 2, sectionY, 0]}>
            <boxGeometry args={[BOOK_WIDTH, 0.006, COVER_THICKNESS]} />
            <meshStandardMaterial
              color={shade(color, 0.7)}
              side={FrontSide}
              clippingPlanes={capPlanes}
            />
          </mesh>
        )}
      </group>
    </group>
  );
}
