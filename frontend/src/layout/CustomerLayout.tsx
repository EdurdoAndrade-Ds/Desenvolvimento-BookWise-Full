import { Link, Outlet } from 'react-router-dom';
import CustomerHeader from './CustomerHeader';
import { CurrentCustomerProvider } from '../context/CurrentCustomerContext';

export default function CustomerLayout() {
  return (
    <CurrentCustomerProvider>
      <div className="min-h-full bg-slate-50 dark:bg-slate-950">
        <CustomerHeader />
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <Outlet />
        </main>
        <footer className="border-t border-slate-200 bg-white py-6 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
          <p>BookWise · Sua biblioteca, sempre com você.</p>
          <Link
            to="/"
            className="mt-1 inline-block text-brand-600 hover:underline dark:text-brand-400"
          >
            Voltar ao catálogo
          </Link>
        </footer>
      </div>
    </CurrentCustomerProvider>
  );
}
