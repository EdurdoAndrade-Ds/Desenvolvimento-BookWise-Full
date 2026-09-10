# BookWise — guia de commits

O projeto nao e versionado hoje. Quando quiser inicializar o historico, use
`git init` e faca `git add` seletivo por etapa, seguindo a sequencia abaixo.
Os titulos usam o formato [Conventional Commits](https://www.conventionalcommits.org/),
o que facilita a leitura do historico e a geracao de changelogs.

Os comandos abaixo devem ser executados na raiz do projeto. Antes de cada
commit, confira o resultado de `git status` para confirmar que somente a etapa
correspondente sera versionada.

Nota: os exemplos de comandos abaixo estão escritos para Bash / Git Bash (usa
quebras de linha com `\`). Se você estiver em PowerShell adapte as quebras de
linha conforme necessário.

Um detalhe importante na primeira importacao: `git add -p` so funciona em
arquivo ja rastreado. Como no `git init` todos os arquivos sao novos, nas
etapas 12, 13 e 17 adicione o arquivo inteiro (`git add <arquivo>`) na primeira
passagem; o `git add -p` indicado nessas etapas serve para as alteracoes
seguintes, quando o arquivo ja estiver no historico.

## 1. `chore: estrutura do monorepo e gitignore`

### O que entra

- `.gitignore`
- `backend/.gitignore`
- `frontend/.gitignore`

### Comandos

```bash
git add .gitignore \
  backend/.gitignore \
  frontend/.gitignore
git commit -m "chore: estrutura do monorepo e gitignore"
```

## 2. `docs: contrato OpenAPI e documentacao do projeto`

### O que entra

- `contracts/`
- `README.md`
- `docs/HANDOFF.md`
- `docs/SCHEMA_MAPPING.md`
- `docs/PLANO_FASE2.md`
- `docs/PLANO_PORTAL_FRONT.md`
- `docs/PENDENCIAS.md`
- `docs/COMMITS.md`

### Comandos

```bash
git add contracts/ \
  README.md \
  docs/HANDOFF.md \
  docs/SCHEMA_MAPPING.md \
  docs/PLANO_FASE2.md \
  docs/PLANO_PORTAL_FRONT.md \
  docs/PENDENCIAS.md \
  docs/COMMITS.md
git commit -m "docs: contrato OpenAPI e documentacao do projeto"
```

## 3. `feat(backend): dominio e camada de aplicacao`

### O que entra

- `backend/pom.xml`
- `backend/src/main/java/com/bookwise/domain/`
- `backend/src/main/java/com/bookwise/application/`

### Comandos

```bash
git add backend/pom.xml \
  backend/src/main/java/com/bookwise/domain/ \
  backend/src/main/java/com/bookwise/application/
git commit -m "feat(backend): dominio e camada de aplicacao"
```

## 4. `feat(backend): persistencia JPA e migrations Flyway`

### O que entra

- `backend/src/main/java/com/bookwise/infrastructure/persistence/`
- `backend/src/main/resources/db/`

### Comandos

```bash
git add backend/src/main/java/com/bookwise/infrastructure/persistence/ \
  backend/src/main/resources/db/
git commit -m "feat(backend): persistencia JPA e migrations Flyway"
```

## 5. `feat(backend): API REST e OpenAPI`

### O que entra

- `backend/src/main/java/com/bookwise/infrastructure/web/`
- `backend/src/main/java/com/bookwise/config/OpenApiConfig.java`

### Comandos

```bash
git add backend/src/main/java/com/bookwise/infrastructure/web/ \
  backend/src/main/java/com/bookwise/config/OpenApiConfig.java
git commit -m "feat(backend): API REST e OpenAPI"
```

## 6. `feat(backend): perfil local com H2 e dados de exemplo`

### O que entra

- `backend/src/main/resources/application.yml`
- `backend/src/main/resources/application-local.yml`
- `backend/src/main/resources/application-docker.yml`
- `backend/src/main/java/com/bookwise/infrastructure/config/DataSeeder.java`
- `backend/src/main/resources/db/local-schema-alignment.sql`

### Comandos

```bash
git add backend/src/main/resources/application.yml \
  backend/src/main/resources/application-local.yml \
  backend/src/main/resources/application-docker.yml \
  backend/src/main/java/com/bookwise/infrastructure/config/DataSeeder.java \
  backend/src/main/resources/db/local-schema-alignment.sql
git commit -m "feat(backend): perfil local com H2 e dados de exemplo"
```

## 7. `test(backend): testes de dominio, servico e contrato`

### O que entra

- `backend/src/test/`

### Comandos

```bash
git add backend/src/test/
git commit -m "test(backend): testes de dominio, servico e contrato"
```

## 8. `feat(frontend): base React, Vite, Tailwind e roteamento`

### O que entra

- `frontend/index.html`
- `frontend/package.json`
- `frontend/package-lock.json`
- `frontend/postcss.config.js`
- `frontend/tailwind.config.js`
- `frontend/tsconfig.json`
- `frontend/tsconfig.node.json`
- `frontend/vite.config.ts`
- `frontend/src/main.tsx`
- `frontend/src/App.tsx`
- `frontend/src/index.css`
- `frontend/src/layout/`
- `frontend/src/services/http.ts`

### Comandos

```bash
git add frontend/index.html \
  frontend/package.json \
  frontend/package-lock.json \
  frontend/postcss.config.js \
  frontend/tailwind.config.js \
  frontend/tsconfig.json \
  frontend/tsconfig.node.json \
  frontend/vite.config.ts \
  frontend/src/main.tsx \
  frontend/src/App.tsx \
  frontend/src/index.css \
  frontend/src/layout/ \
  frontend/src/services/http.ts
git commit -m "feat(frontend): base React, Vite, Tailwind e roteamento"
```

## 9. `feat(frontend): portal do cliente`

### O que entra

- `frontend/src/pages/customer/CatalogPage.tsx`
- `frontend/src/pages/customer/BookDetailPage.tsx`
- `frontend/src/components/BookCard.tsx`

### Comandos

```bash
git add frontend/src/pages/customer/CatalogPage.tsx \
  frontend/src/pages/customer/BookDetailPage.tsx \
  frontend/src/components/BookCard.tsx
git commit -m "feat(frontend): portal do cliente"
```

## 10. `feat(frontend): back-office`

### O que entra

- `frontend/src/pages/BooksPage.tsx`
- `frontend/src/pages/CategoriesPage.tsx`
- `frontend/src/pages/DashboardPage.tsx`
- `frontend/src/pages/FinesPage.tsx`
- `frontend/src/pages/LoansPage.tsx`
- `frontend/src/pages/ReservationsPage.tsx`
- `frontend/src/pages/SalesPage.tsx`
- `frontend/src/pages/SettingsPage.tsx`
- `frontend/src/pages/UsersPage.tsx`
- `frontend/src/components/BookFormModal.tsx`
- `frontend/src/components/CategoryFormModal.tsx`
- `frontend/src/components/LoanFormModal.tsx`
- `frontend/src/components/ReservationFormModal.tsx`
- `frontend/src/components/SaleFormModal.tsx`
- `frontend/src/components/UserFormModal.tsx`
- `frontend/src/components/DatabaseSchemaTab.tsx`
- `frontend/src/components/StatCard.tsx`

### Comandos

```bash
git add frontend/src/pages/BooksPage.tsx \
  frontend/src/pages/CategoriesPage.tsx \
  frontend/src/pages/DashboardPage.tsx \
  frontend/src/pages/FinesPage.tsx \
  frontend/src/pages/LoansPage.tsx \
  frontend/src/pages/ReservationsPage.tsx \
  frontend/src/pages/SalesPage.tsx \
  frontend/src/pages/SettingsPage.tsx \
  frontend/src/pages/UsersPage.tsx \
  frontend/src/components/BookFormModal.tsx \
  frontend/src/components/CategoryFormModal.tsx \
  frontend/src/components/LoanFormModal.tsx \
  frontend/src/components/ReservationFormModal.tsx \
  frontend/src/components/SaleFormModal.tsx \
  frontend/src/components/UserFormModal.tsx \
  frontend/src/components/DatabaseSchemaTab.tsx \
  frontend/src/components/StatCard.tsx
git commit -m "feat(frontend): back-office"
```

## 11. `feat(cg): modulos graficos puros`

### O que entra

- `frontend/src/graphics/imageFilters.ts`
- `frontend/src/graphics/kernels.ts`
- `frontend/src/graphics/procedural.ts`
- `frontend/src/graphics/spineTexture.ts`
- `frontend/src/graphics/shelfLayout.ts`

### Comandos

```bash
git add frontend/src/graphics/imageFilters.ts \
  frontend/src/graphics/kernels.ts \
  frontend/src/graphics/procedural.ts \
  frontend/src/graphics/spineTexture.ts \
  frontend/src/graphics/shelfLayout.ts
git commit -m "feat(cg): modulos graficos puros"
```

## 12. `feat(cg): estante 3D em WebGL`

### O que entra

- `frontend/src/components/graphics/Bookshelf3D.tsx`
- `frontend/src/components/graphics/Book3D.tsx`
- `frontend/src/pages/customer/Shelf3DPage.tsx`
- a rota correspondente em `frontend/src/App.tsx`
- o link correspondente em `frontend/src/layout/CustomerHeader.tsx`

Como `App.tsx` e `CustomerHeader.tsx` tambem recebem mudancas em etapas
posteriores, use `git add -p` se quiser separar precisamente os hunks.

### Comandos

```bash
git add frontend/src/components/graphics/Bookshelf3D.tsx \
  frontend/src/components/graphics/Book3D.tsx \
  frontend/src/pages/customer/Shelf3DPage.tsx
git add -p frontend/src/App.tsx \
  frontend/src/layout/CustomerHeader.tsx
git commit -m "feat(cg): estante 3D em WebGL"
```

## 13. `feat(cg): seletor de dimensao 1D, 2D e 3D`

### O que entra

- `frontend/src/components/graphics/ShelfRaster.tsx`
- o ajuste correspondente em `frontend/src/pages/customer/Shelf3DPage.tsx`

### Comandos

```bash
git add frontend/src/components/graphics/ShelfRaster.tsx
git add -p frontend/src/pages/customer/Shelf3DPage.tsx
git commit -m "feat(cg): seletor de dimensao 1D, 2D e 3D"
```

## 14. `feat(cg): cover studio com filtros e histograma`

### O que entra

- `frontend/src/pages/customer/CoverStudioPage.tsx`
- `frontend/src/components/graphics/HistogramChart.tsx`

### Comandos

```bash
git add frontend/src/pages/customer/CoverStudioPage.tsx \
  frontend/src/components/graphics/HistogramChart.tsx
git commit -m "feat(cg): cover studio com filtros e histograma"
```

## 15. `fix(backend): warnings de JPA (open-in-view e collection fetch)`

### O que entra

- `backend/src/main/resources/application.yml`
- `backend/src/main/resources/application-local.yml`
- `backend/src/main/resources/application-docker.yml`
- `backend/src/test/resources/application-test.yml`
- `backend/src/main/java/com/bookwise/infrastructure/persistence/BookRepositoryAdapter.java`
- `backend/src/main/java/com/bookwise/infrastructure/persistence/LoanRepositoryAdapter.java`
- `backend/src/main/java/com/bookwise/infrastructure/persistence/SaleRepositoryAdapter.java`
- `backend/src/main/java/com/bookwise/infrastructure/persistence/repository/BookJpaRepository.java`
- `backend/src/main/java/com/bookwise/infrastructure/persistence/repository/LoanJpaRepository.java`
- `backend/src/main/java/com/bookwise/infrastructure/persistence/repository/SaleJpaRepository.java`

### Comandos

```bash
git add backend/src/main/resources/application.yml \
  backend/src/main/resources/application-local.yml \
  backend/src/main/resources/application-docker.yml \
  backend/src/test/resources/application-test.yml \
  backend/src/main/java/com/bookwise/infrastructure/persistence/BookRepositoryAdapter.java \
  backend/src/main/java/com/bookwise/infrastructure/persistence/LoanRepositoryAdapter.java \
  backend/src/main/java/com/bookwise/infrastructure/persistence/SaleRepositoryAdapter.java \
  backend/src/main/java/com/bookwise/infrastructure/persistence/repository/BookJpaRepository.java \
  backend/src/main/java/com/bookwise/infrastructure/persistence/repository/LoanJpaRepository.java \
  backend/src/main/java/com/bookwise/infrastructure/persistence/repository/SaleJpaRepository.java
git commit -m "fix(backend): warnings de JPA (open-in-view e collection fetch)"
```

## 16. `feat(infra): execucao em container com Postgres`

### O que entra

- `docker-compose.yml`
- `backend/Dockerfile`

### Comandos

```bash
git add docker-compose.yml \
  backend/Dockerfile
git commit -m "feat(infra): execucao em container com Postgres"
```

## 17. `feat(infra): imagem unica com frontend embutido e deploy no Render`

### O que entra

- `Dockerfile`
- `backend/src/main/java/com/bookwise/infrastructure/config/SpaForwardController.java`
- `backend/src/main/resources/application.yml`
- `render.yaml`
- `docs/DEPLOY.md`

### Comandos

```bash
git add Dockerfile \
  backend/src/main/java/com/bookwise/infrastructure/config/SpaForwardController.java \
  render.yaml docs/DEPLOY.md
git add -p backend/src/main/resources/application.yml
git commit -m "feat(infra): imagem unica com frontend embutido e deploy no Render"
```

## Observacoes finais

Os itens 15 e 17 tocam `backend/src/main/resources/application.yml`.
Por isso, quem commitar estritamente nessa ordem deve versionar a versao
inicial no commit 6 e usar `git add -p` para separar os hunks de cada ajuste
posterior.

Para inicializar o versionamento e criar o primeiro commit:

```bash
git init
git branch -M main
git add .gitignore \
  backend/.gitignore \
  frontend/.gitignore
git commit -m "chore: estrutura do monorepo e gitignore"
```

Confira `git status` entre os commits. Isso ajuda a identificar arquivos
alterados de etapas futuras, arquivos ainda nao adicionados e qualquer item
que tenha ficado fora do commit pretendido.
