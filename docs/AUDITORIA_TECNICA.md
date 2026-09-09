# BookWise — Auditoria técnica (pente-fino)

> Data: 2026-09-09 · Escopo: **backend (Java 17 / Spring Boot 3.3) + frontend (React 18 / TS)**
> Foco: Regras de negócio, Boas práticas, POO/Herança, Clean Code, SOLID e JavaDoc.
> Viés: **acadêmico/didático** — cada achado explica o princípio envolvido.

## 0. Sumário executivo

O BookWise é um projeto **bem acima da média** para trabalho acadêmico: arquitetura
hexagonal/Clean real (`domain` / `application` / `infrastructure`), domínio modelado com
`record` **imutável**, inversão de dependência via **portas e adaptadores**, tratamento
de erro centralizado e cobertura ampla de JavaDoc a nível de classe.

Não há nada "quebrado" — os apontamentos abaixo são **dívida técnica, inconsistências e
escopo não concluído**. Foram classificados por severidade (Alta / Média / Baixa) e por
esforço, e separados em **quick wins** (baixo risco) e **estruturais** (mudam
comportamento/contrato e precisam de decisão).

### Nota important — estado real vs. `docs/PENDENCIAS.md`

Vários itens da `PENDENCIAS.md` (auditoria de 2026-08-21) **já foram resolvidos** e o
documento está desatualizado. A reconciliação:

| Item antigo (`PENDENCIAS.md`) | Estado real hoje |
|---|---|
| #9 `frontend/.npmrc` apontando para `http://artifactory...` | **Resolvido** — usa `https://${ARTIFACTORY_HOST}/...` |
| #11 "Backend testado só na borda / sem teste de serviço" | **Parcial** — já existem `LoanServiceTest`, `CategoryServiceTest`, `SaleServiceTest` |
| #12 `spring.jpa.open-in-view enabled by default` | **Resolvido** — `open-in-view: false` em `application.yml` e `application-local.yml` |
| #12 `HHH90003004` paginação em memória (Loans) | **Parcial** — `LoanRepositoryAdapter` usa two-step (`findPageIds` + `findAllWithItemsByIdIn`); confirmar Sales/Books |
| #8/#13 "Sem CI/CD" | **Parcial** — existem `.github/workflows/{backend,frontend,docker}-*.yml`, **mas** o repositório **não tem `.git`**, então o CI **nunca dispara** |

---

## 1. POO e Herança

### 1.1 [BOM] Imutabilidade e composição no domínio
Os modelos de domínio (`Book`, `User`, `Loan`, `Category`, `Reservation`, `Fine`, `Sale`)
são `record` imutáveis, com "cópias mutantes" explícitas (`withStock`, `withUpdatedData`,
`withStatus`) e regras de leitura no próprio agregado (`Loan.statusAt`,
`Reservation.statusAt`). É o padrão correto de POO moderna: estado imutável + composição
em vez de herança. **Manter.**

### 1.2 [ALTA] Falta uma superclasse comum para as exceções "não encontrado"
As 7 exceções (`BookNotFoundException`, `UserNotFoundException`, `LoanNotFoundException`,
`SaleNotFoundException`, `CategoryNotFoundException`, `ReservationNotFoundException`,
`FineNotFoundException`) estendem `RuntimeException` **isoladamente** e são listadas uma a
uma no `@ExceptionHandler` do `GlobalExceptionHandler`.

- **Princípios:** Herança / DRY / OCP. Uma base `NotFoundException extends RuntimeException`
  permite `@ExceptionHandler(NotFoundException.class)` e faz novas exceções "não
  encontrado" mapearem para HTTP 404 **automaticamente** (aberto à extensão, fechado à
  modificação).
- **Correção (quick win):** criar `domain/exception/NotFoundException` e fazer as 7
  estenderem dela; simplificar o handler.

