import { useCallback, useSyncExternalStore } from 'react';

// Assinatura de demonstração: fica salva no navegador (localStorage) e é compartilhada
// entre o Gabinete 3D e a seção de planos. Em produção isso viria da API, e o texto
// completo dos livros só seria enviado pelo servidor para quem é assinante.

export type PlanId = 'mensal' | 'anual' | 'familia';

const STORAGE_KEY = 'bookwise:assinatura';
const CHANGE_EVENT = 'bookwise:assinatura-alterada';

function read(): PlanId | null {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return value === 'mensal' || value === 'anual' || value === 'familia' ? value : null;
  } catch {
    return null;
  }
}

let memoryPlan: PlanId | null = null;

function snapshot(): PlanId | null {
  return read() ?? memoryPlan;
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener('storage', onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener('storage', onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

function write(plan: PlanId | null) {
  memoryPlan = plan;
  try {
    if (plan) window.localStorage.setItem(STORAGE_KEY, plan);
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Navegação privada pode bloquear o localStorage; a assinatura vale só nesta aba.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function useSubscription() {
  const plan = useSyncExternalStore(subscribe, snapshot, () => null);
  const start = useCallback((next: PlanId) => write(next), []);
  const cancel = useCallback(() => write(null), []);
  return { plan, subscribed: plan !== null, start, cancel };
}
