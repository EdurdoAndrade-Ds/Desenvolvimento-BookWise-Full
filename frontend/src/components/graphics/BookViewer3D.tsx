import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import {
  ContactShadows,
  Environment,
  Html,
  Lightformer,
  OrbitControls,
  PerspectiveCamera,
} from '@react-three/drei';
import {
  BackSide,
  CylinderGeometry,
  FrontSide,
  PlaneGeometry,
  Spherical,
  Vector3,
  Color,
} from 'three';
import type { BufferAttribute, Group, Texture } from 'three';
import type { Book } from '../../types/api';
import { facedCoverColor } from '../../graphics/storefrontShelf';
import { createSpineTexture } from '../../graphics/spineTexture';
import { createBackCoverTexture, createCoverTexture } from '../../graphics/coverTexture';
import {
  READER_FONTS,
  createClosingPage,
  createEndpaper,
  createLockedPage,
  createPageEdgeTexture,
  createTextPage,
  paginate,
  type PageSide,
} from '../../graphics/readerPages';
import { previewFor } from '../../lib/bookPreview';

// ------------------------------------------------------------------ medidas

/** Folhas soltas que viram no modo leitura (cada folha tem duas páginas). */
export const LEAF_COUNT = 4;

const PAGE_WIDTH = 2.18;
const PAGE_HEIGHT = 3.16;
const BOARD_WIDTH = 2.27;
const BOARD_HEIGHT = 3.28;
const BOARD_THICKNESS = 0.07;
const BLOCK_DEPTH = 0.42;
const LEAF_GAP = 0.0035;
const LEAF_SEGMENTS = 48;
const LEAF_REST_BASE = 0.003;
const COVER_Z = LEAF_REST_BASE + LEAF_COUNT * LEAF_GAP + 0.004;
const PAGE_ASPECT = PAGE_HEIGHT / PAGE_WIDTH;
const BOARD_ASPECT = BOARD_HEIGHT / BOARD_WIDTH;

const TURN_SECONDS = 0.95;
const COVER_SECONDS = 1.1;
const SHIFT_SECONDS = 0.9;

const FRONT_FACE_INDEX = 4;
const BACK_FACE_INDEX = 5;
const FACE_COUNT = 6;
const CAMERA_POSITION: [number, number, number] = [0, 0, 6.4];
const FOV = 40;
const MIN_ZOOM_DISTANCE = 3.5;
const MAX_ZOOM_DISTANCE = 9;
const MAX_READING_DISTANCE = 15;

/** Face do livro que a camera pode enquadrar. */
export type ViewFace = 'cover' | 'spine' | 'back' | 'pages';

/** Comando de camera; `nonce` diferencia comandos repetidos (ex.: dois zooms seguidos). */
export type CameraCommand =
  | { type: 'face'; face: ViewFace; nonce: number }
  | { type: 'zoom'; factor: number; nonce: number }
  | { type: 'read'; nonce: number }
  | { type: 'reset'; nonce: number };

interface BookViewer3DProps {
  book: Book;
  /** Livro aberto em modo leitura. */
  coverOpen: boolean;
  onCoverClick: () => void;
  /** Opcional: permite que a pagina conduza a camera (faces, zoom, leitura, restaurar). */
  command?: CameraCommand | null;
  /** Quantas folhas ja foram viradas (0 = primeira dupla de paginas). */
  spread?: number;
  /** Paginas que podem ser lidas; as seguintes aparecem borradas. */
  readablePages?: number;
  /** Clique na metade direita (1) ou esquerda (-1) do livro aberto. */
  onTurn?: (direction: 1 | -1) => void;
  /** Avisa em que pagina a previa termina (a pagina de encerramento). */
  onLastPage?: (page: number) => void;
  /** Muda a cada vez que o indicador "vire a pagina" deve piscar (so na primeira dupla). */
  hintNonce?: number;
}

