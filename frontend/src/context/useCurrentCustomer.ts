import { useContext } from 'react';
import { CurrentCustomerContext, type CurrentCustomerContextValue } from './currentCustomerContext';

// Preparado para substituir a seleção local por um usuário vindo de /me quando houver autenticação.
export function useCurrentCustomer(): CurrentCustomerContextValue {
  const context = useContext(CurrentCustomerContext);
  if (!context)
    throw new Error('useCurrentCustomer deve ser usado dentro de CurrentCustomerProvider');
  return context;
}