### 1.3 [INFO] Ausência de herança Cliente/Usuário/Funcionário
O MER previa `Cliente`/`Usuario`/`Funcionario`; hoje há um único `User` + `UserRole`.
Modelar por **enum de papel** em vez de hierarquia de classes é uma decisão válida
(evita herança rígida), mas **diverge do modelo oficial**. Decisão de grupo — apenas
reportado.

### 1.4 [BAIXA] Entidades JPA mutáveis com Lombok
As `*Entity` usam `@Getter/@Setter/@NoArgsConstructor`. É aceitável (JPA exige construtor
sem-args e mutabilidade), mas o `@Setter` amplo abre espaço para estado inconsistente.
Como o domínio real é imutável e o mapeamento é isolado nos adapters, o risco é baixo.

---

## 2. SOLID

### 2.1 [MÉDIA] SRP — `LoanService` acumula responsabilidades
`LoanService.create/returnLoan` faz **validação**, **baixa/estorno de estoque** e
**geração de multa** no mesmo lugar. A mesma lógica de estoque se repete em `SaleService`.

- **Correção sugerida (estrutural):** extrair uma política de estoque
  (`StockService`/`InventoryPolicy`) e uma política de multa (`FinePolicy`) reutilizáveis.

### 2.2 [ALTA] OCP — regras de negócio hard-coded
`DEFAULT_LOAN_DAYS = 14`, `FINE_PER_DAY = 2.00` (em `LoanService` **e** duplicado em
`DataSeeder`) e `DEFAULT_EXPIRATION_DAYS = 7` (em `ReservationService`) são constantes no
código. Mudar a política exige recompilar.

- **Correção (quick win):** externalizar via `@ConfigurationProperties` (`bookwise.loan.*`,
  `bookwise.fine.*`, `bookwise.reservation.*`) em `application.yml`.

### 2.3 [BOM] DIP — inversão de dependência
Os services dependem exclusivamente das **portas** (`domain.port.*`); os adapters JPA ficam
em `infrastructure`. Excelente aderência ao DIP e à regra de dependência da Clean
Architecture. **Manter.**

### 2.4 [BAIXA] ISP — porta com método sobrecarregado
`LoanRepository` expõe `findAll(page,size)` **e** `findAll()` (lista completa). Misturar
paginado e não-paginado na mesma porta é um pequeno cheiro; documentar bem o uso do
não-paginado (agregações) ou separar.

### 2.5 [INFO] `OpenApiConfig` fora das camadas
Fica em `com.bookwise.config`, fora de `domain/application/infrastructure`. Coerência de
pacotes sugere movê-lo para `infrastructure.config` (onde já vivem `DataSeeder` e
`SpaForwardController`).

---

## 3. Clean Code

### 3.1 [MÉDIA] Duplicação de lógica de estoque
O bloco "se PHYSICAL, checa/baixa/estorna estoque" aparece em `LoanService` (create e
returnLoan) e `SaleService` (create e cancel), com a mesma mensagem de erro. **DRY.**
Centralizar numa política de estoque (ver 2.1) remove 4 cópias.

### 3.2 [MÉDIA] Constante `FINE_PER_DAY` duplicada
Definida em `LoanService` e novamente em `DataSeeder`. Fonte única de verdade → mover para
configuração (ver 2.2).

