# BookWise — pendências (auditoria 2026-08-21)

Estado verificado nesta máquina: `mvn clean test` = **BUILD SUCCESS, 38 testes, 0 falhas**;
`npm run build` (typecheck + Vite) = **OK**. Ou seja, nada está quebrado — as pendências
abaixo são escopo não feito, dívida técnica e inconsistências.

## 1. Funcional / produto

1. **Fase 2 (autenticação) — 0% implementada.** Não há `spring-boot-starter-security` nem
   biblioteca JWT no `pom.xml`; todos os `/api/v1/**` são abertos. As decisões D1–D6 do
   `docs/PLANO_FASE2.md` continuam abertas (split de pessoas, e-mail SMTP vs Firebase,
   catálogo público, autocadastro, login de funcionário, prefixos de rota).
2. **Split `Cliente` / `Usuario` / `Funcionario` não feito.** Hoje há `User` único com
   `role`; `Loan`/`Reservation`/`Fine`/`Sale` apontam para `users.id`. Sem isso não existe
   página de funcionários no back-office nem fidelidade ao MER oficial.
3. **Reserva não vira empréstimo.** `ReservationService` só cria/cancela; não converte em
   empréstimo, não bloqueia estoque e o `EXPIRED` é derivado na leitura (não há job/rotina
   que expire de fato).
4. **Regras de empréstimo incompletas.** Não há limite de itens/empréstimos por cliente,
   renovação, nem bloqueio de quem tem multa pendente. Prazo (14 dias) e multa (R$ 2,00/dia)
   estão hard-coded como constantes no `LoanService`, não configuráveis.
5. **Multa só nasce na devolução.** Empréstimo atrasado e ainda não devolvido não gera nem
   atualiza multa; o valor nunca é recalculado depois de criado.
6. **Front incompleto em edição.** PUT de livro/categoria existe no backend, mas o
   back-office não expõe toda a edição (ver `HANDOFF.md`, item 2 do roadmap).
7. **Discrepância DER × DDL** (`Livro.editora`/`preco` vs `genero`) segue pendente de
   confirmação com o grupo.

## 2. Técnico / engenharia

8. **Projeto não versionado.** Não existe `.git` no monorepo — sem histórico, sem PR, sem CI.
9. **`frontend/.npmrc` aponta para `http://artifactory.santanderbr.corp/...`**, o que viola a
   regra corporativa (obrigatório `https://$ARTIFACTORY_HOST/artifactory/api/npm/$NPM_REPO/`).
   Há ainda um `.pdftmp/.npmrc` residual com o mesmo problema.
10. **Zero testes no frontend.** Nenhum Vitest/Testing Library; o script `lint` é apenas
    `tsc --noEmit` — não há ESLint nem Prettier configurados.
11. **Backend testado só na borda.** Os 38 testes são de controller (MockMvc) + contrato
    OpenAPI. Não há teste de serviço para as regras de negócio (baixa/retorno de estoque,
    geração de multa, categoria pai de si mesma) nem teste de repositório/integração.
12. **Warnings do build ainda abertos:** `HHH90003004: firstResult/maxResults specified with
    collection fetch; applying in memory` (3 ocorrências — paginação feita em memória em
    Loans/Sales/Books) e `spring.jpa.open-in-view is enabled by default` (2 ocorrências).
13. **Infra parcial.** `docker-compose.yml` sobe apenas API + Postgres; o frontend não tem
    Dockerfile nem serviço no compose. Não há pipeline de CI/CD.
14. **Artefatos de build no diretório do projeto:** `frontend/vite.config.js`,
    `frontend/vite.config.d.ts`, `frontend/tsconfig.node.tsbuildinfo` e a pasta `.pdftmp`.
15. **README desatualizado.** Diz que o frontend é "em breve" e lista como "próximos passos"
    itens já concluídos (CRUDs, empréstimos, vendas).
16. **Divergência local × docker.** Perfil `local` usa H2 com `ddl-auto=create-drop` +
    `db/local-schema-alignment.sql` para recriar FKs, enquanto `docker` usa Postgres +
    Flyway `V1..V12`. O seed está duplicado (`DataSeeder` vs `V3`/`V5`), com risco de as
    duas versões divergirem.
