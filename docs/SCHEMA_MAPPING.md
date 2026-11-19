# BookWise — De-Para do Schema (Oficial ↔ Implementação)

Este documento mapeia o **schema oficial da faculdade** (MER/DER/DDL em português,
alvo SQLite) para a **implementação** do BookWise (código em **inglês**, code-first,
PostgreSQL/H2).

> Decisões do time:
> - Código/tabelas/colunas em **inglês** (padrão profissional). O MER/DER poderá ser
>   **gerado a partir do nosso modelo** mais adiante.
> - Banco: manter **PostgreSQL (docker)** + **H2 (local)**; adaptar tipos do DDL SQLite.
> - Evolução **incremental** ("por partes").
> - Separação Cliente / Usuario / Funcionario: **em análise** (ver seção Decisões pendentes).

## Mapa de tabelas

| Oficial (PT / SQLite) | Nosso modelo (EN) | Status |
|---|---|---|
| `Livro` | `Book` (`books`) | ✅ implementado (enriquecer: `genre`, `publishedYear`) |
| `Usuario` / `Cliente` / `Funcionario` | `User` (`users`) — unificado com `role` | ⚠️ parcial (split em análise) |
| `Categoria` (+ auto-relacionamento) | `Category` | ✅ implementado |
| `Livro_Categoria` (N:N) | `book_categories` | ✅ implementado |
| `Emprestimo` + `Itens_Emprestimo` | `Loan` + `LoanItem` | ✅ implementado |
| `Venda` + `Itens_Venda` | `Sale` + `SaleItem` | ✅ implementado |
| `Reserva` | `Reservation` | ✅ implementado |
| `Multa` (1:1 Emprestimo) | `Fine` | ✅ implementado |
| `Loja` / `Setor` / `Estante` | `Store` / `Section` / `Shelf` | 🕓 adiado |
| `Unidade_Livro` (estoque físico) | `BookUnit` / `Stock` | 🕓 adiado |
| `Fornecedor` / `Fornecimento` | `Supplier` / `Supply` | 🕓 adiado |
| `Comissao` | `Commission` | 🕓 adiado |

## De-para de colunas (tabelas já implementadas)

### Livro → Book (`books`)
| Oficial | Nosso | Observação |
|---|---|---|
| `id_livro` | `id` | |
| `titulo` | `title` | |
| `isbn` | `isbn` | único |
| `autor` | `author` | |
| `ano_publicacao` | `publishedYear` | a adicionar |
| `genero` | `genre` | a adicionar |
| `editora` (só no DER) | `publisher` | discrepância DER×DDL (ver abaixo) |
| `preco` (só no DER) | `price` | já temos `price` no nosso modelo |
| — (nosso extra) | `format` (PHYSICAL/DIGITAL) | simplificação do protótipo |
| — (nosso extra) | `stock` | no oficial, estoque fica em `Unidade_Livro` |

### Usuario/Cliente/Funcionario → User (`users`)
| Oficial | Nosso | Observação |
|---|---|---|
| `Usuario.id_usuario` | `id` | |
| `Usuario.nome` / `Cliente.nome` | `name` | |
| `Usuario.email` | `email` | único |
| `Usuario.senha` | *(a adicionar na Fase 2 — BCrypt)* | login |
| `Funcionario.cargo` / tipo | `role` (ADMIN/LIBRARIAN/READER) | nosso enum unifica os papéis |
| `Cliente.cpf`, `telefone` | *(não modelado ainda)* | vem no split |

## Arquitetura de áreas (implementado, sem autenticação)

Duas áreas já estão separadas:

- **Portal do Cliente** (`/`): catálogo, detalhe do livro e páginas do cliente. O
  seletor "navegando como <cliente>" identifica temporariamente o cliente até a auth.
- **Back-office / Gestão** (`/adm`): usado por **Funcionário e Admin no mesmo shell**.
  O portal não possui link para `/adm`.

A autenticação, os papéis e a proteção das rotas serão implementados na **Fase 2**,
planejada em `docs/PLANO_FASE2.md`. O escopo inicial do portal está em
`docs/PLANO_PORTAL_FRONT.md`.

## Decisões pendentes (analisar com calma)

1. **Split de pessoas**: o oficial separa `Cliente` (comprador, tem CPF), `Usuario`
   (login 1:1 com Cliente) e `Funcionario` (staff). Hoje temos um `User` único com
   `role`. Provável desmembramento **na Fase 2** (necessário para o login de cliente).
   Impacta Empréstimo, Venda e auth.
2. **Banco de dados**: manter Postgres/H2 (atual) ou trocar para SQLite para bater 1:1
   com o script. Por ora, mantido Postgres/H2.
3. **Discrepância DER × DDL**: o **DER** mostra `Livro.editora` e `Livro.preco`; o
   **DDL** (script) **não** tem essas colunas (tem `genero`). Confirmar com o grupo qual
   vale. Provisoriamente seguimos o DDL + mantemos `price` (já existente no protótipo).

## Roadmap incremental (por partes)

- **Parte A** — Enriquecer `Book` com `genre` e `publishedYear` (aproxima do `Livro`).
- **Parte B** — `Loan` + `LoanItem` (empréstimos/devolução) → dashboard fica real.
- **Parte C** — `Sale` + `SaleItem` (vendas).
- **Parte D** — `Category` (+ auto-relacionamento) e `book_categories`.
- **Parte E** — `Reservation` e `Fine`.
- **Fase 2 (auth + áreas)** — login/cadastro/recuperação, split de pessoas
  (Cliente/Usuario/Funcionario), Portal do Cliente (`/`) + Back-office (`/adm`) com
  papéis (Spring Security + JWT).
- **Adiado** — Loja/Setor/Estante, Unidade_Livro, Fornecedor/Fornecimento, Comissão.
