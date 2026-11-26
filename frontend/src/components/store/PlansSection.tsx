import { useEffect, useRef, useState } from 'react';
import { BookOpen, Check, Sparkles, X } from 'lucide-react';
import SectionHeader from './SectionHeader';
import { formatCurrency } from '../../lib/format';
import { FREE_PAGES } from '../../lib/bookPreview';
import { useSubscription, type PlanId } from '../../subscription/useSubscription';

interface Plan {
  id: PlanId;
  name: string;
  price: number;
  period: string;
  note: string;
  highlight?: string;
  perks: string[];
}

const PLANS: Plan[] = [
  {
    id: 'mensal',
    name: 'Leitor',
    price: 19.9,
    period: '/mês',
    note: 'Cancele quando quiser.',
    perks: [
      'Leitura completa de todo o acervo digital',
      'Marcador sincronizado entre aparelhos',
      '10% de desconto nos livros físicos',
    ],
  },
  {
    id: 'anual',
    name: 'Leitor Anual',
    price: 14.9,
    period: '/mês',
    note: `Cobrado ${formatCurrency(178.8)} por ano. Economize 25%.`,
    highlight: 'Mais escolhido',
    perks: [
      'Tudo do plano Leitor',
      '1 empréstimo físico por mês, sem fila',
      'Frete grátis em qualquer compra',
      'Pré-venda dos lançamentos da curadoria',
    ],
  },
  {
    id: 'familia',
    name: 'Família',
    price: 29.9,
    period: '/mês',
    note: 'Até 4 perfis de leitura.',
    perks: [
      'Tudo do plano Leitor Anual',
      'Perfis separados, cada um com sua estante',
      'Área infantil com curadoria própria',
    ],
  },
];

