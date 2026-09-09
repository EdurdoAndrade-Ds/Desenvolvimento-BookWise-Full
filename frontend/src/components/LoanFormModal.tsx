import { useEffect, useState, type FormEvent } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import type { Book, User } from '../types/api';
import { usersService } from '../services/usersService';
import { booksService } from '../services/booksService';
import { loansService, type LoanItemInput } from '../services/loansService';
import { ApiError } from '../services/http';

interface LoanFormModalProps {
  onClose: () => void;
  onCreated: () => void;
}

export default function LoanFormModal({ onClose, onCreated }: LoanFormModalProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [userId, setUserId] = useState<number | ''>('');
  const [dueDate, setDueDate] = useState('');
  const [items, setItems] = useState<LoanItemInput[]>([{ bookId: 0, quantity: 1 }]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([usersService.list({ size: 100 }), booksService.list({ size: 200 })])
      .then(([u, b]) => {
        setUsers(u.content);
        setBooks(b.content);
      })
      .catch(() => setError('Não foi possível carregar usuários/livros.'));
  }, []);

  const updateItem = (index: number, field: keyof LoanItemInput, value: string) => {
    setItems((prev) =>
      prev.map((it, i) => (i === index ? { ...it, [field]: Number(value) } : it)),
    );
  };

  const addItem = () => setItems((prev) => [...prev, { bookId: 0, quantity: 1 }]);
  const removeItem = (index: number) =>
    setItems((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== index)));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (userId === '') {
      setError('Selecione o usuário.');
      return;
    }
    const validItems = items.filter((it) => it.bookId > 0 && it.quantity > 0);
    if (validItems.length === 0) {
      setError('Adicione ao menos um livro.');
      return;
    }
    setSaving(true);
    try {
      await loansService.create({
        userId: Number(userId),
        dueDate: dueDate || undefined,
        items: validItems,
      });
      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao registrar o empréstimo.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-xl rounded-xl bg-white shadow-xl dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
            Novo empréstimo
          </h2>
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

          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300">
                Usuário
              </span>
              <select
                value={userId}
                onChange={(e) => setUserId(e.target.value === '' ? '' : Number(e.target.value))}
                className={inputClass}
              >
                <option value="">Selecione...</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300">
                Data prevista (opcional)
              </span>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className={inputClass}
              />
            </label>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Livros</span>
              <button
                type="button"
                onClick={addItem}
                className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:underline"
              >
                <Plus className="h-4 w-4" /> Adicionar livro
              </button>
            </div>
            <div className="space-y-2">
              {items.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <select
                    value={item.bookId}
                    onChange={(e) => updateItem(index, 'bookId', e.target.value)}
                    className={`${inputClass} flex-1`}
                  >
                    <option value={0}>Selecione um livro...</option>
                    {books.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.title}
                        {b.format === 'PHYSICAL' ? ` (estoque: ${b.stock ?? 0})` : ' (digital)'}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                    className={`${inputClass} w-20`}
                  />
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="rounded-md p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-30 dark:hover:bg-red-500/10"
                    disabled={items.length === 1}
                    title="Remover"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

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
              {saving ? 'Salvando...' : 'Registrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const inputClass =
  'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100';
