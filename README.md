# CRM Grupo Nobre

> Case técnico para a Nobre Brindes. Esta é uma primeira versão de um CRM interno para organizar oportunidades de brindes personalizados, conduzi-las pelo funil comercial e destacar negociações que exigem ação do vendedor.

## Aviso de escopo

Este projeto é um MVP desenvolvido para o processo seletivo. Ele foi estruturado como uma aplicação funcional e testável, mas não representa uma implantação de produção: não há autenticação real nem integração com provedores externos de e-mail ou SMS. As notificações são simuladas e registradas nos logs da API.

## Visão geral

A solução atende aos três eixos do case:

- **Produto e UX:** seleção inicial de vendedor, Kanban por etapa, pesquisa, filtros, paginação, indicadores de atenção, criação e consulta de oportunidades, histórico, contatos e edição de proposta conforme a etapa.
- **Engenharia:** API REST em Node.js com PostgreSQL, regras de negócio no domínio, transações para mudança de etapa e histórico append-only.
- **Automação e qualidade:** monitor diário de follow-up com lembretes idempotentes, escalonamento de atenção e aviso simulado por e-mail/SMS, coberto por testes críticos.

## Stack

| Camada | Tecnologias |
| --- | --- |
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS, TanStack Query, React Hook Form, Zod, Axios, React Toastify e Lucide |
| Backend | NestJS 11, TypeScript, Prisma 7 e class-validator |
| Banco de dados | PostgreSQL 16, executado localmente com Docker Compose |
| Documentação da API | Swagger em `/docs` |
| Qualidade | Vitest, Testing Library, Supertest, ESLint e Prettier |

## Estrutura do repositório

```text
gpNobre/
├── server/                 # API NestJS, Prisma, migrations e testes backend/E2E
├── ui/                     # Interface Next.js
└── README.md               # Documentação única do projeto
```

No backend, os módulos seguem uma separação inspirada em DDD e Clean Architecture:

- `domain`: entidades, regras, serviços de domínio, erros e contratos, sem dependência de Nest ou Prisma;
- `application`: casos de uso que coordenam o domínio;
- `infra`: controladores HTTP, DTOs e implementações Prisma;
- `core`: composição da aplicação, configuração, banco, segurança, observabilidade e tratamento transversal de erros;
- `services`: automações reutilizáveis, como monitoramento de follow-up e notificações simuladas.

## Pré-requisitos

- Node.js 22 ou superior;
- npm;
- Docker e Docker Compose.

### Ambiente Windows

Para executar o PostgreSQL local no Windows, é necessário ter o **Docker Desktop** instalado, em execução e configurado para usar o backend **WSL 2**. Também é necessário ter uma distribuição Linux instalada e atualizada no WSL. Após instalar ou alterar essa configuração, valide no terminal:

```powershell
wsl --status
docker compose version
```

Com a integração WSL 2 ativa no Docker Desktop, os comandos `docker compose` descritos neste README funcionam normalmente no PowerShell, Git Bash ou em um terminal WSL.

## Como executar localmente

### 1. Banco de desenvolvimento e API

Em um terminal, entre no backend, crie o arquivo de ambiente e suba o PostgreSQL:

```bash
cd server
Copy-Item .env.example .env
docker compose up -d database
```

No macOS ou Linux, substitua o comando de cópia por `cp .env.example .env`.

Instale as dependências, gere o cliente Prisma, aplique as migrations já versionadas e carregue a base fictícia do case:

```bash
npm install
npm run db:generate
npx prisma migrate deploy
npm run db:seed
```

Inicie a API:

```bash
npm run start:dev
```

A API estará disponível em `http://localhost:8000` e o Swagger em `http://localhost:8000/docs`.

> Para criar uma nova migration durante o desenvolvimento, use `npm run db:migrate -- --name nome_da_migration`. Para apenas aplicar as migrations existentes em uma base limpa, prefira `npx prisma migrate deploy`.

### 2. Frontend

Em outro terminal, configure e inicie a interface:

```bash
cd ui
Copy-Item .env.example .env.local
```

No arquivo `ui/.env.local`, confirme que a API aponta para a porta do backend:

```dotenv
CRM_API_URL=http://localhost:8000
```

Depois, execute:

