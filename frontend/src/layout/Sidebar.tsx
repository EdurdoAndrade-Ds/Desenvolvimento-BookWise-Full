import { NavLink } from 'react-router-dom';
import { BookMarked, ChevronLeft, ChevronRight } from 'lucide-react';
import { NAV_ITEMS, SECONDARY_NAV_ITEMS, type NavItem } from './navigation';

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  onNavigate?: () => void;
}

export default function Sidebar({ collapsed, onToggleCollapse, onNavigate }: SidebarProps) {
  const renderItem = ({ label, to, icon: Icon, end }: NavItem) => (
    <NavLink
      key={to}
      to={to}
      end={end ?? to === '/'}
      onClick={onNavigate}
      title={collapsed ? label : undefined}
      className={({ isActive }) =>
        [
          'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
          collapsed ? 'justify-center' : '',
          isActive
            ? 'bg-brand-600 text-white'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white',
        ].join(' ')
      }
    >
      <Icon className="h-5 w-5 shrink-0" />
      {!collapsed && label}
    </NavLink>
  );

  return (
    <aside
      className={`flex h-full flex-col border-r border-slate-200 bg-white text-slate-700 transition-[width] duration-200 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      <div
        className={`flex items-center gap-2 px-6 py-5 ${collapsed ? 'justify-center px-0' : ''}`}
      >
        <BookMarked className="h-7 w-7 shrink-0 text-brand-600 dark:text-brand-500" />
        {!collapsed && (
          <span className="text-xl font-bold tracking-tight text-slate-800 dark:text-white">
            BookWise
          </span>
        )}
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">{NAV_ITEMS.map(renderItem)}</nav>

      <div className="space-y-1 border-t border-slate-200 px-3 py-3 dark:border-slate-800">
        {SECONDARY_NAV_ITEMS.map(renderItem)}
      </div>

      <button
        type="button"
        onClick={onToggleCollapse}
        className="hidden items-center justify-center gap-2 border-t border-slate-200 py-3 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-800 lg:flex dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
      >
        {collapsed ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <>
            <ChevronLeft className="h-4 w-4" /> Recolher menu
          </>
        )}
      </button>
    </aside>
  );
}
