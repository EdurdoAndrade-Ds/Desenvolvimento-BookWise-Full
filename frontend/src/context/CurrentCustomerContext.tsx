import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { User } from '../types/api';
import { usersService } from '../services/usersService';

interface CurrentCustomerContextValue {
  customer: User | null;
  setCustomer: (customer: User | null) => void;
  customers: User[];
  loading: boolean;
}

const STORAGE_KEY = 'bookwise-current-customer-id';
const CurrentCustomerContext = createContext<CurrentCustomerContextValue | undefined>(undefined);

export function CurrentCustomerProvider({ children }: { children: ReactNode }) {
  const [customers, setCustomers] = useState<User[]>([]);
  const [customer, setCustomerState] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    usersService
      .list({ page: 0, size: 100 })
      .then((result) => {
        const readers = result.content.filter((user) => user.role === 'READER');
        setCustomers(readers);
        const savedId = Number(localStorage.getItem(STORAGE_KEY));
        setCustomerState(readers.find((user) => user.id === savedId) ?? null);
      })
      .catch(() => {
        setCustomers([]);
        setCustomerState(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const setCustomer = (next: User | null) => {
    setCustomerState(next);
    if (next) localStorage.setItem(STORAGE_KEY, String(next.id));
    else localStorage.removeItem(STORAGE_KEY);
  };

  const value = useMemo(
    () => ({ customer, setCustomer, customers, loading }),
    [customer, customers, loading],
  );
  return <CurrentCustomerContext.Provider value={value}>{children}</CurrentCustomerContext.Provider>;
}

// Preparado para substituir a seleção local por um usuário vindo de /me quando houver autenticação.
export function useCurrentCustomer() {
  const context = useContext(CurrentCustomerContext);
  if (!context) throw new Error('useCurrentCustomer deve ser usado dentro de CurrentCustomerProvider');
  return context;
}
