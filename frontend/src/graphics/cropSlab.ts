import { Color, ExtrudeGeometry, Shape } from 'three';
import type { Point } from './polygonClip';

export function cropSlabGeometry(width: number, height: number, outline: Point[]): ExtrudeGeometry {
  if (
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    width <= 0 ||
    height <= 0 ||
    outline.length < 3 ||
    outline.some((p) => !Number.isFinite(p.x) || !Number.isFinite(p.y))
  ) {
    throw new Error('Contorno inválido para o recorte 3D.');
  }
  const scale = 2.4 / Math.max(width, height);
  const depth = 2.4 * 0.075;
  const shape = new Shape();
  outline.forEach(({ x, y }, i) => {
    const px = (x - width / 2) * scale;
    const py = (height / 2 - y) * scale;
    if (i === 0) shape.moveTo(px, py);
    else shape.lineTo(px, py);
  });
  shape.closePath();
  const geometry = new ExtrudeGeometry(shape, { depth, bevelEnabled: false, steps: 1 });
  geometry.translate(0, 0, -depth / 2);
  const position = geometry.getAttribute('position');
  const uv = geometry.getAttribute('uv');
  for (let i = 0; i < position.count; i++) {
    uv.setXY(
      i,
      position.getX(i) / (width * scale) + 0.5,
      position.getY(i) / (height * scale) + 0.5,
    );
  }
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}

export function cropSideColor(image: ImageData): Color {
  const sum = [0, 0, 0];
  let count = 0;
  for (let i = 0; i < image.data.length; i += 4) {
    if (!image.data[i + 3]) continue;
    for (let channel = 0; channel < 3; channel++) sum[channel] += image.data[i + channel];
    count++;
  }
  const rgb = sum.map((v) => Math.round(count ? (v / count) * 0.65 : 64));
  return new Color(`rgb(${rgb.join(',')})`);
}
