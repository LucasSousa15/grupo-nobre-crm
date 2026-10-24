# Nobre CRM - Frontend

Frontend do CRM B2B da Nobre Brindes, construído com Next.js, TypeScript, Tailwind CSS, Axios, TanStack Query e Zod.

## Estrutura

- `src/app`: rotas e proxy para a API no App Router;
- `src/components`: componentes reutilizáveis de apresentação;
- `src/hooks`: tipos e hooks de acesso a dados por domínio;
- `src/http`: cliente HTTP;
- `src/layouts`: layout compartilhado da aplicação;
- `src/routes`: caminhos da navegação;
- `src/schemas`: validação de contratos HTTP;
- `src/sections`: recursos orientados por domínio, como o Kanban de oportunidades.

## Executar localmente

1. Inicie o backend em `server/` na porta `3000`.
2. Copie `.env.example` para `.env.local` se a API estiver em outro endereço.
3. Execute `npm run dev`.
4. Acesse `http://localhost:3001` caso a porta `3000` já esteja ocupada pelo backend.

O frontend usa `/api/crm/*` como proxy no Next, evitando dependência de CORS durante o desenvolvimento local.
