import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { FREE_SHIPPING_THRESHOLD } from '../../lib/storefront';
import { formatCurrency } from '../../lib/format';

const BENEFITS = [
  {
    title: 'Frete grátis',
    text: `Acima de ${formatCurrency(FREE_SHIPPING_THRESHOLD)}, para todo o Brasil.`,
  },
  { title: 'Pix e parcelamento', text: '5% de desconto no Pix ou até 4x sem juros.' },
  { title: 'Embalagem cuidadosa', text: 'Papel kraft, cantoneiras e nenhum plástico.' },
  { title: 'Troca facilitada', text: 'Até 30 dias, sem formulários intermináveis.' },
];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ReadingRoomSection() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'invalid' | 'done'>('idle');

  const subscribe = (event: FormEvent) => {
    event.preventDefault();
    if (!EMAIL_PATTERN.test(email.trim())) {
      setStatus('invalid');
      return;
    }
    // A loja nao possui endpoint de newsletter: o cadastro e apenas visual por enquanto.
    setStatus('done');
    setEmail('');
  };

  return (
    <>
      <section
        aria-labelledby="sala-title"
        className="relative overflow-hidden bg-gradient-to-b from-[#2c1a10] to-[#12100f] text-[#f6f3ec]"
      >
        <div className="mx-auto max-w-3xl px-4 py-24 text-center sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold">
            <span className="mr-3 font-serif text-base tracking-normal">07</span>
            Sala de leitura
          </p>
          <blockquote className="mt-8 font-serif text-2xl italic leading-relaxed sm:text-3xl">
            “Sempre imaginei que o paraíso fosse uma espécie de biblioteca.”
            <footer className="mt-4 font-sans text-sm not-italic text-[#f6f3ec]/60">
              Jorge Luis Borges, atribuída
            </footer>
          </blockquote>
          <h2 id="sala-title" className="mt-12 font-serif text-4xl">
            Entre. Fique à vontade.
          </h2>
          <p className="mx-auto mt-4 max-w-md text-[#f6f3ec]/70">
            Aqui não há pressa: cada estante foi montada para ser percorrida devagar, como numa
            biblioteca de bairro.
          </p>
          <Link
            to={{ pathname: '/', hash: '#biblioteca' }}
            className="mt-8 inline-block rounded-md bg-[#f6f3ec] px-6 py-3 text-sm font-semibold text-[#2a211b] hover:bg-white"
          >
            Percorrer as estantes
          </Link>
        </div>
      </section>

      <section aria-labelledby="beneficios-title" className="border-b border-rule bg-paper-deep">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <h2 id="beneficios-title" className="sr-only">
            Benefícios
          </h2>
          <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {BENEFITS.map((benefit, index) => (
              <li key={benefit.title}>
                <span className="font-serif text-xl text-gold">0{index + 1}</span>
                <h3 className="mt-2 font-serif text-xl text-ink">{benefit.title}</h3>
                <p className="mt-1 text-sm text-ink-soft">{benefit.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section
        aria-labelledby="carta-title"
        className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold-deep">
          Carta mensal
        </p>
        <h2
          id="carta-title"
          className="mt-3 font-serif text-3xl text-ink sm:text-4xl [&_em]:italic [&_em]:text-gold-deep"
        >
          Uma carta por mês, <em>com boas companhias.</em>
        </h2>
        <p className="mt-3 text-ink-soft">
          Indicações, trechos escolhidos e lançamentos, sem excesso.
        </p>
        <form
          onSubmit={subscribe}
          noValidate
          className="mx-auto mt-8 flex max-w-md flex-col gap-3 sm:flex-row"
        >
          <label className="sr-only" htmlFor="newsletter-email">
            Seu e-mail
          </label>
          <input
            id="newsletter-email"
            type="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              setStatus('idle');
            }}
            placeholder="Seu e-mail"
            aria-invalid={status === 'invalid'}
            className="w-full rounded-md border border-rule bg-paper-card px-4 py-3 text-sm text-ink outline-none focus:border-gold"
          />
          <button
            type="submit"
            className="rounded-md bg-cabinet px-6 py-3 text-sm font-semibold text-[#f6f3ec] hover:bg-[#3b2f26]"
          >
            Assinar
          </button>
        </form>
        <p role="status" className="mt-3 min-h-5 text-sm">
          {status === 'invalid' ? (
            <span className="text-wine">Informe um e-mail válido.</span>
          ) : status === 'done' ? (
            <span className="text-ink-soft">Obrigado! Sua carta chega no próximo mês.</span>
          ) : null}
        </p>
      </section>
    </>
  );
}
