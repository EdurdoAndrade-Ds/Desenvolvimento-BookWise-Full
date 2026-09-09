# BookWise — execucao e deploy

Este guia descreve como executar o BookWise localmente e como publicar a aplicacao
em um servico como o Render. O caminho recomendado para producao e uma imagem Docker
unica: ela compila o frontend, embute os arquivos estaticos no JAR do Spring Boot e
serve a API e o React pela mesma origem.

## 1. Pre-requisitos

Para desenvolvimento local:

- Java 17;
- Maven 3.9 ou superior;
- Node.js 20 ou superior e npm;
- Docker Engine 27 ou superior e Docker Compose, apenas para os modos que usam
  containers.

O frontend usa o registry definido em `frontend/.npmrc`. Em uma rede corporativa,
defina `ARTIFACTORY_HOST` e `NPM_REPO` no ambiente antes de executar `npm install`.
O valor esperado usa HTTPS:

```text
https://${ARTIFACTORY_HOST}/artifactory/api/npm/${NPM_REPO}/
```

Em um ambiente externo, o build da imagem usa por padrao o registry publico:

```text
https://registry.npmjs.org/
```

O `Dockerfile` recebe esse valor por `NPM_REGISTRY`; o `.npmrc` do repositorio nao
precisa ser editado. O build no Render usa o registry publico.

## 2. Execucao local — modo A: backend com H2

Este e o modo mais simples para desenvolvimento e demonstracao. O perfil `local`
usa H2 em memoria, cria o schema com Hibernate e carrega dados de exemplo pelo
`DataSeeder`. Nao exige Docker ou PostgreSQL.

Terminal 1:

```bash
cd backend
SPRING_PROFILES_ACTIVE=local mvn spring-boot:run
```

Terminal 2:

```bash
cd frontend
npm install
npm run dev
```

O backend fica em `http://localhost:8080` e o frontend em
`http://localhost:5173`. Durante o desenvolvimento, o proxy do Vite encaminha
`/api` para `http://localhost:8080`.

URLs uteis:

- Portal: http://localhost:5173/
- Estante 3D: http://localhost:5173/shelf-3d
- Cover Studio: http://localhost:5173/cover-studio
- Swagger UI: http://localhost:8080/swagger-ui.html
- Console H2: http://localhost:8080/h2-console
- Health: http://localhost:8080/actuator/health

No console H2, use a URL JDBC
`jdbc:h2:mem:bookwise;DB_CLOSE_DELAY=-1;MODE=PostgreSQL`, usuario `sa` e senha
vazia.

## 3. Execucao local — modo B: Docker Compose

Este modo executa PostgreSQL 16 e a API com o perfil `docker`. O PostgreSQL e
inicializado pelo Compose e as migrations Flyway `V1..V12` validam/criam o schema.

Na raiz do projeto:

```bash
docker compose up --build
```

A API fica em `http://localhost:8080` e o PostgreSQL em `localhost:5432`. O
Compose configura:

```text
SPRING_PROFILES_ACTIVE=docker
DB_URL=jdbc:postgresql://db:5432/bookwise
DB_USERNAME=bookwise
DB_PASSWORD=bookwise
```

Para apontar o frontend local para essa API, mantenha o PostgreSQL/servico `api`
rodando e execute, em outro terminal:

```bash
cd frontend
npm install
npm run dev
```

O proxy existente do Vite aponta para `http://localhost:8080`, que e justamente a
porta publicada pelo servico `api`. Assim, o frontend continua usando os caminhos
relativos `/api/...`.

Para encerrar os containers:

```bash
docker compose down
```

Use `docker compose down -v` somente quando quiser remover tambem o volume local
do PostgreSQL.

## 4. Execucao local — modo C: imagem unica

O `Dockerfile` na raiz possui tres estagios:

1. `node:20-alpine`: instala as dependencias e executa `npm run build`;
2. `maven:3.9-eclipse-temurin-17`: compila o backend com testes desativados e
   copia o `frontend/dist` para `backend/src/main/resources/static`;
3. `eclipse-temurin:17-jre-alpine`: executa somente o JAR final.

O lockfile atualmente pode conter URLs de tarballs do Artifactory corporativo. No
estagio Node, o Dockerfile normaliza essas URLs para o registry escolhido pelo
argumento `NPM_REGISTRY` dentro da propria camada da imagem, sem alterar arquivos
do repositorio.

Build usando npmjs:

```bash
docker build \
  --build-arg NPM_REGISTRY=https://registry.npmjs.org/ \
  -t bookwise:local \
  -f Dockerfile .
```

Execucao local com H2 e dados de exemplo:

```bash
docker run --rm \
  -p 8080:8080 \
  -e SPRING_PROFILES_ACTIVE=local \
  -e SERVER_PORT=8080 \
  bookwise:local
```

O frontend e a API compartilham a origem
`http://localhost:8080`. Portanto, estas URLs sao atendidas pelo mesmo processo:

- http://localhost:8080/
- http://localhost:8080/shelf-3d
- http://localhost:8080/cover-studio
- http://localhost:8080/api/v1/books?page=0&size=5

Em um ambiente que injeta `PORT`, como o Render, esse valor tem precedencia:
`server.port` usa `PORT`, depois `SERVER_PORT`, e por fim `8080`.

## 5. Deploy no Render

### 5.1. Usando Blueprint

O arquivo `render.yaml` cria um Web Service Docker e um PostgreSQL gerenciado.

