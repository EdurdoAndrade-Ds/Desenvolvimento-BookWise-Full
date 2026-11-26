import { BookOpen } from 'lucide-react';

export default function BookWiseBrand({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2 text-slate-800 dark:text-slate-100">
      <BookOpen className="h-6 w-6 shrink-0 text-brand-600 dark:text-brand-400" />
      {!compact && (
        <span className="text-xl font-extrabold tracking-tight">
          Book<span className="font-light">Wise</span>
        </span>
      )}
    </span>
  );
}
