/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Origem da API quando o frontend e servido separado do backend. */
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
