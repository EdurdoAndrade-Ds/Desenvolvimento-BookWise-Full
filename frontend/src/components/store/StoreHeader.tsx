import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  Boxes,
  Menu,
  Palette,
  Receipt,
  Search,
  ShoppingBag,
  UserCircle,
  Bookmark,
  Heart,
  X,
  type LucideIcon,
} from 'lucide-react';
import ThemeToggle from '../ThemeToggle';
import { useCart } from '../../cart/useCart';
import { useCurrentCustomer } from '../../context/useCurrentCustomer';

const SECTION_LINKS = [
  { id: 'visualizador', label: 'Gabinete 3D' },
  { id: 'categorias', label: 'Categorias' },
  { id: 'destaques', label: 'Destaques' },
  { id: 'biblioteca', label: 'Biblioteca' },
  { id: 'para-voce', label: 'Para você' },
  { id: 'planos', label: 'Planos' },
];

const AREA_LINKS: { to: string; label: string; icon: LucideIcon }[] = [
  { to: '/my-loans', label: 'Empréstimos', icon: Bookmark },
  { to: '/my-reservations', label: 'Reservas', icon: Heart },
  { to: '/my-purchases', label: 'Compras', icon: ShoppingBag },
  { to: '/my-fines', label: 'Multas', icon: Receipt },
  { to: '/shelf-3d', label: 'Estante 3D', icon: Boxes },
  { to: '/cover-studio', label: 'Cover Studio', icon: Palette },
];

export function BrandMark({ className = '' }: { className?: string }) {
  return (
    <span className={`font-serif text-2xl tracking-tight text-ink ${className}`}>
      Book<em className="italic text-gold-deep">wise</em>
    </span>
  );
}

function CustomerPanel({ onNavigate }: { onNavigate?: () => void }) {
  const { customer, customers, setCustomer, loading } = useCurrentCustomer();
  return (
    <div className="space-y-3">
      <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-ink-soft">
        Navegando como
        <select
          value={customer?.id ?? ''}
          disabled={loading}
          onChange={(event) => {
            const selected = customers.find((item) => item.id === Number(event.target.value));
            setCustomer(selected ?? null);
          }}
          className="mt-2 w-full rounded-md border border-rule bg-paper-card px-3 py-2 text-sm normal-case tracking-normal text-ink outline-none focus:border-gold"
        >
          <option value="">Selecione um cliente...</option>
          {customers.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </label>
      <nav aria-label="Minha área" className="grid gap-1">
        <Link
          to="/my-account"
          onClick={onNavigate}
          className="flex items-center gap-2 rounded-md px-2 py-2 text-sm text-ink hover:bg-paper-deep"
        >
          <UserCircle className="h-4 w-4 text-gold-deep" /> Minha conta
        </Link>
        {AREA_LINKS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-paper-deep ${
                isActive ? 'bg-paper-deep font-semibold text-ink' : 'text-ink'
              }`
            }
          >
            <Icon className="h-4 w-4 text-gold-deep" /> {label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

export default function StoreHeader() {
  const navigate = useNavigate();
  const { customer } = useCurrentCustomer();
  const { count, open: openCart } = useCart();
  const [searchOpen, setSearchOpen] = useState(false);
  const [term, setTerm] = useState('');
  const [accountOpen, setAccountOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!accountOpen) return;
    const onPointer = (event: MouseEvent) => {
      if (!accountRef.current?.contains(event.target as Node)) setAccountOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setAccountOpen(false);
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [accountOpen]);

  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    const query = term.trim();
    navigate({
      pathname: '/',
      search: query ? `?q=${encodeURIComponent(query)}` : '',
      hash: '#biblioteca',
    });
    setSearchOpen(false);
  };

  const initials = customer?.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  return (
    <header id="topo" className="sticky top-0 z-30 border-b border-rule bg-paper/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link to="/" aria-label="BookWise — início" className="shrink-0">
          <BrandMark />
        </Link>

        <nav aria-label="Seções da loja" className="hidden items-center gap-1 lg:flex">
          {SECTION_LINKS.map((link) => (
            <Link
              key={link.id}
              to={{ pathname: '/', hash: `#${link.id}` }}
              className="rounded-full px-3 py-2 text-sm text-ink-soft transition hover:bg-paper-deep hover:text-ink"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setSearchOpen((value) => !value)}
            aria-label="Buscar por título, autor ou categoria"
            aria-expanded={searchOpen}
            className="rounded-full p-2 text-ink-soft hover:bg-paper-deep hover:text-ink"
          >
            <Search className="h-5 w-5" />
          </button>

          <div ref={accountRef} className="relative hidden lg:block">
            <button
              type="button"
              onClick={() => setAccountOpen((value) => !value)}
              aria-expanded={accountOpen}
              aria-label="Minha área"
              title={customer?.name ?? 'Minha área'}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-cabinet text-xs font-semibold text-[#f6f3ec] hover:bg-[#3b2f26]"
            >
              {initials || <UserCircle className="h-5 w-5" />}
            </button>
            {accountOpen ? (
              <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-rule bg-paper-card p-4 shadow-xl">
                <CustomerPanel onNavigate={() => setAccountOpen(false)} />
              </div>
            ) : null}
          </div>

          <ThemeToggle />

          <button
            type="button"
            onClick={openCart}
            aria-label={`Abrir sacola, ${count} ${count === 1 ? 'item' : 'itens'}`}
            className="relative rounded-full p-2 text-ink-soft hover:bg-paper-deep hover:text-ink"
          >
            <ShoppingBag className="h-5 w-5" />
            {count > 0 ? (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-wine px-1 text-[0.65rem] font-bold text-white">
                {count}
              </span>
            ) : null}
          </button>

          <button
            type="button"
            onClick={() => setMenuOpen((value) => !value)}
            aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={menuOpen}
            className="rounded-full p-2 text-ink-soft hover:bg-paper-deep lg:hidden"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {searchOpen ? (
        <form
          role="search"
          onSubmit={submitSearch}
          className="border-t border-rule bg-paper-card px-4 py-3 sm:px-6"
        >
          <div className="mx-auto flex max-w-3xl gap-2">
            <input
              autoFocus
              value={term}
              onChange={(event) => setTerm(event.target.value)}
              placeholder="Buscar por título, autor ou categoria"
              aria-label="Buscar por título, autor ou categoria"
              className="w-full rounded-full border border-rule bg-paper px-5 py-2.5 text-sm text-ink outline-none focus:border-gold"
            />
            <button
              type="submit"
              className="rounded-full bg-cabinet px-6 py-2.5 text-sm font-semibold text-[#f6f3ec] hover:bg-[#3b2f26]"
            >
              Buscar
            </button>
          </div>
        </form>
      ) : null}

      {menuOpen ? (
        <div className="max-h-[75vh] overflow-y-auto border-t border-rule bg-paper-card px-4 py-4 lg:hidden">
          <nav aria-label="Seções da loja" className="mb-4 grid gap-1">
            {SECTION_LINKS.map((link) => (
              <Link
                key={link.id}
                to={{ pathname: '/', hash: `#${link.id}` }}
                onClick={() => setMenuOpen(false)}
                className="rounded-md px-2 py-2 text-sm text-ink hover:bg-paper-deep"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="border-t border-rule pt-4">
            <CustomerPanel onNavigate={() => setMenuOpen(false)} />
          </div>
        </div>
      ) : null}
    </header>
  );
}
