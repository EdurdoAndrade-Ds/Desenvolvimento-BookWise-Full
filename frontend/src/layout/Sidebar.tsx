import { NavLink } from 'react-router-dom';
import { NAV_ITEMS, SECONDARY_NAV_ITEMS, type NavItem } from './navigation';
import { SidebarBrand, SidebarCollapseButton } from './SidebarChrome';
import {
  SIDEBAR_SURFACE_CLASSES,
  sidebarItemClassName,
  sidebarWidthClasses,
} from './sidebarStyles';

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
      className={({ isActive }) => sidebarItemClassName(isActive, collapsed)}
    >
      <Icon className="h-5 w-5 shrink-0" />
      {!collapsed && label}
    </NavLink>
  );

  return (
    <aside
      className={`flex h-full flex-col border-r ${SIDEBAR_SURFACE_CLASSES} ${sidebarWidthClasses(collapsed)}`}
    >
      <SidebarBrand collapsed={collapsed} />

      <nav className="flex-1 space-y-1 px-3 py-4">{NAV_ITEMS.map(renderItem)}</nav>

      <div className="space-y-1 border-t border-slate-200 px-3 py-3 dark:border-slate-800">
        {SECONDARY_NAV_ITEMS.map(renderItem)}
      </div>

      <SidebarCollapseButton collapsed={collapsed} onToggle={onToggleCollapse} />
    </aside>
  );
}