1. Coloque a pasta do projeto em um repositorio ou conecte a origem de codigo
   aceita pelo Render.
2. No painel do Render, escolha **New > Blueprint** e selecione a origem.
3. Confirme a leitura de `render.yaml`.
4. Confirme a criacao do banco `bookwise-db` e do Web Service `bookwise`.
5. Quando o Render solicitar `DB_URL`, preencha a URL JDBC descrita abaixo.
6. Aguarde o build da imagem e verifique o health check
   `/actuator/health`.

O blueprint configura `SPRING_PROFILES_ACTIVE=docker` e obtem usuario e senha do
PostgreSQL gerenciado. `DB_URL` fica como `sync: false` porque a connection string
fornecida pelo Render usa o formato `postgres://`, enquanto o driver JDBC precisa
de `jdbc:postgresql://`.

### 5.2. Montando `DB_URL`

No banco PostgreSQL do Render, copie os valores de host, porta, database, usuario
e senha. Configure no Web Service:

```text
SPRING_PROFILES_ACTIVE=docker
DB_URL=jdbc:postgresql://HOST:PORT/DATABASE
DB_USERNAME=USUARIO
DB_PASSWORD=SENHA
```

Por exemplo, uma connection string conceitual:

```text
postgres://bookwise_user:senha@dpg-exemplo-a.oregon-postgres.render.com:5432/bookwise
```

vira:

```text
jdbc:postgresql://dpg-exemplo-a.oregon-postgres.render.com:5432/bookwise
```

Nao inclua `postgres://` em `DB_URL` e nao copie usuario/senha para dentro da URL
quando eles estiverem configurados separadamente. Se a senha tiver caracteres
especiais, mantenha-a no campo proprio `DB_PASSWORD` do Render.

O Render injeta `PORT` no processo. O Spring Boot respeita esse valor
automaticamente; nao e necessario criar uma segunda porta no servico.

### 5.3. Configuracao manual pelo Dashboard

Como alternativa ao Blueprint:

1. Crie um PostgreSQL em **New > PostgreSQL**.
2. Crie um Web Service em **New > Web Service** e escolha **Docker**.
3. Configure a raiz do projeto como contexto e `Dockerfile` como arquivo:
   `./Dockerfile`.
4. Escolha o plano desejado.
5. Adicione:
   - `SPRING_PROFILES_ACTIVE=docker`;
   - `DB_URL` com a URL JDBC;
   - `DB_USERNAME` com o usuario do banco;
   - `DB_PASSWORD` com a senha do banco.
6. Configure o health check como `/actuator/health`.
7. Inicie o deploy.

O build do Docker no Render usa o registry npm publico por padrao. Nao depende
do Artifactory corporativo nem das variaveis `ARTIFACTORY_HOST` e `NPM_REPO`.

No plano free, a instancia pode hibernar quando fica sem trafego e o primeiro
request depois disso pode sofrer cold start. O banco e os limites do plano
tambem devem ser avaliados antes de uso em producao; o servico pode nao ter
disponibilidade continua nesse plano.

## 6. Alternativa: static site e Web Service separados

Tambem seria possivel publicar o `frontend/dist` como Static Site e a API como
Web Service separado, mas essa nao e a arquitetura implementada aqui. O frontend
usa caminhos relativos `/api/...` e nao possui base URL configuravel; o backend
tambem nao possui configuracao de CORS.

Essa alternativa exigiria:

1. uma base URL de API configuravel no frontend por ambiente; e
2. CORS configurado no backend para a origem do Static Site.

Isso permanece como debito tecnico e esta relacionado a infraestrutura parcial
registrada em [`docs/PENDENCIAS.md`](PENDENCIAS.md). A imagem unica evita ambos os
requisitos ao manter frontend e API na mesma origem.

## 7. Troubleshooting

### Falha ao instalar dependencias npm

Em rede corporativa, verifique `ARTIFACTORY_HOST` e `NPM_REPO` e confirme que o
registry usa HTTPS. Em ambiente externo, nao edite `frontend/.npmrc`; use o
Dockerfile com o padrao npmjs:

```bash
docker build --build-arg NPM_REGISTRY=https://registry.npmjs.org/ -t bookwise:local .
```

Se o Artifactory estiver indisponivel, aguarde a rede corporativa ser
restabelecida em vez de trocar para um host HTTP ou alternativo.

### `DB_URL` rejeitada

Confirme que o valor comeca por `jdbc:postgresql://`, que o host e a porta sao
os do banco do Render e que o database existe. `postgres://` e a connection
string do Render, nao o formato aceito pelo datasource Spring.

### Porta ocupada ou incorreta

No local, libere a porta 8080 ou publique o container em outra porta mantendo a
porta interna:

```bash
docker run --rm -p 8081:8080 \
  -e SPRING_PROFILES_ACTIVE=local \
  bookwise:local
```

No Render, nao fixe `PORT`: o provedor injeta esse valor. O `server.port` do
projeto usa `PORT` antes de `SERVER_PORT`.

### Falha do Flyway ou `ddl-auto: validate`

O perfil `docker` exige PostgreSQL acessivel e um schema compativel com as
migrations. Verifique `DB_URL`, `DB_USERNAME` e `DB_PASSWORD`, remova um banco
local descartavel que tenha migrations incompletas e tente novamente. Nao use o
perfil `local` em producao esperando que ele execute Flyway: ele usa H2,
`create-drop` e `DataSeeder`.
