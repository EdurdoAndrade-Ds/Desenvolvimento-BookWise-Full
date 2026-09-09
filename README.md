# BookWise

![CI](https://github.com/EdurdoAndrade-Ds/Desenvolvimento-BookWise-Full/actions/workflows/ci.yml/badge.svg)

Sistema para gestão de bibliotecas e livrarias — monorepo com backend e frontend.

Principais pontos

- API REST em Java + Spring Boot
- Portal em React + TypeScript (Vite + Tailwind)
- Contrato OpenAPI em `contracts/openapi.yaml`

Estrutura do repositório

```
bookwise/
├── backend/            # API REST (Java 17 + Spring Boot)
├── frontend/           # React + TypeScript + Vite
├── contracts/          # Contrato OpenAPI (fonte de verdade)
├── docker-compose.yml  # Compose para API + Postgres
└── README.md
```

Recursos principais

- Gestão de livros, categorias, empréstimos, reservas, vendas e multas
- Portal cliente com visualizações 2D/3D (estante WebGL e Cover Studio)
- Contrato OpenAPI usado como fonte de verdade e validado em testes

Tecnologias

- Backend: Java 17, Spring Boot, Spring Data JPA, Flyway, PostgreSQL (H2 para local)
- Frontend: React, TypeScript, Vite, Tailwind, three.js / @react-three/fiber


Status de build

O repositório possui GitHub Actions que constroem e testam o backend e o frontend em cada push/PR. Consulte o badge acima ou a aba Actions no GitHub para histórico e logs.

Como executar (rápido)

1) Com Docker (recomendado)

```bash
docker compose up --build
```

Isso sobe a API e um banco PostgreSQL. A aplicação ficará em http://localhost:8080

2) Desenvolvimento local (backend + frontend separados)

```bash
# Backend
cd backend
mvn spring-boot:run

# Frontend (outro terminal)
cd frontend
npm install
npm run dev
```

Endpoints úteis

- Ping: GET http://localhost:8080/api/v1/ping
- Swagger UI: http://localhost:8080/swagger-ui.html
- OpenAPI JSON: http://localhost:8080/v3/api-docs

Documentação e contribuição

- Deploy e execução avançada: [docs/DEPLOY.md](docs/DEPLOY.md)
- Guia de commits e histórico sugerido: [docs/COMMITS.md](docs/COMMITS.md)

Pendências e próximas tarefas

- Veja a lista de pendências no diretório `docs/` (arquivo PENDENCIAS.md)

Licença

Sem licença definida — adicione um `LICENSE` se desejar abrir o projeto.

----

Se quiser, eu posso:

- abrir um PR com este README;
- criar um commit sugerido (`docs: melhorar README`);
- adaptar o conteúdo (ex.: adicionar instruções de CI, badges ou screenshots).

