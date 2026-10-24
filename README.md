# CRM Grupo Nobre

Case técnico para gestão de oportunidades de brindes para eventos. O repositório contém uma API NestJS/PostgreSQL em `server/` e um frontend Next.js em `ui/`.

## Pré-requisitos

- Node.js 22 ou superior;
- Docker Compose;
- npm.

## Execução local

1. Em `server/`, copie `.env.example` para `.env`, suba o banco com `docker compose up -d database` e execute `npm install`.
2. Ainda em `server/`, execute `npm run db:generate`, `npm run db:migrate -- --name init`, `npm run db:seed` e `npm run start:dev`.
3. Em `ui/`, copie `.env.example` para `.env.local`, execute `npm install` e `npm run dev`.

A API atende em `http://localhost:8000`, Swagger em `http://localhost:8000/docs` e a interface em `http://localhost:3000`.

## Testes

```bash
cd server
npm test
npm run build
npm run db:test:up
npm run db:test:migrate
npm run test:e2e

cd ../ui
npm run lint
npm run build
```

O banco E2E é independente e usa a porta `5433`. Aguarde o container `database-test` ficar saudável antes da migration.

## Decisões importantes

- O funil e seus pré-requisitos são validados no domínio do backend; a interface apenas recebe opções de transição e seus requisitos.
- O histórico de etapas é append-only e gravado na mesma transação da mudança de estágio.
- Datas de evento e validade de proposta são datas civis, exibidas sem conversão de fuso.
- `EVENT_DELIVERY_LEAD_DAYS` define o prazo de entrega assumido (14 dias por padrão). O cron alerta nos sete dias antes do corte e perde automaticamente a oportunidade no dia seguinte ao último dia viável. Esse valor deve ser homologado com Comercial e Operações antes de produção.
- CORS usa origem única configurada em ambiente. A API também possui correlação de requisição, logs seguros, métricas agregadas em `/metrics`, healthcheck em `/health`, cabeçalhos básicos e rate limit local configurável. TLS, gestão de segredos e menor privilégio no banco são responsabilidades da implantação.

Mais detalhes técnicos estão em [server/README.md](./server/README.md) e [ui/README.md](./ui/README.md).
