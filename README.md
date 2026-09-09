# BookWise

Sistema de gestao de bibliotecas e livrarias fisicas e digitais, com foco no controle de
**livros, categorias, emprestimos, reservas, vendas, multas e usuarios**.

Este repositorio e um **monorepo**:

```
bookwise/
├── backend/            # API REST (Java 17 + Spring Boot 3)
├── frontend/           # React 18 + TypeScript + Vite + Tailwind CSS
├── contracts/          # Contrato OpenAPI de referencia (design / source-of-truth)
│   └── openapi.yaml
├── docker-compose.yml  # Sobe API + PostgreSQL
└── README.md
```

## Contrato OpenAPI

O arquivo `contracts/openapi.yaml` e o **contrato de referencia** do projeto (design).
Trabalhamos em **code-first**: o time se baseia nesse contrato para implementar, e o
springdoc gera a doc viva a partir do codigo em `/v3/api-docs`.

O contrato e validado automaticamente a cada build pelo teste `OpenApiContractTest`
(usa `swagger-parser`), garantindo que continua sendo um OpenAPI 3.0.3 valido.

## Stack

### Backend

- Java 17 + Spring Boot 3.3
- Spring Web (REST) + Spring Data JPA (Hibernate)
- PostgreSQL 16 (Flyway para migrations)
- H2 para o perfil local
- Bean Validation, Lombok
- springdoc-openapi (Swagger UI)
- Arquitetura em camadas (Clean Architecture): `domain`, `application`, `infrastructure`

### Frontend

- React 18 + TypeScript
- Vite
- Tailwind CSS
- React Router + lucide-react
- three + @react-three/fiber + @react-three/drei (cena WebGL da estante 3D)

## Como rodar

Para instrucoes completas de execucao local e deploy no Render, consulte
[docs/DEPLOY.md](docs/DEPLOY.md).

### Opcao 1 — Backend local com H2 (sem Docker)

O perfil `local` e o padrao e usa H2 em memoria, cria o schema pelo Hibernate e carrega
dados de exemplo pelo `DataSeeder`.

```bash
# Backend
cd backend
mvn spring-boot:run

# Frontend (outro terminal)
cd frontend
npm install
npm run dev
```

- API: http://localhost:8080
- Frontend: http://localhost:5173
- Swagger UI: http://localhost:8080/swagger-ui.html

### Opcao 2 — API + PostgreSQL via Docker

Requer Docker Desktop instalado e em execucao.

```bash
docker compose up --build
```

- API: http://localhost:8080
- Swagger UI: http://localhost:8080/swagger-ui.html
- PostgreSQL: localhost:5432 (bookwise / bookwise)

O perfil `docker` usa PostgreSQL 16 e migrations Flyway.

## Computacao grafica

Duas telas do portal do cliente concentram os temas de computacao grafica, usando o
acervo real vindo da API:

- `/shelf-3d` — **Estante 3D** em WebGL: cada livro e uma malha (`boxGeometry`) com
  espessura, altura e cor derivadas dos dados do proprio livro, lombada texturizada em
  tempo de execucao via Canvas 2D, luz ambiente + direcional com mapa de sombras,
  camera orbital em projecao perspectiva ou ortografica, materiais PBR (rugosidade,
  metalicidade, wireframe) e selecao por raycasting que abre o detalhe do livro. Um
  seletor de dimensao mostra o mesmo layout em 1D (o acervo como sinal de varredura:
  cor amostrada c(x) e altura h(x)), 2D (elevacao frontal rasterizada em Canvas 2D com
  transformacao janela -> viewport e hit-testing por retangulo) e 3D (a cena WebGL).
- `/cover-studio` — **Cover Studio** de processamento de imagem: capa gerada
  proceduralmente (hash do titulo + ruido fractal) ou carregada de arquivo, com filtros
  implementados a mao sobre `ImageData` (escala de cinza, negativo, brilho/contraste,
  convolucao 3x3 — box blur, gaussiano, sharpen, emboss, laplaciano —, Sobel e
  equalizacao de histograma pela CDF) e histograma RGB/luminancia desenhado em Canvas.

Modulos puros (sem React) usados por elas: `src/graphics/imageFilters.ts`,
`src/graphics/kernels.ts`, `src/graphics/procedural.ts`, `src/graphics/shelfLayout.ts` e
`src/graphics/spineTexture.ts`.

## Endpoints uteis

| Recurso        | URL                                         |
|----------------|---------------------------------------------|
| Ping           | GET http://localhost:8080/api/v1/ping       |
| Relatorios     | GET http://localhost:8080/api/v1/reports/summary |
| Swagger UI     | http://localhost:8080/swagger-ui.html       |
| Contrato JSON  | http://localhost:8080/v3/api-docs           |
| Health         | http://localhost:8080/actuator/health       |

## Relatorios (SQL nativo)

As agregacoes do dashboard sao feitas no banco, com `@Query(nativeQuery = true)` em
`ReportJpaRepository` (JOIN, GROUP BY, ORDER BY, COUNT/COUNT DISTINCT, SUM, CASE WHEN,
COALESCE, EXTRACT, subconsultas correlacionadas e LIMIT):

| Endpoint | Conteudo |
|---|---|
| `GET /api/v1/reports/summary` | indicadores consolidados (acervo, emprestimos, atrasos, vendas do mes, multas, reservas) |
| `GET /api/v1/reports/top-books?limit=` | livros mais emprestados |
| `GET /api/v1/reports/loans-by-month?months=` | serie historica de emprestimos |
| `GET /api/v1/reports/top-borrowers?limit=` | usuarios com mais emprestimos e multas pendentes |
| `GET /api/v1/reports/low-stock?threshold=` | estoque critico com unidades emprestadas e reservas ativas |

Defaults configuraveis em `bookwise.report.*` (`low-stock-threshold`, `history-months`,
`ranking-size`).

## Pendencias

- [ ] Definir e implementar a Fase 2 de autenticacao (login, cadastro, recuperacao de
  senha e protecao por papel).
- [ ] Avaliar o split entre Cliente, Usuario e Funcionario, hoje representados por um
  unico `User`.
- [ ] Definir o fluxo de reserva: conversao para emprestimo, bloqueio de estoque e
  expiracao efetiva.
- [ ] Completar as regras de emprestimo: limites, renovacao e bloqueio por multa
  pendente; tornar prazo e multa configuraveis.
- [ ] Atualizar multas de emprestimos ainda em atraso, mesmo antes da devolucao.
- [ ] Completar a edicao de livros e categorias no back-office do frontend.
- [ ] Resolver a discrepancia entre DER e DDL (`Livro.editora`/`preco` versus
  `genero`) com o grupo.
- [ ] Inicializar o versionamento Git e configurar CI/CD.
- [ ] Adicionar testes automatizados no frontend.
- [ ] Definir a infraestrutura do frontend (Dockerfile e servico no compose).
- [ ] Reduzir a divergencia entre os seeds do perfil local (H2) e do perfil docker
  (PostgreSQL/Flyway).
