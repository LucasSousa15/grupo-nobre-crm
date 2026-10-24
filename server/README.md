# Grupo Nobre CRM - API

Backend do case técnico, iniciado com NestJS, PostgreSQL e Prisma.

## Arquitetura

Cada módulo é organizado em `domain`, `application` e `infra`:

- `domain`: entidades, enums e contratos de repositório, sem Nest ou Prisma;
- `application`: casos de uso e erros de negócio;
- `infra`: adaptadores HTTP e persistência Prisma;
- `core`: composição, configuração, banco e tratamento transversal de erros.

O primeiro fluxo entregue é a alteração de estágio de uma oportunidade, com histórico append-only e transação no banco.

## Executar

1. Dentro de `server/`, suba o PostgreSQL local:

   ```bash
   docker compose up -d database
   ```

2. Copie `.env.example` para `.env` dentro de `server/`. A URL de exemplo já aponta para o banco do Compose.
3. Execute `npm install`.
4. Execute `npm run db:generate` e `npm run db:migrate -- --name init`.
5. Execute `npm run db:seed` para carregar os dados do case.
6. Execute `npm run start:dev`.

Documentação Swagger: `http://localhost:3000/docs`.

Para encerrar o banco sem apagar os dados: `docker compose stop database`. Para remover também o volume local: `docker compose down -v`.

## Decisões iniciais

- `Company`, `Seller` e `Product` são entidades persistidas;
- `nextFollowUpAt` é persistido, pois representa um compromisso explícito do vendedor;
- atenção é inicialmente derivada na leitura, não armazenada;
- retornos permitidos: `FOLLOW_UP -> QUOTE_PRESENTATION` e `FORECAST -> FOLLOW_UP`;
- não há automação que mude estágio comercial.
