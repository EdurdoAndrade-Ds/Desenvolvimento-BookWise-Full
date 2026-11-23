import { renderToStaticMarkup } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import CustomerSidebar from './CustomerSidebar';
import { SidebarBrand, SidebarCollapseButton } from './SidebarChrome';
import { sidebarItemClassName, sidebarWidthClasses } from './sidebarStyles';

vi.mock('../context/useCurrentCustomer', () => ({
  useCurrentCustomer: () => ({ customer: { name: 'Ada Lovelace' } }),
}));

afterEach(() => vi.unstubAllGlobals());

function renderSidebar(stored: string | null) {
  vi.stubGlobal('localStorage', { getItem: () => stored });
  return renderToStaticMarkup(
    <StaticRouter location="/">
      <CustomerSidebar />
    </StaticRouter>,
  );
}

describe('shared sidebar presentation', () => {
  it('uses the same desktop widths with a responsive customer variant', () => {
    expect(sidebarWidthClasses(false)).toBe('w-64');
    expect(sidebarWidthClasses(true)).toBe('w-20');
    expect(sidebarWidthClasses(false, true)).toBe('lg:w-64');
    expect(sidebarWidthClasses(true, true)).toBe('lg:w-20');
  });

  it('shares active, inactive and centered collapsed item styles', () => {
    expect(sidebarItemClassName(true, false)).toContain('bg-brand-600 text-white');
    expect(sidebarItemClassName(false, false)).toContain('dark:hover:bg-slate-800');
    expect(sidebarItemClassName(false, true)).toContain('justify-center');
    expect(sidebarItemClassName(false, false)).not.toContain('justify-center');
  });

  it('uses the admin brand and an icon-only accessible collapsed control', () => {
    expect(renderToStaticMarkup(<SidebarBrand collapsed={false} />)).toContain('BookWise');
    const brand = renderToStaticMarkup(<SidebarBrand collapsed />);
    expect(brand).toContain('lucide-book-marked');
    expect(brand).not.toContain('BookWise');
    const toggle = renderToStaticMarkup(
      <SidebarCollapseButton collapsed onToggle={() => {}} controls="customer-navigation" />,
    );
    expect(toggle).toContain('aria-label="Expandir menu"');
    expect(toggle).toContain('aria-expanded="false"');
    expect(toggle).toContain('lucide-chevron-right');
    expect(toggle).not.toContain('Recolher menu');
  });
});

describe('CustomerSidebar', () => {
  it('keeps customer links, initials, active state and a single bottom toggle when expanded', () => {
    const html = renderSidebar('true');
    for (const label of [
      'Minha conta',
      'Catálogo',
      'Empréstimos',
      'Reservas',
      'Compras',
      'Multas',
      'Estúdio de capas',
    ]) {
      expect(html).toContain(`title="${label}"`);
      expect(html).toContain(`>${label}</span>`);
    }
    expect(html).toContain('>AL</span>');
    expect(html).toContain('aria-current="page"');
    expect(html).toContain('aria-expanded="true"');
    expect(html).toContain('Recolher menu</button>');
    expect(html.match(/<button/g)).toHaveLength(1);
    expect(html.indexOf('<button')).toBeGreaterThan(html.indexOf('</nav>'));
    expect(html).not.toContain('href="/shelf-3d"');
    expect(html).toContain('href="/cover-studio"');
  });

  it.each([null, 'false', 'invalid'])(
    'defaults to icon-only links for stored value %s',
    (stored) => {
      const html = renderSidebar(stored);
      expect(html).toContain('lg:w-20');
      expect(html).toContain('title="Catálogo"');
      expect(html).not.toContain('>Catálogo</span>');
      expect(html).toContain('aria-label="Expandir menu"');
    },
  );

  it('renders collapsed even when storage is unavailable', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('Storage unavailable');
      },
    });
    const html = renderToStaticMarkup(
      <StaticRouter location="/">
        <CustomerSidebar />
      </StaticRouter>,
    );
    expect(html).toContain('aria-expanded="false"');
  });
});
