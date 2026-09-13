import { Link, Outlet } from 'react-router-dom';
import CustomerHeader from './CustomerHeader';
import CustomerSidebar from './CustomerSidebar';
import { CurrentCustomerProvider } from '../context/CurrentCustomerContext';

export default function CustomerLayout() {
  return (
    <CurrentCustomerProvider>
      <div className="min-h-full bg-cream-50 lg:flex dark:bg-slate-950">
        <CustomerSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <CustomerHeader />
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 lg:px-10">
            <Outlet />
          </main>
          <footer className="border-t border-cream-200 bg-white py-6 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
            <p>BookWise · Sua biblioteca, sempre com você.</p>
            <Link
              to="/"
              className="mt-1 inline-block text-brand-600 hover:underline dark:text-brand-400"
            >
              Voltar ao catálogo
            </Link>
          </footer>
        </div>
      </div>
    </CurrentCustomerProvider>
  );
}
