import { BookMarked, ChevronLeft, ChevronRight } from 'lucide-react';

export function SidebarBrand({
  collapsed,
  className = '',
}: {
  collapsed: boolean;
  className?: string;
}) {
  return (
    <div
      className={`flex items-center gap-2 px-6 py-5 ${collapsed ? 'justify-center px-0' : ''} ${className}`}
    >
      <BookMarked className="h-7 w-7 shrink-0 text-brand-600 dark:text-brand-500" />
      {!collapsed && (
        <span className="text-xl font-bold tracking-tight text-slate-800 dark:text-white">
          BookWise
        </span>
      )}
    </div>
  );
}

export function SidebarCollapseButton({
  collapsed,
  onToggle,
  controls,
}: {
  collapsed: boolean;
  onToggle: () => void;
  controls?: string;
}) {
  const label = collapsed ? 'Expandir menu' : 'Recolher menu';
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={!collapsed}
      aria-controls={controls}
      aria-label={label}
      title={label}
      className="hidden shrink-0 items-center justify-center gap-2 border-t border-slate-200 py-3 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-600 motion-reduce:transition-none lg:flex dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
    >
      {collapsed ? (
        <ChevronRight className="h-4 w-4" />
      ) : (
        <>
          <ChevronLeft className="h-4 w-4" /> Recolher menu
        </>
      )}
    </button>
  );
}
