import { useEffect, useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import type { BookFormat, Category } from '../types/api';
import { booksService, type BookInput } from '../services/booksService';
import { categoriesService } from '../services/categoriesService';
import { ApiError } from '../services/http';

interface BookFormModalProps {
  onClose: () => void;
  onCreated: () => void;
}

export default function BookFormModal({ onClose, onCreated }: BookFormModalProps) {
  const [form, setForm] = useState<BookInput>({
    title: '',
    author: '',
    isbn: '',
    genre: '',
    publishedYear: undefined,
    format: 'PHYSICAL',
    price: undefined,
    stock: undefined,
    categoryIds: [],
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    categoriesService
      .listAll()
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  const toggleCategory = (id: number) => {
    setForm((prev) => {
      const current = prev.categoryIds ?? [];
      const next = current.includes(id) ? current.filter((c) => c !== id) : [...current, id];
      return { ...prev, categoryIds: next };
    });
  };

  const update = (field: keyof BookInput, value: string) => {
    setForm((prev) => ({
      ...prev,
      [field]:
        field === 'price' || field === 'stock' || field === 'publishedYear'
          ? value === ''
            ? undefined
            : Number(value)
          : field === 'format'
            ? (value as BookFormat)
            : value,
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await booksService.create(form);
      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao salvar o livro.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-xl dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Novo livro</h2>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
          {error && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
              {error}
            </div>
          )}

          <Field label="Título">
            <input
              required
              value={form.title}
              onChange={(e) => update('title', e.target.value)}
              className={inputClass}
            />
          </Field>

          <Field label="Autor">
            <input
              required
              value={form.author}
              onChange={(e) => update('author', e.target.value)}
              className={inputClass}
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="ISBN">
              <input
                required
                value={form.isbn}
                onChange={(e) => update('isbn', e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="Formato">
              <select
                value={form.format}
                onChange={(e) => update('format', e.target.value)}
                className={inputClass}
              >
                <option value="PHYSICAL">Físico</option>
                <option value="DIGITAL">Digital</option>
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Gênero">
              <input
                value={form.genre ?? ''}
                onChange={(e) => update('genre', e.target.value)}
                placeholder="Ex.: Tecnologia"
                className={inputClass}
              />
            </Field>
            <Field label="Ano de publicação">
              <input
                type="number"
                value={form.publishedYear ?? ''}
                onChange={(e) => update('publishedYear', e.target.value)}
                placeholder="Ex.: 2008"
                className={inputClass}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Preço (R$)">
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.price ?? ''}
                onChange={(e) => update('price', e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="Estoque">
              <input
                type="number"
                min="0"
                value={form.stock ?? ''}
                onChange={(e) => update('stock', e.target.value)}
                className={inputClass}
              />
            </Field>
          </div>

          {categories.length > 0 && (
            <div>
              <span className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300">
                Categorias
              </span>
              <div className="flex flex-wrap gap-2">
                {categories.map((c) => {
                  const active = (form.categoryIds ?? []).includes(c.id);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => toggleCategory(c.id)}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                        active
                          ? 'bg-brand-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                      }`}
                    >
                      {c.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
            >
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const inputClass =
  'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300">
        {label}
      </span>
      {children}
    </label>
  );
}