```bash
npm install
npm run dev
```

Acesse `http://localhost:3000`. O frontend usa a rota interna `/api/crm/*` como proxy para a API, mantendo o navegador desacoplado do endereço do backend.

### Variáveis de ambiente relevantes

| Variável | Aplicação | Finalidade |
| --- | --- | --- |
| `PORT` | API | Porta HTTP da API (`8000` no ambiente local) |
| `DATABASE_URL` | API | Conexão com o PostgreSQL de desenvolvimento |
| `TEST_DATABASE_URL` | API | Conexão com o PostgreSQL isolado dos testes E2E |
| `CORS_ORIGIN` | API | Única origem liberada pelo CORS, sem caminho (`http://localhost:3000`) |
| `EVENT_DELIVERY_LEAD_DAYS` | API | Antecedência logística usada no cálculo do último dia comercial viável |
| `CRM_API_URL` | Frontend | Endereço da API usado pelo proxy Next.js (`http://localhost:8000`) |

Arquivos `.env` não são versionados. Os valores dos arquivos `.env.example` são apenas convenientes para desenvolvimento local.

## Carga inicial

`npm run db:seed`, dentro de `server/`, cria os dados fictícios fornecidos no case: empresas, contatos, vendedores, produtos e as oportunidades `OPP-2001` a `OPP-2007`. Campos vazios do enunciado foram preservados quando representam risco comercial, como proposta ausente ou vencida.

Os preços unitários dos produtos do seed foram definidos para reproduzir os valores estimados apresentados no case. Na criação ou edição de uma oportunidade, o backend recalcula o valor total a partir de `itens x preço unitário`; o frontend apenas o exibe para orientar o vendedor.

## Regras de negócio do funil

As regras abaixo são validadas no backend. A interface recebe as opções possíveis como apoio à operação, mas não é a fonte de verdade.

| Etapa atual | Próximos estados permitidos | Racional |
| --- | --- | --- |
| Primeiro Contato | Apresentação de Orçamento, Perdida | Um contato inicial pode gerar proposta ou ser encerrado por perda. |
| Apresentação de Orçamento | Follow-up, Perdida | Após a proposta, o vendedor passa a acompanhar o retorno. |
| Follow-up | Apresentação de Orçamento, Forecast, Perdida | O cliente pode pedir revisão da proposta; se houver intenção concreta, a negociação segue para forecast. |
| Forecast | Follow-up, Fechamento, Perdida | Uma previsão pode exigir novo retorno; o fechamento só é permitido a partir de forecast. |
| Fechamento | Nenhum | Estado final. |
| Perdida | Nenhum | Estado final. |

Além da ordem do funil:

- a entrada em **Apresentação de Orçamento** exige valor estimado, ao menos um item e validade de proposta até, no mínimo, a véspera do evento;
- uma oportunidade pode ser marcada como **Perdida** de qualquer etapa não final, mas exige motivo;
- a data do evento é obrigatória para novas oportunidades e alterações; não pode estar no passado;
- a validade da proposta e o evento são tratados como datas civis, evitando deslocamento por fuso horário;
- propostas e empresa só podem ser alteradas nas etapas em que isso faz sentido comercial; a tela explica os bloqueios;
- os códigos de oportunidade são globais e seguem o padrão `OPP-1234`;
- todo movimento de etapa grava, na mesma transação, origem, destino e data em um histórico append-only;
- uma oportunidade só pode ser excluída enquanto estiver em **Primeiro Contato**.

## Automação escolhida: organização de follow-up

Foi implementado o problema 4 do case: evitar que o vendedor esqueça de dar retorno a um lead.

`FollowUpMonitorService`, em `server/src/services/follow-up-monitor`, executa diariamente às 8h no fuso `America/Sao_Paulo`. Ele aplica uma política de domínio para criar lembretes idempotentes para:

- follow-up vencido;
- ausência de próximo follow-up após três dias sem contato;
- follow-up previsto para as próximas 24 horas;
- proposta vencida ou próxima do vencimento;
- evento próximo do corte comercial/logístico.

O status de atenção é calculado na leitura e exibido no Kanban:

