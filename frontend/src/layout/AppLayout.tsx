import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { NAV_ITEMS, SECONDARY_NAV_ITEMS } from './navigation';

const COLLAPSE_KEY = 'bookwise-sidebar-collapsed';

function resolveTitle(pathname: string): string {
  const all = [...NAV_ITEMS, ...SECONDARY_NAV_ITEMS];
  const match = all.find((item) =>
    item.to === '/adm' ? pathname === '/adm' : pathname.startsWith(item.to),
  );
  return match?.label ?? 'BookWise';
}

export default function AppLayout() {
  const { pathname } = useLocation();
  const [collapsed, setCollapsed] = useState<boolean>(
    () => localStorage.getItem(COLLAPSE_KEY) === 'true',
  );
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleCollapse = () => {
    setCollapsed((prev) => {
      localStorage.setItem(COLLAPSE_KEY, String(!prev));
      return !prev;
    });
  };

  // Fecha o menu mobile ao trocar de rota.
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <div className="flex h-full">
      {/* Sidebar desktop */}
      <div className="hidden lg:flex">
        <Sidebar collapsed={collapsed} onToggleCollapse={toggleCollapse} />
      </div>

      {/* Sidebar mobile (overlay) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute inset-y-0 left-0">
            <Sidebar
              collapsed={false}
              onToggleCollapse={toggleCollapse}
              onNavigate={() => setMobileOpen(false)}
            />
          </div>
        </div>
      )}

      <div className="flex flex-1 flex-col overflow-hidden">
        <Header title={resolveTitle(pathname)} onOpenSidebar={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
