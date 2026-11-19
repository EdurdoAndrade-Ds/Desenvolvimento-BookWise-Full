import type { LucideIcon } from 'lucide-react';

interface PlaceholderPageProps {
  title: string;
  description: string;
  endpoint: string;
  icon: LucideIcon;
}

export default function PlaceholderPage({
  title,
  description,
  endpoint,
  icon: Icon,
}: PlaceholderPageProps) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center dark:border-slate-700 dark:bg-slate-900">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-100 text-brand-700 dark:bg-brand-600 dark:text-white">
        <Icon className="h-8 w-8" />
      </div>
      <h2 className="mt-5 text-xl font-semibold text-slate-800 dark:text-slate-100">{title}</h2>
      <p className="mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">{description}</p>
      <code className="mt-4 rounded-md bg-slate-100 px-3 py-1.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
        {endpoint}
      </code>
    </div>
  );
}
