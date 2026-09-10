# BookWise — Plano da Fase 2 (Autenticação + Áreas por papel)

Documento de planejamento. **Nada implementado ainda** — este plano existe para o grupo
revisar e fechar as decisões abertas (seção final) antes de codar.

Base: estado atual descrito em `HANDOFF.md` (Partes A–E prontas, 32 testes verdes,
app validado ponta a ponta) e decisões de `SCHEMA_MAPPING.md`.

## Objetivo

1. **Login/cadastro/recuperação de senha** com Spring Security + JWT próprio.
2. **Split de pessoas** (`Cliente` / `Usuario` / `Funcionario`), aproximando o schema oficial.
3. **Duas áreas no front**: **Portal do Cliente** (`/`) e **Back-office** (`/adm`),
   com rotas e menus protegidos por papel.

## Situação atual (ponto de partida)

- Backend: `User` único (`users`: id, name, email, role, created_at) com
  `role ∈ {ADMIN, LIBRARIAN, READER}`. **Sem senha, sem Spring Security** — todos os
  endpoints `/api/v1/**` são abertos.
- Front: app inteiro é back-office; `App.tsx` tem 9 rotas planas dentro de `AppLayout`;
  `services/http.ts` é o único ponto de saída HTTP (bom lugar para injetar o token).
- Migrations Flyway até `V12` (Postgres) + `DataSeeder` equivalente para H2/local.

## Etapa 2.1 — Modelo de pessoas (backend)

Desmembrar o `User` atual, seguindo o schema oficial:

| Entidade | Tabela | Conteúdo |
|---|---|---|
| `Customer` (Cliente) | `customers` | name, cpf (único), email, phone |
| `Employee` (Funcionario) | `employees` | name, email, position/cargo, admin? |
| `Account` (Usuario) | `accounts` | email (único, login), password_hash (BCrypt), role, ativo, 1:1 opcional com `customers` **ou** com `employees` |

Pontos de atenção:
- `Loan`/`Reservation`/`Fine` hoje referenciam `users.id`. Passam a referenciar
  `customers.id` (é o cliente que empresta/reserva/deve multa); `Sale` referencia o
  **cliente** e, opcionalmente, o **funcionário** que registrou a venda.
- Migração de dados: `V13`..`V15` criam as tabelas novas, copiam os registros de `users`
  (READER → `customers`; ADMIN/LIBRARIAN → `employees`), criam `accounts` para todos e
  reapontam as FKs. `users` só é dropada no final, em migration própria.
- `UserController`/`UsersPage` viram **dois** recursos: `/api/v1/customers` e
  `/api/v1/employees` (este só para ADMIN).
- `DataSeeder` e as `V*.sql` de seed precisam ser reescritos em conjunto, senão o perfil
  `local` (H2) e o `docker` (Postgres) divergem.

> Alternativa mais barata, se o grupo quiser reduzir escopo: manter `User` único e apenas
> adicionar `password_hash` + `cpf`/`phone`. Perde-se a fidelidade ao MER oficial, mas a
> Fase 2 encurta bastante (não há migração de FK). Ver decisão **D1**.

## Etapa 2.2 — Autenticação (backend)

- Dependência `spring-boot-starter-security` + biblioteca JWT (`jjwt` ou `nimbus-jose-jwt`
  — o `nimbus` já vem transitivo no ecossistema Spring; escolher uma só).
- `SecurityConfig` stateless (`SessionCreationPolicy.STATELESS`), CSRF off, filtro
  `JwtAuthenticationFilter` lendo `Authorization: Bearer`.
- Senhas com **BCrypt** (`BCryptPasswordEncoder`), nunca em log/response.
- Endpoints novos (`/api/v1/auth/**`, públicos):
  - `POST /register` — autocadastro **de cliente** (cria `Customer` + `Account` role READER).
  - `POST /login` — email+senha → `{ accessToken, expiresIn, role, name }`.
  - `POST /forgot-password` — gera token de uso único com validade (tabela
    `password_reset_tokens`), dispara e-mail. **Sempre responde 202**, mesmo para e-mail
    inexistente (não vazar quais e-mails existem).
  - `POST /reset-password` — token + nova senha.
  - `GET /me` — dados do usuário autenticado (usado pelo front no boot).
- Autorização por papel nos endpoints existentes:

| Recurso | READER (cliente) | LIBRARIAN | ADMIN |
|---|---|---|---|
| books/categories (GET) | público | ✓ | ✓ |
| books/categories (POST/PUT/DELETE) | ✗ | ✓ | ✓ |
| loans / reservations | só as próprias | todas | todas |
| sales | só as próprias | todas | todas |
| fines | só as próprias (+ pagar) | todas | todas |
| customers | só o próprio | ✓ | ✓ |
| employees | ✗ | ✗ | ✓ |