// Angulo horizontal da camera para cada face (a lombada fica no lado esquerdo do livro).
const FACE_AZIMUTH: Record<ViewFace, number> = {
  cover: 0,
  spine: -Math.PI / 2,
  back: Math.PI,
  pages: Math.PI / 2,
};
const CAMERA_EASING = 0.09;
const CAMERA_SETTLE = 0.002;

interface OrbitControlsLike {
  target: Vector3;
  update: () => unknown;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

/** Distancia em que a dupla de paginas aberta cabe inteira na tela. */
function readingDistance(aspect: number): number {
  const halfFov = Math.tan(((FOV / 2) * Math.PI) / 180);
  const byWidth = (BOARD_WIDTH + 0.2) / (halfFov * aspect);
  const byHeight = (BOARD_HEIGHT / 2 + 0.25) / halfFov;
  return Math.min(MAX_READING_DISTANCE, Math.max(byWidth, byHeight));
}

/** Anima a camera ate o enquadramento pedido, sem brigar com o arraste do usuario. */
function CameraRig({ command, reading }: { command: CameraCommand | null; reading: boolean }) {
  const camera = useThree((state) => state.camera);
  const size = useThree((state) => state.size);
  const controls = useThree((state) => state.controls) as unknown as OrbitControlsLike | null;
  const goal = useRef<Spherical | null>(null);
  const readingFrame = () =>
    new Spherical(readingDistance(size.width / size.height), Math.PI / 2 - 0.04, 0);

  // Aberto, o enquadramento acompanha o tamanho do palco (ele cresce no modo leitura).
  useEffect(() => {
    if (reading && command?.type === 'read') goal.current = readingFrame();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size.width, size.height]);

  useEffect(() => {
    if (!command || !controls) return;
    const current = new Spherical().setFromVector3(
      new Vector3().copy(camera.position).sub(controls.target),
    );
    const limit = reading ? MAX_READING_DISTANCE : MAX_ZOOM_DISTANCE;
    if (command.type === 'zoom') {
      goal.current = new Spherical(
        clamp(current.radius * command.factor, MIN_ZOOM_DISTANCE, limit),
        current.phi,
        current.theta,
      );
    } else if (command.type === 'face') {
      goal.current = new Spherical(current.radius, Math.PI / 2, FACE_AZIMUTH[command.face]);
    } else if (command.type === 'read') {
      goal.current = readingFrame();
    } else {
      goal.current = new Spherical(CAMERA_POSITION[2], Math.PI / 2, 0);
    }
    // `reading` e `size` so importam no instante do comando.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [command, camera, controls]);

  useFrame(() => {
    const target = goal.current;
    if (!target || !controls) return;
    const current = new Spherical().setFromVector3(
      new Vector3().copy(camera.position).sub(controls.target),
    );
    const deltaTheta = Math.atan2(
      Math.sin(target.theta - current.theta),
      Math.cos(target.theta - current.theta),
    );
    const deltaPhi = target.phi - current.phi;
    const deltaRadius = target.radius - current.radius;

    current.theta += deltaTheta * CAMERA_EASING;
    current.phi += deltaPhi * CAMERA_EASING;
    current.radius += deltaRadius * CAMERA_EASING;
    camera.position.copy(new Vector3().setFromSpherical(current).add(controls.target));
    camera.lookAt(controls.target);
    controls.update();

    if (
      Math.abs(deltaTheta) < CAMERA_SETTLE &&
      Math.abs(deltaPhi) < CAMERA_SETTLE &&
      Math.abs(deltaRadius) < CAMERA_SETTLE
    ) {
      goal.current = null;
    }
  });

  return null;
}

/** Espera as fontes das paginas carregarem para o canvas nao desenhar com a fonte errada. */
function useFontsReady(): boolean {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let alive = true;
    const fonts = document.fonts;
    if (!fonts) {
      setReady(true);
      return;
    }
    Promise.all(READER_FONTS.map((font) => fonts.load(font).catch(() => [])))
      .catch(() => undefined)
      .finally(() => alive && setReady(true));
    return () => {
      alive = false;
    };
  }, []);
  return ready;
}

/**
 * Livro em destaque: arraste para girar, use o scroll para aproximar e clique para abrir.
 * Aberto, cada clique (ou seta do teclado, controlada pela pagina) vira uma folha.
 */
export default function BookViewer3D({
  book,
  coverOpen,
  onCoverClick,
  command = null,
  spread = 0,
  readablePages = Number.POSITIVE_INFINITY,
  onTurn,
  onLastPage,
  hintNonce = 0,
}: BookViewer3DProps) {
  const fontsReady = useFontsReady();
  return (
    <Canvas
      dpr={[1, 2]}
      // preserveDrawingBuffer: o recorte de trechos copia pixels do canvas.
      gl={{ antialias: true, preserveDrawingBuffer: true }}
      onCreated={({ gl }) => {
        gl.toneMappingExposure = 1.2;
      }}
    >
      <PerspectiveCamera makeDefault position={CAMERA_POSITION} fov={FOV} />
      <OrbitControls
        makeDefault
        enablePan={false}
        enableRotate={!coverOpen}
        enableDamping
        minDistance={MIN_ZOOM_DISTANCE}
        maxDistance={coverOpen ? MAX_READING_DISTANCE : MAX_ZOOM_DISTANCE}
      />
      <CameraRig command={command} reading={coverOpen} />

      <ambientLight intensity={0.8} />
      <directionalLight position={[3, 5, 6]} intensity={2} color="#fff8ee" />
      <directionalLight position={[-5, 2, 3]} intensity={0.6} color="#d7ad88" />
      <pointLight position={[0, 3, 3]} intensity={4} distance={12} color="#ffe7c7" />
      <Environment resolution={128}>
        <Lightformer form="rect" intensity={2.2} position={[0, 4, 4]} scale={[6, 2, 1]} />
        <Lightformer form="rect" intensity={1.2} color="#ffcf9a" position={[-5, 1, 2]} scale={[2, 5, 1]} />
        <Lightformer form="ring" intensity={0.8} position={[4, 2, -3]} scale={2} />
      </Environment>

      <Suspense fallback={null}>
        {fontsReady ? (
          <OpenableBook
            book={book}
            coverOpen={coverOpen}
            onCoverClick={onCoverClick}
            spread={spread}
            readablePages={readablePages}
            onTurn={onTurn}
            onLastPage={onLastPage}
            hintNonce={hintNonce}
          />
        ) : null}
      </Suspense>
      <ContactShadows
        position={[0, -BOARD_HEIGHT / 2 - 0.02, 0]}
        scale={9}
        blur={2.6}
        far={3.5}
        opacity={0.55}
        color="#000000"
      />
    </Canvas>
  );
}

// ------------------------------------------------------------------ materiais

/** Tom mais fechado da cor do livro para bordas, verso da capa e lombada. */
function shade(color: string, factor: number): string {
  return `#${new Color(color).multiplyScalar(factor).getHexString()}`;
}

function useDisposable<T extends { dispose: () => void }>(factory: () => T, deps: unknown[]): T {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const value = useMemo(factory, deps);
  useEffect(() => () => value.dispose(), [value]);
  return value;
}

/** Textura do verso da folha: espelhada, porque a folha virada e vista "de costas". */
function mirrored(texture: Texture): Texture {
  texture.repeat.x = -1;
  texture.offset.x = 1;
  return texture;
}

interface PageTextures {
  fronts: Texture[];
  backs: Texture[];
  last: Texture;
  dispose: () => void;
}

/** Ultima pagina que existe no livro 3D: a do verso do miolo, depois de todas as folhas. */
const LAST_PAGE = LEAF_COUNT * 2 + 1;

function usePageTextures(
  book: Book,
  readablePages: number,
  onLastPage?: (page: number) => void,
): PageTextures {
  const gl = useThree((state) => state.gl);
  const content = useMemo(() => {
    const preview = previewFor(book);
    const pages = paginate(preview, PAGE_ASPECT);
    // Texto maior que o livro 3D e cortado; o encerramento sempre aparece.
    return { preview, pages, closing: Math.min(pages.length + 1, LAST_PAGE) };
  }, [book]);
  useEffect(() => onLastPage?.(content.closing), [content, onLastPage]);

  return useDisposable(() => {
    const anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy());
    const pageTexture = (number: number, side: PageSide): Texture => {
      const { pages, preview, closing } = content;
      const options = {
        content: pages[number - 1],
        pageNumber: number,
        side,
        runningHead: side === 'left' ? book.author : book.title,
        aspect: PAGE_ASPECT,
      };
      let texture: Texture;
      if (number > readablePages && number <= closing) texture = createLockedPage(options);
      else if (number === closing)
        texture = createClosingPage({ text: preview.closing, side, aspect: PAGE_ASPECT });
      else if (number > closing)
        texture = createTextPage({ ...options, content: undefined, runningHead: '', pageNumber: 0 });
      else texture = createTextPage(options);
      texture.anisotropy = anisotropy;
      return texture;
    };

    const fronts = Array.from({ length: LEAF_COUNT }, (_, leaf) => pageTexture(leaf * 2 + 1, 'right'));
    const backs = Array.from({ length: LEAF_COUNT }, (_, leaf) =>
      mirrored(pageTexture(leaf * 2 + 2, 'left')),
    );
    const last = pageTexture(LAST_PAGE, 'right');
    return {
      fronts,
      backs,
      last,
      dispose: () => [...fronts, ...backs, last].forEach((texture) => texture.dispose()),
    };
  }, [content, readablePages, gl, book.title, book.author]);
}

