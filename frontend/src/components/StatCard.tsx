import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  hint?: string;
  trend?: string;
  trendUp?: boolean;
  icon: LucideIcon;
  accent?: string;
}

export default function StatCard({
  label,
  value,
  hint,
  trend,
  trendUp = true,
  icon: Icon,
  accent = 'bg-brand-100 text-brand-700',
}: StatCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
          <p className="mt-2 text-3xl font-bold text-slate-800 dark:text-slate-100">{value}</p>
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${accent}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2 text-sm">
        {trend && (
          <span className={`font-medium ${trendUp ? 'text-emerald-600' : 'text-red-600'}`}>
            {trendUp ? '▲' : '▼'} {trend}
          </span>
        )}
        {hint && <span className="text-slate-400">{hint}</span>}
      </div>
    </div>
  );
}
