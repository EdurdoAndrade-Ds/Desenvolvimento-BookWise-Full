import { Link, NavLink } from 'react-router-dom';
import { BookOpen, UserCircle } from 'lucide-react';
import type { ReactNode } from 'react';
import ThemeToggle from '../components/ThemeToggle';
import { useCurrentCustomer } from '../context/CurrentCustomerContext';

export default function CustomerHeader() {
  const { customer, customers, setCustomer, loading } = useCurrentCustomer();

  return (
    <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2 text-lg font-bold text-brand-700 dark:text-brand-400">
          <BookOpen className="h-6 w-6" />
          BookWise
        </Link>
        <div className="flex items-center gap-2">
          <Link
            to="/my-account"
            className="hidden rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 sm:block dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Minha conta
          </Link>
          <label className="flex items-center gap-2">
            <UserCircle className="h-5 w-5 text-slate-400" />
            <span className="sr-only">Navegando como</span>
            <select
              value={customer?.id ?? ''}
              disabled={loading}
              onChange={(event) => {
                const selected = customers.find((item) => item.id === Number(event.target.value));
                setCustomer(selected ?? null);
              }}
              className="max-w-[13rem] rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm text-slate-700 outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <option value="">Navegando como...</option>
              {customers.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <ThemeToggle />
        </div>
      </div>
      <nav className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 pb-3 text-sm sm:px-6 lg:px-8">
        <CustomerNavLink to="/" end>Catálogo</CustomerNavLink>
        <CustomerNavLink to="/my-loans">Empréstimos</CustomerNavLink>
        <CustomerNavLink to="/my-reservations">Reservas</CustomerNavLink>
        <CustomerNavLink to="/my-purchases">Compras</CustomerNavLink>
        <CustomerNavLink to="/my-fines">Multas</CustomerNavLink>
        <CustomerNavLink to="/shelf-3d">Estante 3D</CustomerNavLink>
        <CustomerNavLink to="/cover-studio">Cover Studio</CustomerNavLink>
      </nav>
    </header>
  );
}

function CustomerNavLink({
  to,
  end,
  children,
}: {
  to: string;
  end?: boolean;
  children: ReactNode;
}) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        [
          'whitespace-nowrap rounded-lg px-3 py-1.5 font-medium transition-colors',
          isActive
            ? 'bg-brand-600 text-white'
            : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
        ].join(' ')
      }
    >
      {children}
    </NavLink>
  );
}
