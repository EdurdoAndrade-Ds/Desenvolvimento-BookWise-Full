import { Link, NavLink } from 'react-router-dom';
import {
  Boxes,
  Heart,
  LayoutGrid,
  Palette,
  Receipt,
  ShoppingBag,
  UserCircle,
  Bookmark,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useCurrentCustomer } from '../context/useCurrentCustomer';

const NAV_ITEMS: { to: string; label: string; icon: LucideIcon; end?: boolean }[] = [
  { to: '/', label: 'Catálogo', icon: LayoutGrid, end: true },
  { to: '/my-loans', label: 'Empréstimos', icon: Bookmark },
  { to: '/my-reservations', label: 'Reservas', icon: Heart },
  { to: '/my-purchases', label: 'Compras', icon: ShoppingBag },
  { to: '/my-fines', label: 'Multas', icon: Receipt },
  { to: '/shelf-3d', label: 'Estante 3D', icon: Boxes },
  { to: '/cover-studio', label: 'Cover Studio', icon: Palette },
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

  return (
    <aside className="sticky top-0 z-10 flex w-full shrink-0 items-center gap-3 border-b border-cream-200 bg-cream-100 px-4 py-3 lg:h-screen lg:w-24 lg:flex-col lg:justify-between lg:border-b-0 lg:border-r lg:py-6 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex min-w-0 flex-1 items-center gap-3 lg:flex-none lg:flex-col lg:gap-6">
        <Link
          to="/"
          className="shrink-0 text-sm font-bold tracking-tight text-slate-800 lg:text-base dark:text-slate-100"
        >
          Bookstore
        </Link>
        <Link
          to="/my-account"
          title="Minha conta"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
        >
          {avatar ?? <UserCircle className="h-6 w-6" />}
        </Link>
        <nav className="flex min-w-0 items-center gap-1 overflow-x-auto lg:flex-col lg:gap-2 lg:overflow-visible">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              title={label}
              aria-label={label}
              className={({ isActive }) =>
                [
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl transition-colors',
                  isActive
                    ? 'bg-white text-brand-600 shadow-sm dark:bg-slate-800 dark:text-brand-400'
                    : 'text-slate-500 hover:bg-white hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800',
                ].join(' ')
              }
            >
              <Icon className="h-5 w-5" />
            </NavLink>
          ))}
        </nav>
      </div>
      <Link
        to="/my-account"
        className="shrink-0 rounded-2xl bg-emerald-500 px-3 py-2 text-xs font-semibold tracking-wide text-white shadow-sm transition hover:bg-emerald-600 lg:[writing-mode:vertical-rl] lg:px-2 lg:py-6"
      >
        Subscribe
      </Link>
    </aside>
  );
}
