import { createContext, useContext } from 'react';

export const DEFAULT_GRAPHICS_FLAGS = {
  frustum: true,
  backface: true,
  lod: true,
  clipping: true,
};

export type GraphicsFlags = typeof DEFAULT_GRAPHICS_FLAGS;

export const GraphicsDebugContext = createContext({
  enabled: false,
  flags: DEFAULT_GRAPHICS_FLAGS,
});

export function useGraphicsDebug() {
  return useContext(GraphicsDebugContext);
}
