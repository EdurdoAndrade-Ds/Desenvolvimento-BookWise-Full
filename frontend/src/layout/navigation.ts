import {
  LayoutDashboard,
  BookOpen,
  FolderTree,
  ArrowLeftRight,
  ShoppingCart,
  BookMarked,
  CircleDollarSign,
  Users,
  Settings,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  /** Marca o item apenas quando a rota casa exatamente (indice de uma secao). */
  end?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', to: '/adm', icon: LayoutDashboard, end: true },
  { label: 'Livros', to: '/adm/books', icon: BookOpen },
  { label: 'Categorias', to: '/adm/categories', icon: FolderTree },
  { label: 'Empréstimos', to: '/adm/loans', icon: ArrowLeftRight },
  { label: 'Reservas', to: '/adm/reservations', icon: BookMarked },
  { label: 'Vendas', to: '/adm/sales', icon: ShoppingCart },
  { label: 'Multas', to: '/adm/fines', icon: CircleDollarSign },
  { label: 'Usuários', to: '/adm/users', icon: Users },
];

export const SECONDARY_NAV_ITEMS: NavItem[] = [
  { label: 'Configurações', to: '/adm/settings', icon: Settings },
];
