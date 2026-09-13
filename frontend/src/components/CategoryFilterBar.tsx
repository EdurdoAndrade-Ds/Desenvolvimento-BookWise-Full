import { BookMarked, GraduationCap, Heart, Sparkles, Wand2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Category } from '../types/api';

const ACCENTS = [
  'bg-rose-100 text-rose-600',
  'bg-amber-100 text-amber-600',
  'bg-sky-100 text-sky-600',
  'bg-emerald-100 text-emerald-600',
  'bg-violet-100 text-violet-600',
];

const ICONS: LucideIcon[] = [Heart, Wand2, BookMarked, GraduationCap];

interface CategoryFilterBarProps {
  categories: Category[];
  value: string;
  onChange: (value: string) => void;
}

export default function CategoryFilterBar({ categories, value, onChange }: CategoryFilterBarProps) {
  return (
    <div className="flex gap-6 overflow-x-auto pb-1">
      <CategoryChip
        label="All"
        icon={Sparkles}
        accent={ACCENTS[0]}
        active={value === ''}
        onClick={() => onChange('')}
      />
      {categories.map((category, index) => (
        <CategoryChip
          key={category.id}
          label={category.name}
          icon={ICONS[index % ICONS.length]}
          accent={ACCENTS[(index + 1) % ACCENTS.length]}
          active={value === String(category.id)}
          onClick={() => onChange(String(category.id))}
        />
      ))}
    </div>
  );
}

function CategoryChip({
  label,
  icon: Icon,
  accent,
  active,
  onClick,
}: {
  label: string;
  icon: LucideIcon;
  accent: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className="flex min-w-[4.5rem] flex-col items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300"
    >
      <span
        className={[
          'flex h-12 w-12 items-center justify-center rounded-2xl transition',
          accent,
          active ? 'ring-2 ring-slate-900/20 dark:ring-white/40' : 'opacity-80 hover:opacity-100',
        ].join(' ')}
      >
        <Icon className="h-5 w-5" />
      </span>
      <span className="max-w-[5rem] truncate">{label}</span>
    </button>
  );
}