### 3.3 [BAIXA] Números mágicos e mensagens repetidas
Prazos/valores mágicos (14, 2.00, 7) e strings de erro repetidas ("Estoque insuficiente
para o livro '...'"). Extrair para constantes/config/mensagens.

### 3.4 [BOM] Mappers como utilitários bem selados
Os `*Mapper` são `final` com construtor privado e métodos `static` puros — padrão limpo.
**Manter.**

---

## 4. JavaDoc

### 4.1 [BOM] Cobertura de classe e `package-info`
Praticamente todas as classes têm JavaDoc de topo, e há `package-info.java` em `domain`,
`application` e `infrastructure` (~144 blocos `/** */`). Base muito boa.

### 4.2 [MÉDIA] Métodos públicos sem JavaDoc
Vários membros públicos não estão documentados, por exemplo:
- `Reservation.statusAt(...)` e `Reservation.withStatus(...)`;
- métodos `static` dos mappers (`toResponse`, `toPageResponse`, `toNewDomain`, `toRefs`);
- métodos públicos dos services (`list`, `getById`, `create`, `update`, `delete`, `pay`,
  `cancel`, `returnLoan`) — têm bom JavaDoc de classe, mas não de método;
- métodos dos controllers (têm `@Operation` do Swagger, mas não JavaDoc Java).

- **Correção (quick win):** completar JavaDoc dos métodos públicos das camadas `domain` e
  `application` (onde o valor didático é maior). Para os controllers, o `@Operation` já
  cobre a documentação de API — priorizar domínio/serviço.

### 4.3 [BAIXA] Consistência de acentuação
O código evita acentos em comentários/JavaDoc (provável decisão para fugir de problemas de
encoding), mas as mensagens ao usuário têm acento em alguns pontos e não em outros
("devolução" no front vs. "Emprestimo ja devolvido" no back). Padronizar.

---

## 5. Regras de negócio (lacunas funcionais)

| # | Regra | Estado | Severidade |
|---|---|---|---|
| 5.1 | Prazo de empréstimo e multa/dia | Hard-coded (14d, R$2,00) | Alta (OCP) |
| 5.2 | Limite de itens/empréstimos por usuário | Inexistente | Média |
| 5.3 | Renovação de empréstimo | Inexistente | Média |
| 5.4 | Bloqueio de empréstimo p/ quem tem multa pendente | Inexistente | Alta |
| 5.5 | Multa em atraso ainda **não devolvido** | Não gera/recalcula (só na devolução) | Alta |
| 5.6 | Reserva → empréstimo (conversão) | Inexistente | Média |
| 5.7 | Reserva bloqueia estoque | Não | Média |
| 5.8 | Expiração de reserva | Só **derivada** na leitura (sem job) | Baixa |

> Todos os itens desta seção **mudam comportamento e possivelmente o contrato OpenAPI** —
> são **estruturais** e devem ser confirmados item a item antes de implementar.

---

## 6. Frontend (React + TypeScript)

### 6.1 [BOM] Padrões de UI e tipagem
Páginas com estados de `loading`/`error`/`empty`, `useCallback` para carregamento, tipos
importados de `types/api`, `ApiError` dedicada e `tsconfig` **strict** com
`noUnusedLocals/Parameters`. Camada `services/` fina e coesa sobre `http.ts`.

### 6.2 [MÉDIA] Sem ESLint/Prettier — `lint` é só typecheck
`"lint": "tsc --noEmit"` verifica tipos, mas **não** aplica regras de estilo/qualidade nem
formatação.

**Correção aplicada (parcial):** foram adicionados os arquivos de configuração
`frontend/.eslintrc.cjs`, `frontend/.prettierrc.json` e `frontend/.prettierignore` (React
18 + TS + hooks + integração com Prettier). **Falta instalar as dependências e ligar os
scripts** — não foi possível fazer nesta sessão porque o registro npm corporativo
(`.npmrc`) depende de `ARTIFACTORY_HOST`/`NPM_REPO`, que estavam **vazias**, impedindo
`npm install` e a regeneração do `package-lock.json`.

Para concluir (com as variáveis do Artifactory definidas):

```bash
cd frontend
npm install -D eslint@8.57.1 @typescript-eslint/parser@7.18.0 \
  @typescript-eslint/eslint-plugin@7.18.0 eslint-plugin-react-hooks@4.6.2 \
  eslint-plugin-react-refresh@0.4.14 prettier@3.3.3 eslint-config-prettier@9.1.0
```

E então ajustar os scripts em `frontend/package.json`:

```jsonc
"scripts": {
  "dev": "vite",
  "build": "tsc -b && vite build",
  "preview": "vite preview",
  "typecheck": "tsc --noEmit",
  "lint": "eslint . --ext .ts,.tsx --max-warnings 0",
  "lint:fix": "eslint . --ext .ts,.tsx --fix",
  "format": "prettier --write .",
  "format:check": "prettier --check ."
}
```

> Observação de CI: o workflow `ci.yml` executa `npm run lint` no job do frontend. Após ligar
> o ESLint acima, o pipeline passa a rodar lint de verdade; o typecheck continua coberto pelo
> `npm run build` (`tsc -b`).

### 6.3 [MÉDIA] Zero testes automatizados
Nenhum Vitest/Testing Library. Bom candidato: testar os **módulos puros** de computação
gráfica (`graphics/imageFilters.ts`, `kernels.ts`, `procedural.ts`, `shelfLayout.ts`) e os
`services`. **Estrutural leve.**

### 6.4 [BAIXA] Artefatos de build no diretório de trabalho
`frontend/vite.config.js`, `frontend/vite.config.d.ts` e
`frontend/tsconfig.node.tsbuildinfo` são gerados. **Já estão listados** em
`frontend/.gitignore` (não serão versionados), mas continuam fisicamente na árvore de
trabalho — podem ser removidos com segurança (`vite.config.ts` é a fonte). Existe ainda
uma pasta `.pdftmp/` residual na raiz.

### 6.5 [BAIXA] UX com `window.confirm`/`alert`
Aceitável para projeto acadêmico, mas substituir por modais/toasts melhora acessibilidade
e consistência visual.

---

## 7. Infra / Engenharia

- **[ALTA] Repositório sem `.git`.** Existe o workflow de CI `ci.yml` (build do backend e do
  frontend em PRs), mas **sem histórico Git ele nunca executa**. Inicializar o Git é
  pré-requisito para CI, PRs e rollback. (Sob confirmação: `git init` + primeiro commit.)
- **[BAIXA] `docker-compose` sem frontend.** Sobe só API + Postgres; há `Dockerfile` na raiz
  (imagem única com o front embutido), mas o front não está no compose.
- **[MÉDIA] Divergência de seed local × docker.** `DataSeeder` (perfil `local`/H2) vs.
  Flyway `V3`/`V5` (perfil `docker`/Postgres) — risco de divergirem com o tempo.
- **[INFO] Discrepância DER × DDL** (`Livro.editora`/`preco` vs `genero`) — decisão de grupo.

---

## 8. Backlog priorizado

### Quick wins (baixo risco — serão aplicados nesta rodada)
1. **Base `NotFoundException`** + refatorar as 7 subclasses e o `GlobalExceptionHandler` (1.2).
2. **Externalizar constantes de negócio** via `@ConfigurationProperties` (2.2 / 3.2 / 5.1).
3. **Completar JavaDoc** dos métodos públicos de `domain` e `application` (4.2).
4. **ESLint + Prettier** no frontend + script `lint` real (6.2).
5. **`.gitignore`** cobrindo artefatos de build do frontend (6.4).

### Estruturais (mudam comportamento/contrato — exigem sua confirmação)
6. Extrair `StockService`/`FinePolicy` (2.1 / 3.1).
7. Regras de empréstimo: limite, renovação, bloqueio por multa pendente (5.2–5.4).
8. Multa recalculada/gerada para atraso em aberto (5.5).
9. Reserva → empréstimo + bloqueio/expiração de estoque (5.6–5.8).
10. Testes: serviço (regras novas) no back e Vitest no front (6.3).
11. `git init` + CI efetivo (Seção 7).

---

## 9. Status de correção (Fase 3 — quick wins)

| Item | Correção | Status |
|---|---|---|
| 1.2 | Base `NotFoundException` + handler simplificado (as 7 subclasses agora a estendem) | ✅ feito |
| 2.2 / 3.2 | `BusinessProperties` (`@ConfigurationProperties bookwise.*`) — prazo, multa/dia e expiração externalizados; `FINE_PER_DAY` duplicado removido de `LoanService`/`DataSeeder` | ✅ feito |
| 4.2 | JavaDoc nos métodos públicos dos 7 services + `Reservation.statusAt/withStatus` | ✅ feito |
| 6.2 | ESLint + Prettier — **configs criados**; instalação/scripts pendentes (registro npm indisponível, ver 6.2) | ◐ parcial |
| 6.4 | `.gitignore` de artefatos | já estava coberto (só limpeza física opcional) |

**Verificação:** `mvn -o test` (backend) executou com **BUILD SUCCESS** após as mudanças
(exit 0); `LoanServiceTest` foi ajustado para injetar `BusinessProperties`.

---

## 10. Status de correção (Fase 4 — itens estruturais 6–11)

| Item | Correção aplicada | Status |
|---|---|---|
| 2.1 / 3.1 / 3.3 | `application/policy/StockPolicy` (baixa/estorno de estoque físico) e `application/policy/FinePolicy` (cálculo idempotente de multa) reutilizados por `LoanService`, `SaleService` e `ReservationService` — as 4 cópias da regra de estoque foram removidas | ✅ feito |
| 5.2 | Limites configuráveis `bookwise.loan.max-items-per-loan` e `bookwise.loan.max-active-per-user` validados em `LoanService.create` | ✅ feito |
| 5.3 | Renovação: `Loan.renewalCount` + `renewedUntil`, migração `V13__loan_add_renewal_count.sql`, `POST /api/v1/loans/{id}/renew`, limites `max-renewals`/`renewal-days`, `loansService.renew` no front e contrato OpenAPI atualizado | ✅ feito |
| 5.4 | `bookwise.loan.block-when-fine-pending` bloqueia novo empréstimo e renovação para usuário com multa pendente (`FineRepository.existsPendingByUserId`) | ✅ feito |
| 5.5 | `LoanService.chargeOverdueLoans` gera/atualiza multa de empréstimo **em aberto** atrasado, respeitando `UNIQUE(loan_id)` (idempotente) e sem rebaixar multa já paga | ✅ feito |
| 5.6 | Conversão reserva → empréstimo: `POST /api/v1/reservations/{id}/convert` (rejeita reserva expirada/cancelada) + `reservationsService.convertToLoan` | ✅ feito |
| 5.7 | `bookwise.reservation.hold-stock` reserva (retém) estoque na criação, devolve no cancelamento/expiração e evita baixa dupla na conversão | ✅ feito |
| 5.8 | Expiração **persistida** via job agendado (`LibraryMaintenanceJobs`), habilitado por `bookwise.jobs.enabled` | ✅ feito |
| 6.2 | ESLint 8.57.1, Prettier 3.3.3 e plugins instalados com versão fixa; scripts `lint` (ESLint, `--max-warnings 0`), `format` (Prettier `--check`), `typecheck` e `test` separados; código formatado com Prettier | ✅ feito |
| 6.3 / 10 | Testes: backend `LoanServiceTest` (novas regras) e `ReservationServiceTest`; frontend Vitest em `services/http.test.ts` e `services/loansService.test.ts` | ✅ feito |
| 6.4 | Removidos `frontend/vite.config.js`, `frontend/vite.config.d.ts` e `frontend/tsconfig.node.tsbuildinfo`; `.pdftmp/` adicionado ao `.gitignore` | ✅ feito |
| 11 | Repositório versionado (Git inicializado) e `ci.yml` do frontend passou a rodar lint, Prettier, typecheck, testes e build (backend segue com `mvn verify`) | ✅ feito |
| 6.5 | `window.confirm`/`alert` substituídos por `FeedbackProvider` (modal de confirmação + toasts) usado por Empréstimos, Reservas, Vendas, Multas, Livros, Categorias e Usuários — diálogos nativos são ignorados quando a app roda dentro de um iframe, o que fazia o botão "Devolver" parecer inoperante | ✅ feito |

**Verificação executada nesta rodada:**

```text
backend : mvn test        -> Tests run: 72, Failures: 0, Errors: 0  (BUILD SUCCESS)
frontend: npm run lint    -> 0 erros / 0 warnings
frontend: npm run format  -> Prettier OK
frontend: npm run typecheck -> OK
frontend: npm test        -> 2 arquivos, 6 testes, todos passando
frontend: npm run build   -> built (aviso de chunk > 500 kB, pré-existente)
```

### Itens conscientemente não alterados
- **1.3** (herança Cliente/Funcionário), **2.5** (`OpenApiConfig` fora das camadas), **4.3**
  (acentuação), **7** (compose sem frontend, seed local × Flyway, discrepância DER × DDL) —
  decisões de modelagem/produto, mantidas como reportadas.
- Os defaults de negócio adotados (`max-active-per-user: 5`, `max-items-per-loan: 5`,
  `max-renewals: 2`, `renewal-days: 7`, `hold-stock: true`) são **sugestões**
  configuráveis em `application.yml`; ajuste conforme a regra do trabalho.

---

## 11. Relatórios analíticos em SQL nativo (Fase 5)

Antes desta fase o projeto **não tinha nenhuma query nativa**: a persistência usava
apenas métodos derivados do Spring Data e JPQL, e o dashboard baixava páginas de 500
livros/empréstimos/vendas para somar tudo no navegador.

| Ponto | Correção aplicada | Status |
|---|---|---|
| Agregação no navegador | `DashboardPage` passou a consumir `/api/v1/reports/*`; a única chamada paginada restante é `loans?size=5` (empréstimos recentes) | ✅ feito |
| Ausência de SQL nativo | `ReportJpaRepository` com `@Query(nativeQuery = true)` usando `JOIN`, `GROUP BY`, `ORDER BY`, `COUNT`, `COUNT(DISTINCT)`, `SUM`, `CASE WHEN`, `COALESCE`, `EXTRACT`, subconsultas correlacionadas e `LIMIT` | ✅ feito |
| Camadas | projeções em `infrastructure/persistence/projection`, porta `domain/port/ReportRepository`, adapter `ReportRepositoryAdapter`, records de domínio em `domain/model/report`, DTOs + `ReportMapper` e `ReportService` | ✅ feito |
| Configuração | `bookwise.report.low-stock-threshold` (3), `bookwise.report.history-months` (7) e `bookwise.report.ranking-size` (5) em `BusinessProperties.Report` | ✅ feito |
| Contrato | tag `Reports`, parâmetro compartilhado `ReportLimitParam` e schemas `LibrarySummary`, `BookRanking`, `MonthlyLoan`, `BorrowerRanking`, `LowStockBook` em `contracts/openapi.yaml` | ✅ feito |
| Testes | `ReportControllerTest` (5 testes de ponta a ponta em H2/PostgreSQL mode) e `reportsService.test.ts` no frontend | ✅ feito |

Endpoints:

```text
GET /api/v1/reports/summary                  indicadores consolidados do acervo
GET /api/v1/reports/top-books?limit=         livros mais emprestados
GET /api/v1/reports/loans-by-month?months=   série histórica (meses sem movimento zerados)
GET /api/v1/reports/top-borrowers?limit=     usuários com mais empréstimos + multas pendentes
GET /api/v1/reports/low-stock?threshold=     estoque crítico (unidades emprestadas e reservas)
```

**Verificação executada nesta rodada:**

```text
backend : mvn test          -> Tests run: 77, Failures: 0, Errors: 0  (BUILD SUCCESS)
frontend: npm run lint      -> 0 erros / 0 warnings
frontend: npm run format    -> Prettier OK
frontend: npm run typecheck -> OK
frontend: npm test          -> 3 arquivos, 9 testes, todos passando
frontend: npm run build     -> built (aviso de chunk > 500 kB, pré-existente)
API local (perfil local/H2): os 5 endpoints responderam 200 com dados agregados do seed
```