// ------------------------------------------------------------------ folha que vira

/**
 * Curva a folha ao redor da lombada. A borda livre "atrasa" em relacao a dobra,
 * como papel de verdade, e volta a ficar reta quando a folha assenta.
 */
function bendLeaf(geometry: PlaneGeometry, progress: number, direction: 1 | -1) {
  const position = geometry.attributes.position as BufferAttribute;
  const columns = LEAF_SEGMENTS + 1;
  const segment = PAGE_WIDTH / LEAF_SEGMENTS;
  const base = progress * Math.PI;
  const bend = Math.sin(progress * Math.PI) * 0.95;
  const lift = Math.sin(progress * Math.PI) * 0.12;
  const xs = new Float32Array(columns);
  const zs = new Float32Array(columns);

  for (let c = 1; c < columns; c += 1) {
    const along = (c - 0.5) / LEAF_SEGMENTS;
    const angle = clamp(base - direction * bend * along ** 1.6, 0, Math.PI);
    xs[c] = xs[c - 1] + Math.cos(angle) * segment;
    zs[c] = zs[c - 1] + Math.sin(angle) * segment;
  }
  for (let i = 0; i < position.count; i += 1) {
    const c = i % columns;
    position.setX(i, xs[c]);
    position.setZ(i, zs[c] + lift * Math.sin((c / LEAF_SEGMENTS) * Math.PI) * 0.4);
  }
  position.needsUpdate = true;
  geometry.computeVertexNormals();
}