/** Planos de assinatura: libera a leitura completa no Gabinete 3D (simulado). */
export default function PlansSection() {
  const { plan: current, start, cancel } = useSubscription();
  const [choosing, setChoosing] = useState<Plan | null>(null);
  const [done, setDone] = useState(false);
  const dialog = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!choosing) return;
    const close = (event: KeyboardEvent) => event.key === 'Escape' && setChoosing(null);
    window.addEventListener('keydown', close);
    dialog.current?.focus();
    return () => window.removeEventListener('keydown', close);
  }, [choosing]);

  const confirm = () => {
    if (!choosing) return;
    start(choosing.id);
    setDone(true);
  };

  const closeDialog = () => {
    setChoosing(null);
    setDone(false);
  };

  const backToReading = () => {
    closeDialog();
    document.getElementById('visualizador')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section
      id="planos"
      aria-labelledby="planos-title"
      className="mx-auto max-w-7xl scroll-mt-24 px-4 py-20 sm:px-6"
    >
      <SectionHeader index="06" label="Planos">
        <span id="planos-title">
          Leia o livro <em>inteiro</em>, não só as primeiras páginas.
        </span>
      </SectionHeader>
      <p className="mt-4 max-w-xl text-ink-soft">
        Qualquer visitante folheia {FREE_PAGES} páginas de cada título no Gabinete 3D. Assinantes
        seguem a leitura até o fim, em qualquer livro do acervo.
      </p>

      <ul className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
        {PLANS.map((plan) => {
          const featured = Boolean(plan.highlight);
          const active = current === plan.id;
          return (
            <li
              key={plan.id}
              className={`relative flex flex-col rounded-3xl border p-7 shadow-sm transition ${
                featured
                  ? 'border-transparent bg-cabinet text-[#f6f3ec] shadow-xl md:-translate-y-3'
                  : 'border-rule bg-paper-card text-ink'
              }`}
            >
              {plan.highlight ? (
                <span className="absolute -top-3 left-7 inline-flex items-center gap-1.5 rounded-full bg-gold px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-wider text-cabinet">
                  <Sparkles className="h-3 w-3" /> {plan.highlight}
                </span>
              ) : null}
              <h3 className="font-serif text-2xl">{plan.name}</h3>
              <p className="mt-4 flex items-baseline gap-1">
                <span className="font-serif text-4xl">{formatCurrency(plan.price)}</span>
                <span className={featured ? 'text-[#f6f3ec]/70' : 'text-ink-soft'}>
                  {plan.period}
                </span>
              </p>
              <p className={`mt-1 text-sm ${featured ? 'text-[#f6f3ec]/70' : 'text-ink-soft'}`}>
                {plan.note}
              </p>
              <ul className="mt-6 flex-1 space-y-3 text-sm">
                {plan.perks.map((perk) => (
                  <li key={perk} className="flex gap-2.5">
                    <Check
                      className={`mt-0.5 h-4 w-4 shrink-0 ${featured ? 'text-gold' : 'text-gold-deep'}`}
                    />
                    {perk}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                disabled={active}
                onClick={() => setChoosing(plan)}
                className={`mt-8 w-full rounded-md px-4 py-3 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-gold disabled:cursor-default ${
                  featured
                    ? 'bg-gold text-cabinet hover:brightness-110'
                    : 'bg-cabinet text-[#f6f3ec] hover:bg-[#3b2f26]'
                } ${active ? 'opacity-60' : ''}`}
              >
                {active ? 'Seu plano atual' : 'Assinar'}
              </button>
            </li>
          );
        })}
      </ul>

      {current ? (
        <p className="mt-8 text-center text-sm text-ink-soft">
          Assinatura de demonstração ativa.{' '}
          <button
            type="button"
            onClick={cancel}
            className="font-semibold text-ink underline underline-offset-4"
          >
            Cancelar e voltar ao limite de {FREE_PAGES} páginas
          </button>
        </p>
      ) : null}

      {choosing ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={closeDialog}
        >
          <div
            ref={dialog}
            role="dialog"
            aria-modal="true"
            aria-labelledby="assinar-title"
            tabIndex={-1}
            onClick={(event) => event.stopPropagation()}
            className="relative w-full max-w-md rounded-3xl bg-paper-card p-8 text-ink shadow-2xl focus:outline-none"
          >
            <button
              type="button"
              aria-label="Fechar"
              onClick={closeDialog}
              className="absolute right-4 top-4 rounded-full p-2 text-ink-soft hover:bg-paper-deep"
            >
              <X className="h-4 w-4" />
            </button>
            {done ? (
              <div className="text-center">
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gold/20 text-gold-deep">
                  <BookOpen className="h-6 w-6" />
                </span>
                <h3 id="assinar-title" className="mt-4 font-serif text-3xl">
                  Boas leituras!
                </h3>
                <p className="mt-2 text-ink-soft">
                  O plano {choosing.name} está ativo. Todas as páginas do Gabinete 3D foram
                  liberadas.
                </p>
                <button
                  type="button"
                  onClick={backToReading}
                  className="mt-6 w-full rounded-md bg-cabinet px-4 py-3 text-sm font-semibold text-[#f6f3ec] hover:bg-[#3b2f26]"
                >
                  Voltar para a leitura
                </button>
              </div>
            ) : (
              <>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-deep">
                  Confirmar assinatura
                </p>
                <h3 id="assinar-title" className="mt-2 font-serif text-3xl">
                  {choosing.name}
                </h3>
                <p className="mt-1 text-ink-soft">
                  {formatCurrency(choosing.price)}
                  {choosing.period} · {choosing.note}
                </p>
                <p className="mt-6 rounded-xl bg-paper-deep px-4 py-3 text-sm text-ink-soft">
                  Ambiente de demonstração: nenhuma cobrança é feita. A assinatura fica salva
                  apenas neste navegador.
                </p>
                <button
                  type="button"
                  onClick={confirm}
                  className="mt-6 w-full rounded-md bg-cabinet px-4 py-3 text-sm font-semibold text-[#f6f3ec] hover:bg-[#3b2f26]"
                >
                  Confirmar assinatura
                </button>
              </>
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}
