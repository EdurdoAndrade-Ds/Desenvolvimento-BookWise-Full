# BookWise — guia de commits

O projeto nao e versionado hoje. Quando quiser inicializar o historico, use
`git init` e faca `git add` seletivo por etapa, seguindo a sequencia abaixo.
Os titulos usam o formato [Conventional Commits](https://www.conventionalcommits.org/),
o que facilita a leitura do historico e a geracao de changelogs.

No backend a sequencia foi quebrada **pasta por pasta**: cada subpasta de
`domain`, `application` e `infrastructure` entra num commit proprio, na ordem
das dependencias (dominio primeiro, depois aplicacao, depois infraestrutura).
Assim nenhum commit mistura duas camadas grandes de uma vez.

Os comandos abaixo devem ser executados na raiz do projeto. Antes de cada
commit, confira o resultado de `git status` para confirmar que somente a etapa
correspondente sera versionada.

Um detalhe importante na primeira importacao: `git add -p` so funciona em
arquivo ja rastreado. Como no `git init` todos os arquivos sao novos, nas
etapas 26, 27 e 31 adicione o arquivo inteiro (`git add <arquivo>`) na primeira
passagem; o `git add -p` indicado nessas etapas serve para as alteracoes
seguintes, quando o arquivo ja estiver no historico.

## 1. `chore: estrutura do monorepo e gitignore`

### O que entra

- `.gitignore`
- `backend/.gitignore`
- `frontend/.gitignore`

### Comandos

```bash
git add .gitignore backend/.gitignore frontend/.gitignore
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
git add contracts/ README.md docs/HANDOFF.md docs/SCHEMA_MAPPING.md \
  docs/PLANO_FASE2.md docs/PLANO_PORTAL_FRONT.md docs/PENDENCIAS.md \
  docs/COMMITS.md
git commit -m "docs: contrato OpenAPI e documentacao do projeto"
```

## 3. `chore(backend): build Maven e bootstrap da aplicacao`

### O que entra

- `backend/pom.xml`
- `backend/src/main/java/com/bookwise/BookwiseApplication.java`

### Comandos

```bash
git add backend/pom.xml \
  backend/src/main/java/com/bookwise/BookwiseApplication.java
git commit -m "chore(backend): build Maven e bootstrap da aplicacao"
```

## 4. `feat(backend): dominio - excecoes`

### O que entra

- `backend/src/main/java/com/bookwise/domain/exception/`

### Comandos

```bash
git add backend/src/main/java/com/bookwise/domain/exception/
git commit -m "feat(backend): dominio - excecoes"
```

## 5. `feat(backend): dominio - modelos`

### O que entra

- `backend/src/main/java/com/bookwise/domain/model/`

### Comandos

```bash
git add backend/src/main/java/com/bookwise/domain/model/
git commit -m "feat(backend): dominio - modelos"
```

## 6. `feat(backend): dominio - paginacao`

### O que entra

- `backend/src/main/java/com/bookwise/domain/page/`

### Comandos

```bash
git add backend/src/main/java/com/bookwise/domain/page/
git commit -m "feat(backend): dominio - paginacao"
```

## 7. `feat(backend): dominio - portas de repositorio`

### O que entra

- `backend/src/main/java/com/bookwise/domain/port/`
- `backend/src/main/java/com/bookwise/domain/package-info.java`

### Comandos

```bash
git add backend/src/main/java/com/bookwise/domain/port/ \
  backend/src/main/java/com/bookwise/domain/package-info.java
git commit -m "feat(backend): dominio - portas de repositorio"
```

## 8. `feat(backend): aplicacao - DTOs`

### O que entra

- `backend/src/main/java/com/bookwise/application/dto/`

### Comandos

```bash
git add backend/src/main/java/com/bookwise/application/dto/
git commit -m "feat(backend): aplicacao - DTOs"
```

## 9. `feat(backend): aplicacao - mappers`

### O que entra

- `backend/src/main/java/com/bookwise/application/mapper/`

### Comandos

```bash
git add backend/src/main/java/com/bookwise/application/mapper/
git commit -m "feat(backend): aplicacao - mappers"
```

## 10. `feat(backend): aplicacao - servicos`

### O que entra

- `backend/src/main/java/com/bookwise/application/service/`
- `backend/src/main/java/com/bookwise/application/package-info.java`

### Comandos

```bash
git add backend/src/main/java/com/bookwise/application/service/ \
  backend/src/main/java/com/bookwise/application/package-info.java
git commit -m "feat(backend): aplicacao - servicos"
```

## 11. `feat(backend): persistencia - entidades JPA`

### O que entra

- `backend/src/main/java/com/bookwise/infrastructure/persistence/entity/`

### Comandos

```bash
git add backend/src/main/java/com/bookwise/infrastructure/persistence/entity/
git commit -m "feat(backend): persistencia - entidades JPA"
```

## 12. `feat(backend): persistencia - repositorios Spring Data`

### O que entra

- `backend/src/main/java/com/bookwise/infrastructure/persistence/repository/`

### Comandos

```bash
git add backend/src/main/java/com/bookwise/infrastructure/persistence/repository/
git commit -m "feat(backend): persistencia - repositorios Spring Data"
```

## 13. `feat(backend): persistencia - adaptadores e mappers de entidade`

### O que entra

- adaptadores e mappers na raiz de `backend/src/main/java/com/bookwise/infrastructure/persistence/`
- `backend/src/main/java/com/bookwise/infrastructure/package-info.java`

Como as subpastas `entity/` e `repository/` ja foram versionadas nas etapas 11
e 12, adicionar a pasta `persistence/` inteira estaciona apenas os arquivos
novos da raiz (adaptadores e mappers de entidade).

### Comandos

```bash
git add backend/src/main/java/com/bookwise/infrastructure/persistence/ \
  backend/src/main/java/com/bookwise/infrastructure/package-info.java
git commit -m "feat(backend): persistencia - adaptadores e mappers de entidade"
```

## 14. `feat(backend): migrations Flyway`

### O que entra

- `backend/src/main/resources/db/migration/`

### Comandos

```bash
git add backend/src/main/resources/db/migration/
git commit -m "feat(backend): migrations Flyway"
```

## 15. `feat(backend): web - tratamento de erros`

### O que entra

- `backend/src/main/java/com/bookwise/infrastructure/web/error/`

### Comandos

```bash
git add backend/src/main/java/com/bookwise/infrastructure/web/error/
git commit -m "feat(backend): web - tratamento de erros"
```

## 16. `feat(backend): web - controllers REST`

### O que entra

- os controllers na raiz de `backend/src/main/java/com/bookwise/infrastructure/web/`

Como a subpasta `web/error/` ja foi versionada na etapa 15, adicionar a pasta
`web/` inteira estaciona apenas os controllers novos da raiz.

### Comandos

```bash
git add backend/src/main/java/com/bookwise/infrastructure/web/
git commit -m "feat(backend): web - controllers REST"
```

## 17. `feat(backend): configuracao OpenAPI`

### O que entra

- `backend/src/main/java/com/bookwise/config/OpenApiConfig.java`

### Comandos

```bash
git add backend/src/main/java/com/bookwise/config/OpenApiConfig.java
git commit -m "feat(backend): configuracao OpenAPI"
```

## 18. `feat(backend): perfis de execucao e seed local`

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
git commit -m "feat(backend): perfis de execucao e seed local"
```

## 19. `test(backend): servicos de aplicacao`

### O que entra

- `backend/src/test/java/com/bookwise/application/service/`

### Comandos

```bash
git add backend/src/test/java/com/bookwise/application/service/
git commit -m "test(backend): servicos de aplicacao"
```

## 20. `test(backend): controllers REST`

### O que entra

- `backend/src/test/java/com/bookwise/infrastructure/web/`

### Comandos

```bash
git add backend/src/test/java/com/bookwise/infrastructure/web/
git commit -m "test(backend): controllers REST"
```

## 21. `test(backend): contrato OpenAPI e smoke test`

### O que entra

- `backend/src/test/java/com/bookwise/contract/`
- `backend/src/test/java/com/bookwise/BookwiseApplicationTests.java`
- `backend/src/test/resources/`

### Comandos

```bash
git add backend/src/test/java/com/bookwise/contract/ \
  backend/src/test/java/com/bookwise/BookwiseApplicationTests.java \
  backend/src/test/resources/
git commit -m "test(backend): contrato OpenAPI e smoke test"
```

## 22. `feat(frontend): base React, Vite, Tailwind e roteamento`

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
git add frontend/index.html frontend/package.json frontend/package-lock.json \
  frontend/postcss.config.js frontend/tailwind.config.js \
  frontend/tsconfig.json frontend/tsconfig.node.json frontend/vite.config.ts \
  frontend/src/main.tsx frontend/src/App.tsx frontend/src/index.css \
  frontend/src/layout/ frontend/src/services/http.ts
git commit -m "feat(frontend): base React, Vite, Tailwind e roteamento"
```

## 23. `feat(frontend): portal do cliente`

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

## 24. `feat(frontend): back-office`

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
git add frontend/src/pages/BooksPage.tsx frontend/src/pages/CategoriesPage.tsx \
  frontend/src/pages/DashboardPage.tsx frontend/src/pages/FinesPage.tsx \
  frontend/src/pages/LoansPage.tsx frontend/src/pages/ReservationsPage.tsx \
  frontend/src/pages/SalesPage.tsx frontend/src/pages/SettingsPage.tsx \
  frontend/src/pages/UsersPage.tsx frontend/src/components/BookFormModal.tsx \
  frontend/src/components/CategoryFormModal.tsx \
  frontend/src/components/LoanFormModal.tsx \
  frontend/src/components/ReservationFormModal.tsx \
  frontend/src/components/SaleFormModal.tsx frontend/src/components/UserFormModal.tsx \
  frontend/src/components/DatabaseSchemaTab.tsx frontend/src/components/StatCard.tsx
git commit -m "feat(frontend): back-office"
```

## 25. `feat(cg): modulos graficos puros`

### O que entra

- `frontend/src/graphics/imageFilters.ts`
- `frontend/src/graphics/kernels.ts`
- `frontend/src/graphics/procedural.ts`
- `frontend/src/graphics/spineTexture.ts`
- `frontend/src/graphics/shelfLayout.ts`

### Comandos

```bash
git add frontend/src/graphics/imageFilters.ts frontend/src/graphics/kernels.ts \
  frontend/src/graphics/procedural.ts frontend/src/graphics/spineTexture.ts \
  frontend/src/graphics/shelfLayout.ts
git commit -m "feat(cg): modulos graficos puros"
```

## 26. `feat(cg): estante 3D em WebGL`

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
git add -p frontend/src/App.tsx frontend/src/layout/CustomerHeader.tsx
git commit -m "feat(cg): estante 3D em WebGL"
```

## 27. `feat(cg): seletor de dimensao 1D, 2D e 3D`

### O que entra

- `frontend/src/components/graphics/ShelfRaster.tsx`
- o ajuste correspondente em `frontend/src/pages/customer/Shelf3DPage.tsx`

### Comandos

```bash
git add frontend/src/components/graphics/ShelfRaster.tsx
git add -p frontend/src/pages/customer/Shelf3DPage.tsx
git commit -m "feat(cg): seletor de dimensao 1D, 2D e 3D"
```

## 28. `feat(cg): cover studio com filtros e histograma`

### O que entra

- `frontend/src/pages/customer/CoverStudioPage.tsx`
- `frontend/src/components/graphics/HistogramChart.tsx`

### Comandos

```bash
git add frontend/src/pages/customer/CoverStudioPage.tsx \
  frontend/src/components/graphics/HistogramChart.tsx
git commit -m "feat(cg): cover studio com filtros e histograma"
```

## 29. `fix(backend): warnings de JPA (open-in-view e collection fetch)`

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

## 30. `feat(infra): execucao em container com Postgres`

### O que entra

- `docker-compose.yml`
- `backend/Dockerfile`

### Comandos

```bash
git add docker-compose.yml backend/Dockerfile
git commit -m "feat(infra): execucao em container com Postgres"
```

## 31. `feat(infra): imagem unica com frontend embutido e deploy no Render`

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

## 32. `ci: build de PR no GitHub Actions e templates`

### O que entra

- `.github/workflows/ci.yml`
- `.github/PULL_REQUEST_TEMPLATE.md`
- `.github/ISSUE_TEMPLATE/bug_report.md`
- `.github/ISSUE_TEMPLATE/feature_request.md`
- `.dockerignore`

### Comandos

```bash
git add .github/ .dockerignore
git commit -m "ci: pipeline do GitHub Actions, dependabot e templates"
```

## Observacoes finais

No backend, `infrastructure/persistence/` e `infrastructure/web/` tem
subpastas. Por isso as subpastas entram primeiro (`persistence/entity/` e
`persistence/repository/` nas etapas 11 e 12; `web/error/` na etapa 15) e so
depois a pasta pai e adicionada por inteiro (etapas 13 e 16), estacionando
apenas os arquivos que sobraram na raiz. Seguindo essa ordem, cada `git add` de
pasta versiona exatamente uma subpasta por vez.

As etapas 18, 29 e 31 tocam `backend/src/main/resources/application.yml`.
Por isso, quem commitar estritamente nessa ordem deve versionar a versao
inicial na etapa 18 e usar `git add -p` para separar os hunks de cada ajuste
posterior.

Para inicializar o versionamento e criar o primeiro commit:

```bash
git init
git branch -M main
git add .gitignore backend/.gitignore frontend/.gitignore
git commit -m "chore: estrutura do monorepo e gitignore"
```

Confira `git status` entre os commits. Isso ajuda a identificar arquivos
alterados de etapas futuras, arquivos ainda nao adicionados e qualquer item
que tenha ficado fora do commit pretendido.
