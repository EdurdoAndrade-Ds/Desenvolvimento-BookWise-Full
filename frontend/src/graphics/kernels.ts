/** Kernel identidade: preserva cada pixel sem alterar a imagem. */
export const IDENTITY_KERNEL = [0, 0, 0, 0, 1, 0, 0, 0, 0] as const;

/** Kernel de desfoque medio: calcula a media da vizinhanca 3x3. */
export const BOX_BLUR_KERNEL = [1, 1, 1, 1, 1, 1, 1, 1, 1] as const;

/** Kernel gaussiano: da mais peso ao pixel central e aos vizinhos proximos. */
export const GAUSSIAN_BLUR_KERNEL = [1, 2, 1, 2, 4, 2, 1, 2, 1] as const;

/** Kernel de nitidez: reforca diferencas entre o centro e a vizinhanca. */
export const SHARPEN_KERNEL = [0, -1, 0, -1, 5, -1, 0, -1, 0] as const;

/** Kernel de relevo: cria contraste direcional para simular emboss. */
export const EMBOSS_KERNEL = [-2, -1, 0, -1, 1, 1, 0, 1, 2] as const;

/** Kernel laplaciano: realca bordas em todas as direcoes. */
export const LAPLACIAN_KERNEL = [0, -1, 0, -1, 4, -1, 0, -1, 0] as const;
