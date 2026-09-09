# BookWise — Handoff

Documento de passagem de bastão: estado atual, como rodar, o que está feito, o que
falta e próximos passos. Atualizado em 2026-08-11.

## O que é

**BookWise — Biblioteca Inteligente**: sistema de gestão de bibliotecas/livrarias
(físicas e digitais) com controle de livros, categorias, empréstimos, reservas, vendas,
multas e usuários. Trabalho acadêmico (grupo Eduardo, Izabela, José, Maria Luiza,
Pedro Belarmino, Rafael Garcia).

## Localização e stack

- **Raiz**: `C:\Users\X346703\project\git\api\bookwise` (monorepo; **não** é repo git ainda)
- **Backend** (`backend/`): Java 17 + Spring Boot 3.3.5, Clean Architecture
  (domain / application / infrastructure), Spring Data JPA, Bean Validation, Lombok,
  springdoc-openapi. Build Maven.
- **Frontend** (`frontend/`): React 18 + TypeScript + Vite + Tailwind CSS + React Router
  + lucide-react. Registry npm corporativo em `frontend/.npmrc`.
- **Contrato**: `contracts/openapi.yaml` (referência de design, validado no build por
  `OpenApiContractTest`).
- **De-para schema oficial ↔ implementação**: `docs/SCHEMA_MAPPING.md`.

## Banco de dados / perfis

- **local** (default): **H2 em memória**, schema via `ddl-auto=create-drop`, dados de
  exemplo via `DataSeeder` (`@Profile("local")`). Roda **sem Docker/Postgres**. O script
  `backend/src/main/resources/db/local-schema-alignment.sql`, executado após o DDL do
  Hibernate, alinha no H2 local as FKs declaradas nas migrations PostgreSQL. Ele é
  necessário porque algumas entidades usam ids `Long` simples, sem associações JPA,
  então o DDL do Hibernate não cria essas constraints.
- **docker**: PostgreSQL 16 + **Flyway** (migrations `V1`..`V12`). `docker-compose.yml`
  na raiz sobe API + Postgres.
- Nomenclatura em **inglês** no código (decisão do time); o schema oficial (PT/SQLite)
  é referência — ver `SCHEMA_MAPPING.md`.

## Como rodar

```bash
# Backend (perfil local, H2, com dados de exemplo)
cd bookwise/backend
mvn spring-boot:run            # http://localhost:8080  | Swagger: /swagger-ui.html

# Frontend (outro terminal)
cd bookwise/frontend
npm install                    # 1a vez (usa registry corporativo do .npmrc)
npm run dev                    # http://localhost:5173  (proxy /api -> :8080)
```

> Observação: o startup local do backend está demorando ~60-90s nesta máquina.
> As portas 8080/5173 às vezes ficam presas por processos Java/Node zumbis — se
> "port already in use", matar o PID que escuta a porta e subir de novo.

## Como validar

- Backend: `cd backend && mvn clean test`  → **38 testes** (última execução: BUILD SUCCESS)
- Frontend: `cd frontend && npm run build`  → typecheck estrito + Vite

## Estado atual (o que está PRONTO)

Recursos com backend (CRUD + regras), página no front e reais no dashboard:

| Recurso        | Backend | Página front | Observações |
|----------------|:------:|:-----------:|-------------|
| Books          | ✅ | ✅ | genre, publishedYear, format, price, stock, **N:N categorias** |
| Categories     | ✅ | ✅ | auto-relacionamento (parentId → subcategorias) |
| Users          | ✅ | ✅ | role ADMIN/LIBRARIAN/READER (modelo único, sem split ainda) |
| Loans          | ✅ | ✅ | itens N:N, status derivado ACTIVE/RETURNED/LATE, baixa/retorno de estoque |
| Reservations   | ✅ | ✅ | status derivado EXPIRED, criar/cancelar |
| Sales          | ✅ | ✅ | itens N:N c/ preço unitário, total, cancelar (restaura estoque) |
| Fines          | ✅ | ✅ | **1:1 com empréstimo**, gerada na devolução em atraso (R$ 2,00/dia), pagar |

Outras entregas:
- **Tema claro/escuro** (system/light/dark, persistido) + **menu colapsável/responsivo**
  + página de **Configurações** (`/adm/settings`), com a aba **Banco de dados**:
    visões **Tabelas**, **MER** e **DER**. O MER é conceitual, na notação de Chen,
    com os modos **Visão geral** e **Por entidade**, derivado do mesmo
    `GET /api/v1/schema`; tabelas de junção/itens aparecem como relacionamentos
    N:N e seus atributos próprios como elipses ligadas aos losangos.
