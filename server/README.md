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

1. Copie `.env.example` para `.env` e ajuste a conexão PostgreSQL.
2. Execute `npm install`.
3. Execute `npm run db:generate` e `npm run db:migrate`.
4. Execute `npm run start:dev`.

Documentação Swagger: `http://localhost:3000/docs`.

## Decisões iniciais

- `Company`, `Seller` e `Product` são entidades persistidas;
- `nextFollowUpAt` é persistido, pois representa um compromisso explícito do vendedor;
- atenção é inicialmente derivada na leitura, não armazenada;
- retornos permitidos: `FOLLOW_UP -> QUOTE_PRESENTATION` e `FORECAST -> FOLLOW_UP`;
- não há automação que mude estágio comercial.
