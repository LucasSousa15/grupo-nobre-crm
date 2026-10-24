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

`CORS_ORIGIN` é obrigatória e deve conter uma única origem, sem caminho. Para o frontend local em Next.js, use `http://localhost:3001`.

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

`FollowUpMonitorService`, em `src/services/follow-up-monitor`, executa diariamente às 8h (America/Sao_Paulo). Ele cria lembretes idempotentes e, no dia posterior ao evento, encerra como `LOST` uma oportunidade ainda aberta.

No MVP, os lembretes são criados para: follow-up vencido, ausência de próximo follow-up após 3 dias sem contato, follow-up previsto para as próximas 24h e proposta vencida ou com vencimento em até 2 dias. Nos sete dias anteriores ao evento, o cron cria um lembrete de prazo comercial final por dia; a mesma execução não duplica o lembrete e a notificação informa a data real do evento. Se o evento terminar sem fechamento, a oportunidade é movida automaticamente para `LOST` com motivo registrado e histórico de estágio.

Toda oportunidade possui uma data de evento obrigatória, que representa o prazo comercial final. Ao avançar para apresentação de orçamento ou etapas posteriores, a proposta deve permanecer válida pelo menos até a véspera do evento.

O seed reproduz exatamente os dados fictícios do case, inclusive propostas históricas já vencidas ou anteriores ao evento. Esses registros representam riscos comerciais que devem aparecer no CRM; a regra de validade continua obrigatória para novos cadastros e alterações, que precisam regularizar a proposta antes de prosseguir.

Para cada lembrete criado, `SellerNotificationService`, em `src/services/seller-notifications`, simula um e-mail para o endereço do vendedor e um SMS para seu telefone. Não há integração externa: os envios são registrados no log da aplicação. O SMS é ignorado com um aviso quando o telefone não foi cadastrado.

Para um follow-up vencido, o monitor cria no máximo um lembrete por oportunidade a cada dia. Isso permite a escalada de atenção sem duplicar a mesma execução do cron. Quando o vendedor atualiza `lastContactAt`, um `nextFollowUpAt` anterior a esse contato é tratado como obsoleto.

As consultas de oportunidade retornam `attentionStatus`, calculado no domínio e sem persistência adicional: `DUE_SOON` para follow-up previsto nas próximas 24h, `OVERDUE` após um lembrete vencido e `CRITICAL` após dois ou mais lembretes vencidos desde o último contato. A listagem aceita o filtro opcional `attentionStatus`.

## Automação e qualidade do case

A automação funcional escolhida atende ao problema 4: evitar retornos esquecidos. A política no domínio decide quais lembretes criar; o cron apenas a executa diariamente, persiste de forma idempotente e aciona as simulações de e-mail e SMS. Os cenários críticos possuem testes unitários para janelas de prazo, recorrência diária do evento, idempotência e contexto da notificação.

Para os demais problemas da operação, a evolução proposta é:

- Atendimento rápido ao lead: registrar `leadReceivedAt` e `firstContactAt`, calcular o SLA e usar uma fila de jobs para alertar o vendedor ou redistribuir o lead antes de estourar o prazo.
- Conhecimento sobre a empresa: criar um adaptador de enriquecimento consultado de forma assíncrona no cadastro, armazenando fontes, data de consulta e um resumo revisável pelo vendedor.
- Roteiro de ligação: persistir uma ficha estruturada de descoberta vinculada à oportunidade (segmento, objetivo do evento, público, quantidade, orçamento e observações), exposta em um formulário após a ligação.

## Limitações do MVP

- E-mail e SMS são simulações registradas em log; uma integração real exigiria provedores, filas, retentativas e observabilidade de entrega.
- O cron é executado no processo da API. Em uma implantação com múltiplas réplicas, ele deve ser movido para um worker único ou coordenado por lock distribuído.
- A data do evento é o prazo comercial final, mas o sistema não calcula automaticamente prazos de produção ou transporte; estes serão necessários para derivar uma data de corte logística mais precisa.

## Segurança em produção

Autenticação completa não faz parte do MVP. Em produção, a API deve usar OIDC/OAuth com tokens ou cookies seguros, RBAC por perfil comercial, Helmet, rate limiting, TLS, auditoria e o princípio de menor privilégio no banco. Segredos permanecem fora do código e são fornecidos pelo ambiente. O CORS aceita somente a origem única definida em `CORS_ORIGIN`; a API não inicia se essa variável estiver ausente ou contiver URL com caminho.

## Uso de IA

IA foi usada para acelerar a geração de código e apoiar a documentação de cada etapa do desenvolvimento. As decisões de arquitetura e de negócio, assim como a revisão da implementação e a validação por build e testes, permaneceram sob responsabilidade humana.

## Decisões iniciais

- `Company`, `Seller` e `Product` são entidades persistidas;
- `nextFollowUpAt` é persistido, pois representa um compromisso explícito do vendedor;
- atenção é inicialmente derivada na leitura, não armazenada;
- retornos permitidos: `FOLLOW_UP -> QUOTE_PRESENTATION` e `FORECAST -> FOLLOW_UP`;
- o cron só muda estágio no pós-evento: oportunidades abertas passam para `LOST` no dia seguinte, com motivo padronizado e histórico transacional.