- **Dashboard 100% real**: total de livros, empréstimos ativos, vendas do mês (pagas),
  usuários, gráfico de empréstimos/mês, alertas (estoque baixo, empréstimos atrasados).
- Migrations Flyway `V1`..`V12` (Postgres) e seed equivalente no `DataSeeder` (H2 local).
- `GET /api/v1/schema` lê a estrutura do banco por introspecção JDBC, retornando apenas
  metadados de database, tabelas, colunas, PKs, FKs e constraints UNIQUE para a aba
  **Banco de dados**; nenhuma linha de dados é exposta.
- Contrato OpenAPI cobre todos os recursos e é validado no build.

Regras de negócio implementadas:
- Empréstimo baixa estoque de livros físicos (409 se insuficiente); devolução restaura.
- Devolução **após** a data prevista **gera multa** automaticamente (1:1, R$ 2,00/dia).
- Venda baixa estoque; cancelamento restaura.
- Categoria não pode ser pai de si mesma (409).

## Verificação concluída

A Parte E (Reservas + Multas) foi validada ponta a ponta, com backend no ar, seed
completo, curls dos endpoints e **38 testes verdes**.

Durante a verificação foi corrigido definitivamente um `LazyInitializationException`
no `DataSeeder`: coleções LAZY de itens eram acessadas pelo caminho `findAll(Sort)`.
A correção foi aplicada com `@EntityGraph(attributePaths = "items")` nos overloads
`findAll(Sort)` de `LoanJpaRepository` e `SaleJpaRepository`.

Também foram confirmados:
- `GET /api/v1/reservations` → 3 reservas, incluindo uma `EXPIRED` derivada.
- `GET /api/v1/fines` → multa do Bruno, 4 dias de atraso, R$ 8,00, PENDING.
- `GET /api/v1/books?q=clean` → Clean Code com categoria Tecnologia.

## Filtros por cliente

Os GETs paginados de loans, reservations, sales e fines aceitam o parâmetro opcional
`?userId=`. O filtro de fines usa subselect pelo proprietário do empréstimo, sem
adicionar coluna ou migration. O contrato OpenAPI e os testes de controller foram
atualizados; o backend possui **38 testes**.

## Decisões e pendências de produto

- **Áreas separadas, sem autenticação nesta fase**: 2 áreas —
  **Portal do Cliente** (`/`, catálogo, detalhe e páginas `my-*`) e **Back-office**
  (`/adm`, Funcionário + Admin no mesmo shell). O seletor "navegando como <cliente>"
  faz temporariamente o papel do login; `/adm` não possui link no portal.
- **Split de pessoas** (em análise): schema oficial separa `Cliente` (CPF) + `Usuario`
  (login 1:1) + `Funcionario`. Hoje temos `User` único com `role`. Provável desmembrar
  na Fase 2 (auth).
- **Recuperar senha / e-mail**: opção Firebase (grátis) vs SMTP próprio — decidir no
  início da Fase 2 (impacta "Spring Security + JWT próprio" vs validar token Firebase).
- **Discrepância DER × DDL**: DER mostra `Livro.editora` e `Livro.preco`; DDL tem `genero`.
  Seguimos o DDL + mantivemos `price`. Confirmar com o grupo.

## Roadmap (próximos passos sugeridos)

1. **Fase 2 — Autenticação**: Spring Security + JWT (senha BCrypt em `Usuario`),
   login/cadastro/recuperar senha e proteção por papel. A fase está planejada em
   `docs/PLANO_FASE2.md` e foi adiada por decisão do usuário.
2. Melhorias técnicas opcionais: remover warning de paginação com fetch-join em
   Loans/Sales/Books (`firstResult/maxResults ... applying in memory`) usando busca em
   duas etapas; editar livro/categoria já suportado no back (PUT) — ampliar no front.
3. Inicializar **git** no monorepo (hoje não versionado).

O plano da separação inicial do front está documentado em
`docs/PLANO_PORTAL_FRONT.md`.

## Estrutura resumida

```
bookwise/
├── contracts/openapi.yaml
├── docker-compose.yml
├── docs/ (SCHEMA_MAPPING.md, HANDOFF.md)
├── backend/  (Spring Boot; domain/application/infrastructure; migrations V1..V12; testes por controller)
└── frontend/ (Vite React TS; portal em / e back-office em /adm)
```
