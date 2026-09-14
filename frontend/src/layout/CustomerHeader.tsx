import { Link } from 'react-router-dom';
import { BookOpen, UserCircle } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';
import { useCurrentCustomer } from '../context/useCurrentCustomer';

export default function CustomerHeader() {
  const { customer, customers, setCustomer, loading } = useCurrentCustomer();

  return (
    <header className="bg-cream-50 dark:bg-slate-950">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-5 sm:px-6 lg:px-10">
        <Link to="/" className="flex items-center gap-2 text-slate-800 dark:text-slate-100">
          <BookOpen className="h-6 w-6 text-brand-600 dark:text-brand-400" />
          <span className="text-xl font-extrabold tracking-tight">
            Book<span className="font-light">Wise</span>
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <Link
            to="/my-account"
            className="hidden rounded-full px-3 py-2 text-sm text-slate-600 hover:bg-white sm:block dark:text-slate-300 dark:hover:bg-slate-800"
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
              className="max-w-[13rem] rounded-full border border-cream-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
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
    </header>
  );
}