- O "só as próprias" exige filtro por dono no service (não só `@PreAuthorize`): um cliente
  autenticado não pode ler `GET /loans/{id}` de outro. Vale um teste por recurso para isso.
- Erros de auth precisam sair no formato do `GlobalExceptionHandler`/`ApiError`
  (401/403), não no HTML default do Spring Security.
- Swagger: liberar `/swagger-ui/**` e `/v3/api-docs/**` e declarar o `bearerAuth` no
  `OpenApiConfig`; refletir os `security` schemes em `contracts/openapi.yaml`
  (o `OpenApiContractTest` valida o contrato no build).

## Etapa 2.3 — Front: áreas e proteção de rotas

- `AuthContext` + `useAuth`: token em `localStorage`, `GET /me` no boot, `logout`.
- `services/http.ts`: injetar `Authorization` e tratar 401 (limpa sessão → `/login`).
- Rotas:
  - **Portal do Cliente** (`CustomerLayout`): `/` catálogo público, `/livros/:id`,
    `/login`, `/cadastro`, `/recuperar-senha`, `/redefinir-senha`; autenticado:
    `/minha-conta`, `/meus-emprestimos`, `/minhas-reservas`, `/minhas-multas`, `/minhas-compras`.
  - **Back-office** (`/adm`, `AppLayout` atual): as 9 páginas de hoje migram para baixo de
    `/adm` (dashboard, books, categories, loans, reservations, sales, fines, users, settings).
    Seções admin-only (funcionários) escondidas do menu **e** protegidas na rota.
- `<RequireAuth roles={[...]}>` como wrapper de rota + filtro no `navigation.ts` por papel.
- Redirect pós-login por papel: READER → `/`, LIBRARIAN/ADMIN → `/adm`.

## Etapa 2.4 — Recuperação de senha (envio de e-mail)

Duas opções (decisão **D2**):

| | SMTP próprio (`spring-boot-starter-mail`) | Firebase Auth |
|---|---|---|
| Auth | JWT nosso (já planejado) | token do Firebase validado no backend |
| Custo | grátis (Gmail app password / Mailtrap em dev) | grátis no free tier |
| Esforço | baixo — só o envio do e-mail | médio/alto — troca o modelo de auth |
| Dependência externa | só no envio | login inteiro depende do Firebase |

Recomendação: **SMTP próprio**, mantendo o JWT nosso; em dev, log do link em vez de envio
real (perfil `local`), Mailtrap/Gmail no `docker`. Firebase só se o grupo quiser social login.

## Validação da fase

- Testes novos: login ok/senha errada, acesso sem token → 401, papel insuficiente → 403,
  cliente lendo recurso de outro cliente → 403/404, fluxo completo de reset de senha.
- `mvn clean test` verde (hoje 32 testes) e `npm run build` verde.
- Ponta a ponta: cadastro de cliente → login → reservar/emprestar no portal → ver como
  funcionário no `/adm` → login de admin acessando funcionários.

## Ordem sugerida de execução

1. **2.2 sem split** — Security + JWT + login/`/me` sobre o `User` atual (+ `password_hash`).
   Já entrega login funcionando e é reversível.
2. **2.3** — áreas no front (`/` e `/adm`) + proteção de rotas.
3. **2.1** — split de pessoas + migração de FKs (maior risco; melhor com login já estável).
4. **2.4** — recuperação de senha.

Cada passo cabe numa sessão minha; o passo 3 é o único que pode passar disso, por causa
da migração de dados e da reescrita dos seeds.

## Decisões que preciso do grupo antes de codar

- **D1 — Split de pessoas**: fazer o desmembramento `Customer`/`Employee`/`Account`
  (fiel ao MER, mexe nas FKs de Loan/Sale/Reservation/Fine) **ou** manter `User` único com
  `password_hash` + `cpf`? Isso muda o tamanho da fase.
- **D2 — E-mail**: SMTP próprio (recomendado) ou Firebase?
- **D3 — Catálogo público**: leitura de livros sem login é realmente aberta, ou o portal
  exige login desde a home?
- **D4 — Cadastro**: autocadastro de cliente é liberado, ou cliente só é criado por
  funcionário no back-office (autocadastro só depois)?
- **D5 — Funcionário**: `Employee` tem login próprio criado só por ADMIN, certo?
- **D6 — Prefixo de rotas**: `/adm` (como no `SCHEMA_MAPPING.md`) e páginas do portal em
  português (`/meus-emprestimos`), mantendo o back-office em inglês — confirma?