function Leaf({
  index,
  turned,
  front,
  back,
}: {
  index: number;
  turned: boolean;
  front: Texture;
  back: Texture;
}) {
  const group = useRef<Group>(null);
  const geometry = useMemo(() => {
    const plane = new PlaneGeometry(PAGE_WIDTH, PAGE_HEIGHT, LEAF_SEGMENTS, 1);
    plane.translate(PAGE_WIDTH / 2, 0, 0);
    return plane;
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);

  const state = useRef({ t: turned ? 1 : 0, direction: 1 as 1 | -1, dirty: true });
  const restZ = LEAF_REST_BASE + (LEAF_COUNT - 1 - index) * LEAF_GAP;
  const leftZ = COVER_Z + 0.004 + index * LEAF_GAP;

  useFrame((_, delta) => {
    const s = state.current;
    const target = turned ? 1 : 0;
    if (s.t !== target) {
      s.direction = target > s.t ? 1 : -1;
      s.t = clamp(s.t + (s.direction * Math.min(delta, 0.05)) / TURN_SECONDS, 0, 1);
      s.dirty = true;
    }
    if (!s.dirty || !group.current) return;
    s.dirty = false;
    const eased = easeInOut(s.t);
    bendLeaf(geometry, eased, s.direction);
    group.current.position.z = restZ + (leftZ - restZ) * eased;
  });

  return (
    <group ref={group} position={[0, 0, restZ]}>
      <mesh geometry={geometry}>
        <meshStandardMaterial
          map={front}
          side={FrontSide}
          roughness={0.92}
          metalness={0}
          toneMapped={false}
        />
      </mesh>
      <mesh geometry={geometry}>
        <meshStandardMaterial
          map={back}
          side={BackSide}
          roughness={0.92}
          metalness={0}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

// ------------------------------------------------------------------ livro

function OpenableBook({
  book,
  coverOpen,
  onCoverClick,
  spread,
  readablePages,
  onTurn,
  onLastPage,
  hintNonce,
}: Required<Omit<BookViewer3DProps, 'command' | 'onTurn' | 'onLastPage'>> &
  Pick<BookViewer3DProps, 'onTurn' | 'onLastPage'>) {
  const root = useRef<Group>(null);
  const hinge = useRef<Group>(null);
  const motion = useRef({ cover: 0, shift: 0 });
  const color = useMemo(() => facedCoverColor(book), [book]);

  const coverTexture = useDisposable(
    () => createCoverTexture({ title: book.title, author: book.author, background: color }),
    [book.title, book.author, color],
  );
  const backCoverTexture = useDisposable(
    () => createBackCoverTexture({ title: book.title, author: book.author, background: color }),
    [book.title, book.author, color],
  );
  const spineTexture = useDisposable(
    () =>
      createSpineTexture({ title: book.title, author: book.author, background: shade(color, 0.55) }),
    [book.title, book.author, color],
  );
  const endpaper = useDisposable(
    () =>
      createEndpaper({ title: book.title, author: book.author, color: shade(color, 0.8), aspect: BOARD_ASPECT }),
    [book.title, book.author, color],
  );
  const edgeAcross = useDisposable(() => createPageEdgeTexture('u'), []);
  const edgeAlong = useDisposable(() => createPageEdgeTexture('v'), []);
  const pages = usePageTextures(book, readablePages, onLastPage);

  const spineGeometry = useDisposable(() => {
    const radius = (COVER_Z + BOARD_THICKNESS + BLOCK_DEPTH + BOARD_THICKNESS) / 2;
    return new CylinderGeometry(radius, radius, BOARD_HEIGHT, 32, 1, true, Math.PI, Math.PI);
  }, []);
  const spineCenterZ = (COVER_Z + BOARD_THICKNESS - BLOCK_DEPTH - BOARD_THICKNESS) / 2;

  useFrame((state, delta) => {
    const step = Math.min(delta, 0.05);
    const m = motion.current;
    const target = coverOpen ? 1 : 0;
    m.cover = clamp(m.cover + Math.sign(target - m.cover) * (step / COVER_SECONDS), 0, 1);
    if (Math.abs(target - m.cover) < 0.001) m.cover = target;
    m.shift = clamp(m.shift + Math.sign(target - m.shift) * (step / SHIFT_SECONDS), 0, 1);
    if (Math.abs(target - m.shift) < 0.001) m.shift = target;

    if (hinge.current) hinge.current.rotation.y = -Math.PI * easeInOut(m.cover);
    if (root.current) {
      const shift = easeInOut(m.shift);
      // Fechado, o livro fica centralizado; aberto, a lombada vai para o centro.
      root.current.position.x = (-PAGE_WIDTH / 2) * (1 - shift);
      // Fechado, flutua de leve na vitrine; aberto, fica parado para leitura.
      const idle = 1 - shift;
      root.current.position.y = Math.sin(state.clock.elapsedTime * 1.1) * 0.035 * idle;
      root.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.45) * 0.08 * idle;
    }
  });

  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    if (event.delta > 6) return; // foi um arraste, nao um clique
    if (!coverOpen) {
      onCoverClick();
      return;
    }
    const local = root.current ? root.current.worldToLocal(event.point.clone()) : event.point;
    onTurn?.(local.x >= 0 ? 1 : -1);
  };
  const setCursor = (cursor: string) => () => {
    document.body.style.cursor = cursor;
  };
  useEffect(() => () => void (document.body.style.cursor = ''), []);

  const coverEdge = shade(color, 0.7);
  const boardMaterials = (front: Texture | null, back: Texture | null) =>
    Array.from({ length: FACE_COUNT }, (_, face) => {
      const map = face === FRONT_FACE_INDEX ? front : face === BACK_FACE_INDEX ? back : null;
      return (
        <meshStandardMaterial
          key={face}
          attach={`material-${face}`}
          color={map ? '#ffffff' : coverEdge}
          map={map}
          roughness={map === endpaper ? 0.9 : 0.5}
          metalness={0.02}
          toneMapped={map !== endpaper}
        />
      );
    });

  return (
    <group
      ref={root}
      onClick={handleClick}
      onPointerOver={setCursor('pointer')}
      onPointerOut={setCursor('')}
    >
      {/* Contracapa */}
      <mesh position={[BOARD_WIDTH / 2, 0, -BLOCK_DEPTH - BOARD_THICKNESS / 2]}>
        <boxGeometry args={[BOARD_WIDTH, BOARD_HEIGHT, BOARD_THICKNESS]} />
        {boardMaterials(null, backCoverTexture)}
      </mesh>

      {/* Miolo: bloco de paginas com o corte das folhas nas bordas */}
      <mesh position={[PAGE_WIDTH / 2 + 0.005, 0, -BLOCK_DEPTH / 2]}>
        <boxGeometry args={[PAGE_WIDTH, PAGE_HEIGHT, BLOCK_DEPTH]} />
        <meshStandardMaterial attach="material-0" map={edgeAcross} roughness={1} />
        <meshStandardMaterial attach="material-1" color="#e9dfcc" roughness={1} />
        <meshStandardMaterial attach="material-2" map={edgeAlong} roughness={1} />
        <meshStandardMaterial attach="material-3" map={edgeAlong} roughness={1} />
        <meshStandardMaterial
          attach="material-4"
          map={pages.last}
          roughness={0.92}
          toneMapped={false}
        />
        <meshStandardMaterial attach="material-5" color="#e9dfcc" roughness={1} />
      </mesh>

      {/* Lombada arredondada */}
      <mesh geometry={spineGeometry} position={[0, 0, spineCenterZ]} scale={[0.42, 1, 1]}>
        <meshStandardMaterial map={spineTexture} roughness={0.55} />
      </mesh>

      {/* Folhas que viram */}
      {pages.fronts.map((front, index) => (
        <Leaf
          key={index}
          index={index}
          turned={coverOpen && index < spread}
          front={front}
          back={pages.backs[index]}
        />
      ))}

      {/* Indicador discreto na borda da primeira pagina: "vire aqui" */}
      {coverOpen && spread === 0 && hintNonce > 0 ? (
        <Html
          position={[PAGE_WIDTH + 0.07, 0, COVER_Z + 0.02]}
          center
          zIndexRange={[5, 0]}
          style={{ pointerEvents: 'none' }}
        >
          <span key={hintNonce} className="page-turn-hint" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none">
              <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </Html>
      ) : null}

      {/* Capa, presa na lombada */}
      <group ref={hinge} position={[0, 0, COVER_Z]}>
        <mesh position={[BOARD_WIDTH / 2, 0, BOARD_THICKNESS / 2]}>
          <boxGeometry args={[BOARD_WIDTH, BOARD_HEIGHT, BOARD_THICKNESS]} />
          {boardMaterials(coverTexture, endpaper)}
        </mesh>
      </group>
    </group>
  );
}
