import { useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import type { UserRole } from '../types/api';
import { usersService, type UserInput } from '../services/usersService';
import { ApiError } from '../services/http';

interface UserFormModalProps {
  onClose: () => void;
  onCreated: () => void;
}

export default function UserFormModal({ onClose, onCreated }: UserFormModalProps) {
  const [form, setForm] = useState<UserInput>({
    name: '',
    email: '',
    role: 'READER',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = (field: keyof UserInput, value: string) => {
    setForm((prev) => ({ ...prev, [field]: field === 'role' ? (value as UserRole) : value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await usersService.create(form);
      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao salvar o usuário.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-xl dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Novo usuário</h2>
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

          <Field label="Nome">
            <input
              required
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              className={inputClass}
            />
          </Field>

          <Field label="Email">
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
              className={inputClass}
            />
          </Field>

          <Field label="Perfil">
            <select
              value={form.role}
              onChange={(e) => update('role', e.target.value)}
              className={inputClass}
            >
              <option value="READER">Leitor</option>
              <option value="LIBRARIAN">Bibliotecário</option>
              <option value="ADMIN">Administrador</option>
            </select>
          </Field>

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
