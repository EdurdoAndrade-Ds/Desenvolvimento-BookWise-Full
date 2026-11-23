export const SIDEBAR_SURFACE_CLASSES =
  'border-slate-200 bg-white text-slate-700 transition-[width] duration-200 motion-reduce:transition-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200';

export function sidebarWidthClasses(collapsed: boolean, responsive = false) {
  if (responsive) return collapsed ? 'lg:w-20' : 'lg:w-64';
  return collapsed ? 'w-20' : 'w-64';
}

export function sidebarItemClassName(isActive: boolean, collapsed: boolean) {
  return [
    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors motion-reduce:transition-none',
    collapsed ? 'justify-center' : '',
    isActive
      ? 'bg-brand-600 text-white'
      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white',
  ].join(' ');
}
