import { Link } from 'react-router-dom';
import { useCurrentCustomer } from '../../context/useCurrentCustomer';

export default function MyAccountPage() {
  const { customer } = useCurrentCustomer();

  if (!customer) {
    return (
      <div className="rounded-2xl border border-dashed p-12 text-center text-slate-500">
        Selecione um cliente no cabeçalho para visualizar sua conta.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Minha conta</h1>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <p className="text-lg font-semibold text-slate-800 dark:text-slate-100">{customer.name}</p>
        <p className="mt-1 text-slate-500">{customer.email}</p>
        <p className="mt-4 text-sm text-slate-500">
          Cliente selecionado para esta sessão local. Quando a autenticação estiver disponível, esta
          informação virá da sua conta.
        </p>
      </div>

      <div className="flex flex-wrap gap-3 text-sm">
        <Link to="/my-loans" className="rounded-lg bg-brand-600 px-4 py-2 font-medium text-white">
          Meus empréstimos
        </Link>
        <Link
          to="/my-reservations"
          className="rounded-lg border px-4 py-2 font-medium text-slate-600 dark:border-slate-700 dark:text-slate-300"
        >
          Minhas reservas
        </Link>
        <Link
          to="/my-purchases"
          className="rounded-lg border px-4 py-2 font-medium text-slate-600 dark:border-slate-700 dark:text-slate-300"
        >
          Minhas compras
        </Link>
      </div>
    </div>
  );
}
