export type Matrix = [number, number, number, number, number, number];

export function bilinear(source: ImageData, x: number, y: number): number[] {
  if (x < -0.5 || y < -0.5 || x > source.width - 0.5 || y > source.height - 0.5)
    return [0, 0, 0, 0];
  x = Math.max(0, Math.min(source.width - 1, x));
  y = Math.max(0, Math.min(source.height - 1, y));
  const x0 = Math.floor(x),
    y0 = Math.floor(y),
    dx = x - x0,
    dy = y - y0;
  const sum = [0, 0, 0, 0];
  for (let j = 0; j < 2; j++)
    for (let i = 0; i < 2; i++) {
      const index =
        (Math.min(y0 + j, source.height - 1) * source.width + Math.min(x0 + i, source.width - 1)) *
        4;
      const weight = (i ? dx : 1 - dx) * (j ? dy : 1 - dy);
      const alpha = source.data[index + 3] / 255;
      for (let c = 0; c < 3; c++) sum[c] += source.data[index + c] * alpha * weight;
      sum[3] += alpha * weight;
    }
  return [...sum.slice(0, 3).map((v) => (sum[3] ? v / sum[3] : 0)), sum[3] * 255];
}

export function transformImage(
  source: ImageData,
  degrees: number,
  zoom = 1,
  flipH = false,
  flipV = false,
): { image: ImageData; matrix: Matrix } {
  if (!Number.isFinite(degrees) || !Number.isFinite(zoom) || zoom <= 0 || zoom > 3)
    throw new Error('Transformação inválida.');
  const angle = (degrees * Math.PI) / 180;
  const cos = Math.abs(Math.cos(angle)) < 1e-10 ? 0 : Math.cos(angle);
  const sin = Math.abs(Math.sin(angle)) < 1e-10 ? 0 : Math.sin(angle);
  const a = cos * zoom * (flipH ? -1 : 1),
    b = sin * zoom * (flipH ? -1 : 1);
  const c = -sin * zoom * (flipV ? -1 : 1),
    d = cos * zoom * (flipV ? -1 : 1);
  const width = Math.ceil(Math.abs(a) * source.width + Math.abs(c) * source.height - 1e-9);
  const height = Math.ceil(Math.abs(b) * source.width + Math.abs(d) * source.height - 1e-9);
  const tx = width / 2 - (a * source.width) / 2 - (c * source.height) / 2;
  const ty = height / 2 - (b * source.width) / 2 - (d * source.height) / 2;
  const image = new ImageData(Math.max(1, width), Math.max(1, height));
  const det = a * d - b * c;
  for (let y = 0; y < image.height; y++)
    for (let x = 0; x < image.width; x++) {
      const px = x + 0.5 - tx,
        py = y + 0.5 - ty;
      const values = bilinear(
        source,
        (d * px - c * py) / det - 0.5,
        (-b * px + a * py) / det - 0.5,
      );
      image.data.set(values, (y * image.width + x) * 4);
    }
  return { image, matrix: [a, c, tx, b, d, ty] };
}