- `NORMAL`: sem ação urgente;
- `DUE_SOON`: follow-up nas próximas 24 horas;
- `OVERDUE`: um lembrete de follow-up vencido desde o último contato;
- `CRITICAL`: dois ou mais lembretes vencidos desde o último contato.

`EVENT_DELIVERY_LEAD_DAYS` define a antecedência logística. O monitor alerta durante os sete dias que precedem o último dia comercial viável e, no dia seguinte a esse corte, encerra automaticamente oportunidades abertas como **Perdida**, registrando o motivo e o histórico. Para cada lembrete, `SellerNotificationService` simula e registra no log um e-mail e um SMS para o vendedor responsável; nenhum contato externo é realizado.

### Alternativas para os outros problemas do case

As alternativas abaixo foram documentadas, mas não implementadas como automação nesta primeira versão:

1. **SLA de primeiro contato:** persistir `leadReceivedAt` e `firstContactAt`, calcular o SLA e publicar jobs para alertar ou redistribuir o lead antes do vencimento.
2. **Conhecimento sobre a empresa:** criar um adaptador assíncrono de enriquecimento no cadastro, guardando fontes, data de consulta e um resumo revisável pelo vendedor.
3. **Roteiro de ligação:** persistir uma ficha de descoberta vinculada à oportunidade, com segmento, objetivo do evento, público, quantidade, orçamento e observações, em um formulário acessível após a ligação.

## Interface e experiência de uso

O fluxo começa com a seleção de um vendedor e mostra somente sua carteira. A visualização principal é um Kanban com uma coluna por etapa, cards arrastáveis e ações de consulta. Para localizar uma negociação, a interface oferece:

- pesquisa por empresa ou código da oportunidade;
- filtro de atenção e cards-resumo interativos;
- paginação e indicação clara de carregamento, erro e ausência de resultados;
- cores e badges para oportunidades que exigem atenção;
- detalhes de contato do cliente para agilizar ligação ou e-mail;
- edição de proposta, registro de contato e agendamento de próximo follow-up;
- timeline de mudanças de etapa e painel de lembretes;
- mensagens de sucesso e falha com React Toastify.

## Testes e verificações

### Backend

```bash
cd server
npm run lint
npm test
npm run build
```

Os testes unitários cobrem regras de domínio, transições, políticas de lembrete, cálculo de atenção e cenários críticos da automação.

### Testes E2E

Os testes E2E usam um PostgreSQL separado na porta `5433`; eles nunca acessam o banco de desenvolvimento.

```bash
cd server
npm run db:test:up
npm run db:test:migrate
npm run test:e2e
```

Após a execução, remova o banco de testes e seu volume com:

```bash
npm run db:test:down
```

### Frontend

```bash
cd ui
npm run lint
npm test
npm run build
```

Os testes de interface validam, entre outros cenários, criação de oportunidade, Kanban, detalhes, atualização de contato e interação com lembretes.

## Segurança e operação

- Credenciais permanecem em variáveis de ambiente e não são incluídas no repositório.
- O CORS exige uma única origem válida definida por `CORS_ORIGIN`; a API não inicia sem ela.
- A API inclui ID de correlação por requisição, cabeçalhos de segurança básicos, rate limit local configurável, healthcheck em `/health` e métricas agregadas em `/metrics`.
- Em produção, a evolução esperada é OIDC/OAuth, RBAC por vendedor e gestor, TLS, gestão de segredos, auditoria, menor privilégio no banco e rate limiting na borda.

## Limitações e próximos passos

- E-mail e SMS são apenas simulações. Uma integração real deve usar adaptadores de provedores, fila, retentativas idempotentes e observabilidade de entrega.
- O cron roda no processo da API. Com múltiplas réplicas, deve migrar para um worker único ou ser protegido por lock distribuído.
- A antecedência logística é global. Uma evolução pode considerar produto, região, capacidade de produção e prazo de entrega.
- Autenticação e autorização completas estão fora do escopo do case.

## Uso de IA

IA foi utilizada pontualmente para acelerar a geração de código e a documentação das etapas. As decisões de produto e regras de negócio, além da revisão da implementação e da validação por build e testes, foram conferidas manualmente.

## Versionamento

O desenvolvimento foi organizado em commits semânticos e atômicos, separando mudanças de implementação, migrations, testes e documentação sempre que aplicável.
