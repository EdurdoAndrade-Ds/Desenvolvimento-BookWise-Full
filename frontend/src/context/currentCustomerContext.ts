import { createContext } from 'react';
import type { User } from '../types/api';

export interface CurrentCustomerContextValue {
  customer: User | null;
  setCustomer: (customer: User | null) => void;
  customers: User[];
  loading: boolean;
}

export const CurrentCustomerContext = createContext<CurrentCustomerContextValue | undefined>(
  undefined,
);
