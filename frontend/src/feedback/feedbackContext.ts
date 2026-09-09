import { createContext } from 'react';

export interface ConfirmOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  tone?: 'default' | 'danger';
}

export type NoticeTone = 'info' | 'error';

export interface FeedbackContextValue {
  /** Abre um dialogo de confirmacao na propria pagina e resolve com a escolha do usuario. */
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  /** Exibe um aviso temporario no canto da tela. */
  notify: (message: string, tone?: NoticeTone) => void;
}

export const FeedbackContext = createContext<FeedbackContextValue | undefined>(undefined);
