import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import {
  Heart,
  LayoutGrid,
  Receipt,
  ShoppingBag,
  UserCircle,
  Bookmark,
  Palette,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useCurrentCustomer } from '../context/useCurrentCustomer';
import { SidebarBrand, SidebarCollapseButton } from './SidebarChrome';
import {
  SIDEBAR_SURFACE_CLASSES,
  sidebarItemClassName,
  sidebarWidthClasses,
} from './sidebarStyles';

const NAV_ITEMS: { to: string; label: string; icon: LucideIcon; end?: boolean }[] = [
  { to: '/', label: 'Catálogo', icon: LayoutGrid, end: true },
  { to: '/my-loans', label: 'Empréstimos', icon: Bookmark },
  { to: '/my-reservations', label: 'Reservas', icon: Heart },
  { to: '/my-purchases', label: 'Compras', icon: ShoppingBag },
  { to: '/my-fines', label: 'Multas', icon: Receipt },
  { to: '/cover-studio', label: 'Estúdio de capas', icon: Palette },
];

function initials(name?: string) {
  if (!name) return null;
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

export default function CustomerSidebar() {
  const { customer } = useCurrentCustomer();
  const avatar = initials(customer?.name);
  const [expanded, setExpanded] = useState(() => {
    try {
      return localStorage.getItem('bookwise-sidebar-expanded') === 'true';
    } catch {
      return false;
    }
  });

  function toggleExpanded() {
    const next = !expanded;
    setExpanded(next);
    try {
      localStorage.setItem('bookwise-sidebar-expanded', String(next));
    } catch {
      // Storage may be unavailable in private browsing.
    }
  }

  return (
    <aside
      aria-label="Menu do cliente"
      className={`sticky top-0 z-10 flex w-full shrink-0 items-center gap-3 border-b px-4 py-3 lg:h-screen lg:flex-col lg:items-stretch lg:gap-0 lg:border-b-0 lg:border-r lg:p-0 ${SIDEBAR_SURFACE_CLASSES} ${sidebarWidthClasses(!expanded, true)}`}
    >
      <Link to="/" title="BookWise" aria-label="BookWise" className="mobile-touch shrink-0">
        <SidebarBrand collapsed={!expanded} className="max-lg:p-0" />
      </Link>
      <nav
        id="customer-navigation"
        aria-label="Navegação do cliente"
        className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto lg:flex-col lg:items-stretch lg:px-3 lg:py-4"
      >
        <NavLink
          to="/my-account"
          title="Minha conta"
          aria-label="Minha conta"
          className={({ isActive }) =>
            `${sidebarItemClassName(isActive, !expanded)} shrink-0 max-lg:justify-center`
          }
        >
          <span className="flex h-5 w-5 shrink-0 items-center justify-center text-xs font-semibold">
            {avatar ?? <UserCircle className="h-5 w-5" />}
          </span>
          {expanded && <span className="hidden lg:inline">Minha conta</span>}
        </NavLink>
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            title={label}
            aria-label={label}
            className={({ isActive }) =>
              `${sidebarItemClassName(isActive, !expanded)} shrink-0 max-lg:justify-center`
            }
          >
            <Icon className="h-5 w-5 shrink-0" />
            {expanded && (
              <span className="hidden whitespace-nowrap text-sm lg:inline">{label}</span>
            )}
          </NavLink>
        ))}
      </nav>
      <SidebarCollapseButton
        collapsed={!expanded}
        onToggle={toggleExpanded}
        controls="customer-navigation"
      />
    </aside>
  );
}
