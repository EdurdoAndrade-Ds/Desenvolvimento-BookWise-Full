import { Pencil, Percent, Trash2 } from 'lucide-react';

interface BookRowActionsProps {
  bookTitle: string;
  onAdjust: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const editClass =
  'rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-brand-600 dark:hover:bg-slate-800';
const removeClass =
  'rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10';

export default function BookRowActions({
  bookTitle,
  onAdjust,
  onEdit,
  onDelete,
}: BookRowActionsProps) {
  const actions = [
    { label: 'Ajustar preço', icon: Percent, onClick: onAdjust },
    { label: 'Editar', icon: Pencil, onClick: onEdit },
    { label: 'Remover', icon: Trash2, onClick: onDelete, danger: true },
  ];

  return (
    <div role="group" aria-label={`Ações de ${bookTitle}`} className="flex justify-end gap-1">
      {actions.map(({ label, icon: Icon, onClick, danger }) => (
        <button
          key={label}
          type="button"
          onClick={onClick}
          aria-label={`${label}: ${bookTitle}`}
          title={label}
          className={danger ? removeClass : editClass}
        >
          <Icon className="h-4 w-4" />
        </button>
      ))}
    </div>
  );
}
