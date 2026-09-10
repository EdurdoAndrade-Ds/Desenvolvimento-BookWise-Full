import { useEffect, useMemo, useState } from 'react';
import type { ThreeEvent } from '@react-three/fiber';
import { createSpineTexture } from '../../graphics/spineTexture';
import type { ShelfBook } from '../../graphics/shelfLayout';

const FACE_COUNT = 6;
const SPINE_FACE_INDEX = 4;
const HOVER_OFFSET = 0.18;
const SELECTED_OFFSET = 0.32;
const SELECTED_EMISSIVE_INTENSITY = 0.45;
const DIGITAL_OPACITY = 0.55;

/** Propriedades de aparencia controladas pelo painel da cena. */
export interface BookMaterialSettings {
  roughness: number;
  metalness: number;
  wireframe: boolean;
}

interface Book3DProps {
  entry: ShelfBook;
  selected: boolean;
  settings: BookMaterialSettings;
  onSelect: (entry: ShelfBook) => void;
}

/**
 * Renderiza um livro como paralelepipedo texturizado: a lombada recebe um
 * CanvasTexture com titulo/autor e as demais faces usam a cor da capa.
 */
export default function Book3D({ entry, selected, settings, onSelect }: Book3DProps) {
  const [hovered, setHovered] = useState(false);
  const texture = useMemo(
    () =>
      createSpineTexture({
        title: entry.book.title,
        author: entry.book.author,
        background: entry.color,
      }),
    [entry.book.title, entry.book.author, entry.color],
  );

  useEffect(() => () => texture.dispose(), [texture]);

  useEffect(() => {
    document.body.style.cursor = hovered ? 'pointer' : '';
    return () => {
      document.body.style.cursor = '';
    };
  }, [hovered]);

  const isDigital = entry.book.format === 'DIGITAL';
  const [x, y, z] = entry.position;
  const offset = selected ? SELECTED_OFFSET : hovered ? HOVER_OFFSET : 0;

  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    onSelect(entry);
  };

  return (
    <mesh
      position={[x, y, z + offset]}
      castShadow
      receiveShadow
      onClick={handleClick}
      onPointerOver={(event) => {
        event.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
    >
      <boxGeometry args={entry.size} />
      {Array.from({ length: FACE_COUNT }, (_, face) => (
        <meshStandardMaterial
          key={face}
          attach={`material-${face}`}
          color={entry.color}
          map={face === SPINE_FACE_INDEX ? texture : null}
          roughness={settings.roughness}
          metalness={settings.metalness}
          wireframe={settings.wireframe}
          transparent={isDigital}
          opacity={isDigital ? DIGITAL_OPACITY : 1}
          emissive={entry.color}
          emissiveIntensity={selected ? SELECTED_EMISSIVE_INTENSITY : 0}
        />
      ))}
    </mesh>
  );
}
