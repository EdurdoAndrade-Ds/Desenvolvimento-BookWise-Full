# BookWise — Plano: separação de áreas no front (Portal do Cliente + `/adm`)

Documento de planejamento. **Nada implementado ainda.**

Escopo desta etapa: **só front**, **sem autenticação**. Auth/JWT/recuperação de senha
ficam parados em `PLANO_FASE2.md` para um momento posterior.

## Situação atual

- `App.tsx`: 9 rotas planas (`/`, `/books`, `/categories`, `/loans`, `/reservations`,
  `/sales`, `/fines`, `/users`, `/settings`), todas dentro de `AppLayout` (sidebar +
  header de gestão). Ou seja: **o app inteiro é back-office** e o `/` é o Dashboard.
- `layout/navigation.ts` tem a lista única de itens do menu; `AppLayout.resolveTitle`
  deriva o título do header a partir dessa lista.
- `services/http.ts` é o único ponto de saída HTTP; endpoints do backend já cobrem tudo
  que o portal precisa (nenhuma mudança de backend nesta etapa).

## O que muda

Duas áreas, cada uma com seu layout:

| Área | Prefixo | Layout | Público |
|---|---|---|---|
| **Portal do Cliente** | `/` | `CustomerLayout` (header simples + rodapé, sem sidebar) | visitante/cliente |
| **Back-office** | `/adm` | `AppLayout` (o atual, sidebar + header) | funcionário/admin |

O Dashboard sai do `/` e vira `/adm`. Todas as 9 páginas de hoje passam para baixo de
`/adm/...` — **as páginas em si não mudam**, só o lugar na árvore de rotas.

## As duas telas novas do portal

### 1. `/` — Catálogo (vitrine)

- Grid de cards de livro (capa placeholder, título, autor, preço, "disponível"/"esgotado"
  por `stock`), busca com debounce e paginação — reaproveitando `booksService.list`
  (`?q=&page=&size=`), exatamente como `BooksPage` já faz.
- Filtro por categoria via `categoriesService` (chips ou select).
- Visual de vitrine, **sem** as ações de gestão (nada de criar/editar/excluir livro).
- Card clica → detalhe.

### 2. `/livros/:id` — Detalhe do livro

- Dados de `booksService.getById`: título, autor, ISBN, gênero, ano, formato, preço,
  categorias e disponibilidade.
- Botões de ação: **Reservar**, **Emprestar**, **Comprar**.
- Estados: livro inexistente → 404 amigável; `stock = 0` → ações de empréstimo/compra
  desabilitadas com explicação (o backend devolve 409 se faltar estoque).

## O problema do "quem é o cliente" (sem login)

`POST /loans`, `/reservations` e `/sales` exigem `userId`. Sem auth não existe "usuário
logado". Opções (decisão **P1**):

- **(a) Seletor de cliente no header do portal** — um dropdown "Você está navegando como:
  <cliente>" carregado de `usersService`, guardado em `localStorage` e exposto por um
  `CurrentCustomerContext`. É o caminho que **menos trabalho joga fora**: quando a auth
  entrar, esse context passa a ser alimentado pelo `/me` e o seletor é removido — as
  páginas não mudam.
- **(b) Ações abrem um modal que pede o cliente** a cada operação. Mais simples, porém
  repetitivo e descartável.
- **(c) Cliente fixo hard-coded** (ex.: id 3). Mais rápido, mas some com a noção de dono e
  não serve para demonstrar as telas "minhas reservas/meus empréstimos".

Recomendo **(a)**.

## Telas "do cliente" que (a) habilita — opcional nesta etapa

Se o grupo quiser, com o cliente atual definido dá para incluir, sem backend novo:
`/minha-conta`, `/meus-emprestimos`, `/minhas-reservas`, `/minhas-multas`,
`/minhas-compras` — todas filtrando a lista existente pelo `userId` do cliente atual.
Hoje esse filtro é **no front** (os endpoints listam tudo paginado); se o grupo quiser
filtro real, entra um `?userId=` no backend — ver decisão **P3**.

## Estrutura de arquivos proposta

```
src/
├── App.tsx                        (rotas: portal em '/', back-office em '/adm')
├── layout/
│   ├── AppLayout.tsx              (existente; títulos/links passam a considerar '/adm')
│   ├── navigation.ts              (existente; 'to' vira '/adm', '/adm/books', ...)
│   ├── CustomerLayout.tsx         (novo: header do portal + Outlet + rodapé)
│   └── CustomerHeader.tsx         (novo: logo, busca, ThemeToggle, seletor de cliente,
│                                   link discreto "Área da equipe" → /adm)
├── context/CurrentCustomerContext.tsx  (novo)
├── pages/customer/
│   ├── CatalogPage.tsx            (novo)
│   └── BookDetailPage.tsx         (novo)
└── components/BookCard.tsx        (novo)
```

Cuidados na migração:
- `navigation.ts`: trocar os `to` para `/adm/...` — o `resolveTitle` do `AppLayout` casa
  por `startsWith`, então o item do dashboard (`to: '/adm'`) casaria com tudo; a
  comparação exata que hoje existe para `'/'` precisa passar a valer para `'/adm'`.
- Qualquer `navigate(...)`/`<Link>` interno das páginas de gestão precisa apontar para o
  novo prefixo (varrer o `src` por rotas hard-coded antes de dar por pronto).
- `ThemeToggle`/tema e o colapso da sidebar continuam funcionando como hoje (chaves de
  `localStorage` inalteradas).

## Validação

- `npm run build` (typecheck estrito + Vite) verde.
- Ponta a ponta com backend no ar: catálogo lista e busca livros; detalhe abre; reservar
  cria reserva que aparece em `/adm/reservations`; emprestar baixa estoque; livro sem
  estoque bloqueia; back-office continua inteiro em `/adm`; tema e menu mobile OK.

## Ordem de execução

1. Mover o back-office para `/adm` (rotas + `navigation.ts` + links internos) e conferir
   que nada quebrou. Passo isolado, sem tela nova.
2. `CustomerLayout` + `CurrentCustomerContext` (conforme P1).
3. `/` catálogo + `BookCard`.
4. `/livros/:id` detalhe + ações (reservar/emprestar/comprar).
5. (Opcional) páginas "minhas ...".

Passos 1–4 cabem numa sessão minha.

## Decisões que preciso de você

- **P1 — cliente atual**: seletor no header (recomendado), modal por ação, ou id fixo?
- **P2 — ações no detalhe**: já entram as três (reservar/emprestar/comprar) ou começamos
  só com **reservar** e o resto vem depois?
- **P3 — páginas "minhas ..."**: entram agora ou ficam pra depois? Se entrarem, filtro no
  front (nenhuma mudança de backend) ou `?userId=` nos endpoints?
- **P4 — nomes das rotas**: portal em português (`/livros/:id`, `/meus-emprestimos`) e
  back-office mantendo o inglês (`/adm/books`) — confirma essa mistura, ou padroniza tudo
  num idioma?
- **P5 — entrada do back-office**: link discreto "Área da equipe" no header do portal, ou
  `/adm` fica sem link nenhum (acesso só digitando a URL)?
