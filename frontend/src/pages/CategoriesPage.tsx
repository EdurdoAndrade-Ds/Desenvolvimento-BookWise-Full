import { useEffect, useState, useCallback } from 'react';
import { Plus, Search, Trash2, Pencil, FolderTree, RefreshCw } from 'lucide-react';
import type { Category, Page } from '../types/api';
import { categoriesService } from '../services/categoriesService';
import { ApiError } from '../services/http';
import CategoryFormModal from '../components/CategoryFormModal';
import { useFeedback } from '../feedback/useFeedback';

const PAGE_SIZE = 8;

export default function CategoriesPage() {
  const [data, setData] = useState<Page<Category> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const { confirm, notify } = useFeedback();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await categoriesService.list({ page, size: PAGE_SIZE, q: query }));
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'Não foi possível carregar as categorias. O backend está rodando em http://localhost:8080?',
      );
    } finally {
      setLoading(false);
    }
  }, [page, query]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const t = setTimeout(() => {
      setPage(0);
      setQuery(search.trim());
    }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const handleDelete = async (category: Category) => {
    const confirmed = await confirm({
      title: `Remover a categoria "${category.name}"?`,
      confirmLabel: 'Remover',
      tone: 'danger',
    });
    if (!confirmed) return;
    try {
      await categoriesService.remove(category.id);
      await load();
      notify(`Categoria "${category.name}" removida.`);
    } catch (err) {
      notify(err instanceof ApiError ? err.message : 'Erro ao remover a categoria.', 'error');
    }
  };

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };
  const openEdit = (category: Category) => {
    setEditing(category);
    setModalOpen(true);
  };

  const meta = data?.meta;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar categoria..."
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
          />
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" />
          Nova categoria
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {error ? (
          <div className="flex flex-col items-center gap-3 p-10 text-center">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            <button
              onClick={load}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <RefreshCw className="h-4 w-4" /> Tentar novamente
            </button>
          </div>
        ) : loading ? (
          <div className="p-10 text-center text-sm text-slate-400">Carregando...</div>
        ) : data && data.content.length === 0 ? (
          <div className="flex flex-col items-center gap-2 p-10 text-center text-slate-400">
            <FolderTree className="h-8 w-8" />
            <p className="text-sm">Nenhuma categoria encontrada.</p>
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400 dark:border-slate-800">
              <tr>
                <th className="px-6 py-3 font-medium">Nome</th>
                <th className="px-6 py-3 font-medium">Descrição</th>
                <th className="px-6 py-3 font-medium">Categoria pai</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {data?.content.map((category) => (
                <tr key={category.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-6 py-3 font-medium text-slate-800 dark:text-slate-100">
                    {category.name}
                  </td>
                  <td className="px-6 py-3 text-slate-600 dark:text-slate-300">
                    {category.description ?? '—'}
                  </td>
                  <td className="px-6 py-3">
                    {category.parentName ? (
                      <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                        {category.parentName}
                      </span>
                    ) : (
                      <span className="text-slate-400">raiz</span>
                    )}
                  </td>
                  <td className="px-6 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => openEdit(category)}
                        className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-brand-600 dark:hover:bg-slate-800"
                        title="Editar"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(category)}
                        className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"
                        title="Remover"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {meta && meta.totalElements > 0 && (
        <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
          <span>
            {meta.totalElements} categoria(s) · página {meta.page + 1} de {meta.totalPages}
          </span>
          <div className="flex gap-2">
            <button
              disabled={meta.page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-medium disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              Anterior
            </button>
            <button
              disabled={meta.page >= meta.totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-medium disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              Próxima
            </button>
          </div>
        </div>
      )}

      {modalOpen && (
        <CategoryFormModal category={editing} onClose={() => setModalOpen(false)} onSaved={load} />
      )}
    </div>
  );
}
