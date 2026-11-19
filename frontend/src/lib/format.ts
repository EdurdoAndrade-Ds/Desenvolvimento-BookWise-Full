import type { BookFormat, UserRole } from '../types/api';

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

export function formatCurrency(value?: number): string {
  if (value === undefined || value === null) return '—';
  return currencyFormatter.format(value);
}

export function formatBookFormat(format: BookFormat): string {
  return format === 'PHYSICAL' ? 'Físico' : 'Digital';
}

const roleLabels: Record<UserRole, string> = {
  ADMIN: 'Administrador',
  LIBRARIAN: 'Bibliotecário',
  READER: 'Leitor',
};

export function formatUserRole(role: UserRole): string {
  return roleLabels[role];
}

/** Converte uma data ISO (yyyy-MM-dd) em dd/MM/yyyy, sem problemas de fuso. */
export function formatDate(iso?: string | null): string {
  if (!iso) return '—';
  const [year, month, day] = iso.slice(0, 10).split('-');
  if (!year || !month || !day) return iso;
  return `${day}/${month}/${year}`;
}
