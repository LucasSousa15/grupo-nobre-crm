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

## Testes E2E

Os testes E2E usam um PostgreSQL separado, na porta `5433`, e nunca acessam o banco de desenvolvimento.

```bash
npm run db:test:up
npm run db:test:migrate
npm run test:e2e
```

Após os testes, remova o banco isolado e seu volume com `npm run db:test:down`.

## Automação de follow-up

`FollowUpMonitorService`, em `src/services/follow-up-monitor`, executa diariamente às 8h (America/Sao_Paulo). Ele cria lembretes idempotentes e nunca muda o estágio comercial.

No MVP, os lembretes são criados para: follow-up vencido, ausência de próximo follow-up após 3 dias sem contato, follow-up previsto para as próximas 24h, proposta vencida ou com vencimento em até 2 dias e evento do cliente nos próximos 7 dias.

Para cada lembrete criado, `SellerNotificationService`, em `src/services/seller-notifications`, simula um e-mail para o endereço do vendedor e um SMS para seu telefone. Não há integração externa: os envios são registrados no log da aplicação. O SMS é ignorado com um aviso quando o telefone não foi cadastrado.

## Decisões iniciais

- `Company`, `Seller` e `Product` são entidades persistidas;
- `nextFollowUpAt` é persistido, pois representa um compromisso explícito do vendedor;
- atenção é inicialmente derivada na leitura, não armazenada;
- retornos permitidos: `FOLLOW_UP -> QUOTE_PRESENTATION` e `FORECAST -> FOLLOW_UP`;
- não há automação que mude estágio comercial.
