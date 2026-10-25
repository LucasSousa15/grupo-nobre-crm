import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AppModule } from 'src/app.module';
import { PrismaService } from 'src/core/providers/database/models/prisma.service';
import { GlobalExceptionFilter } from 'src/core/shared/errors/global-exception.filter';

describe('Opportunities API (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    app.useGlobalFilters(new GlobalExceptionFilter());
    await app.init();
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await prisma.stageHistory.deleteMany();
    await prisma.opportunityItem.deleteMany();
    await prisma.opportunity.deleteMany();
    await prisma.company.deleteMany();
    await prisma.seller.deleteMany();
    await prisma.product.deleteMany();
  });

  afterAll(async () => {
    await app.close();
  });

  async function createReferences() {
    const [company, seller, product] = await Promise.all([
      prisma.company.create({ data: { code: 'EMPRESAE2E', companyName: 'Empresa E2E', contactName: 'Mariana E2E', contactEmail: 'mariana.e2e@nobrebrindes.local', contactPhone: '11999990000' } }),
      prisma.seller.create({ data: { name: 'Ana E2E', email: 'ana.e2e@nobrebrindes.local' } }),
      prisma.product.create({ data: { name: 'Caneca E2E', unitPrice: 15 } }),
    ]);
    return { company, seller, product };
  }

  it('creates an opportunity with validated references and persists its item', async () => {
    const { company, seller, product } = await createReferences();

    const response = await request(app.getHttpServer())
      .post('/opportunities')
      .send({
        companyId: company.id,
        sellerId: seller.id,
        estimatedValue: 4500,
        customerEventAt: '2026-11-30',
        items: [{ productId: product.id, quantity: 300 }],
      })
      .expect(201);

    expect(response.body.opportunity).toMatchObject({
      code: 'EMPRESAE2E001',
      stage: 'FIRST_CONTACT',
      company: { contactName: 'Mariana E2E', contactEmail: 'mariana.e2e@nobrebrindes.local', contactPhone: '11999990000' },
    });
    const persisted = await prisma.opportunity.findUnique({ where: { id: response.body.opportunity.id }, include: { items: true } });
    expect(persisted?.items).toHaveLength(1);
    expect(persisted?.items[0]).toMatchObject({ productId: product.id, quantity: 300 });
  });

  it('requires an event date for a new opportunity', async () => {
    const { company, seller } = await createReferences();

    await request(app.getHttpServer())
      .post('/opportunities')
      .send({ companyId: company.id, sellerId: seller.id })
      .expect(400);
  });

  it('rejects an event date in the past', async () => {
    const { company, seller } = await createReferences();

    const response = await request(app.getHttpServer())
      .post('/opportunities')
      .send({ companyId: company.id, sellerId: seller.id, customerEventAt: '2020-01-01' })
      .expect(422);

    expect(response.body).toMatchObject({ code: 'OPPORTUNITY_DATE_IN_PAST' });
  });

  it('schedules follow-up and lets the seller conclude an open reminder', async () => {
    const { company, seller } = await createReferences();
    const opportunity = await prisma.opportunity.create({ data: { code: 'EMPRESAE2E001', companyId: company.id, sellerId: seller.id, customerEventAt: new Date('2026-11-30T00:00:00.000Z') } });
    const reminder = await prisma.reminder.create({ data: { opportunityId: opportunity.id, type: 'FOLLOW_UP_DUE', dueAt: new Date(Date.now() + 86_400_000) } });

    await request(app.getHttpServer())
      .patch(`/opportunities/${opportunity.id}`)
      .send({ nextFollowUpAt: new Date(Date.now() + 172_800_000).toISOString() })
      .expect(200);
    await request(app.getHttpServer()).get(`/opportunities/${opportunity.id}/reminders`).expect(200)
      .expect(({ body }) => expect(body.reminders).toEqual(expect.arrayContaining([expect.objectContaining({ id: reminder.id, status: 'DISMISSED' })])));

    const pendingReminder = await prisma.reminder.create({ data: { opportunityId: opportunity.id, type: 'PROPOSAL_EXPIRING', dueAt: new Date(Date.now() + 259_200_000) } });
    await request(app.getHttpServer()).patch(`/opportunities/${opportunity.id}/reminders/${pendingReminder.id}/dismiss`).expect(204);
    expect((await prisma.reminder.findUnique({ where: { id: pendingReminder.id } }))?.status).toBe('DISMISSED');
  });

  it('moves an opportunity to quote presentation and appends its stage history in the test database', async () => {
    const { company, seller, product } = await createReferences();
    const created = await request(app.getHttpServer())
      .post('/opportunities')
      .send({ companyId: company.id, sellerId: seller.id, estimatedValue: 9800, customerEventAt: '2026-11-30', proposalValidUntil: '2026-11-29', items: [{ productId: product.id, quantity: 120 }] })
      .expect(201);

    await request(app.getHttpServer())
      .patch(`/opportunities/${created.body.opportunity.id}/stage`)
      .send({ stage: 'QUOTE_PRESENTATION' })
      .expect(204);

    const persisted = await prisma.opportunity.findUnique({
      where: { id: created.body.opportunity.id },
      include: { stageHistory: true },
    });
    expect(persisted?.stage).toBe('QUOTE_PRESENTATION');
    expect(persisted?.stageHistory).toHaveLength(1);
    expect(persisted?.stageHistory[0]).toMatchObject({ fromStage: 'FIRST_CONTACT', toStage: 'QUOTE_PRESENTATION' });
  });

  it('rejects an invalid direct transition to Closed without persisting history', async () => {
    const { company, seller } = await createReferences();
    const opportunity = await prisma.opportunity.create({
      data: { code: 'OPP-E2E-003', companyId: company.id, sellerId: seller.id, customerEventAt: new Date('2026-11-30T00:00:00.000Z') },
    });

    const response = await request(app.getHttpServer())
      .patch(`/opportunities/${opportunity.id}/stage`)
      .send({ stage: 'CLOSED' })
      .expect(422);

    expect(response.body).toMatchObject({ code: 'INVALID_STAGE_TRANSITION' });
    expect(await prisma.stageHistory.count({ where: { opportunityId: opportunity.id } })).toBe(0);
  });

  it('exposes and filters the attention status derived from overdue follow-up reminders', async () => {
    const { company, seller } = await createReferences();
    const opportunity = await prisma.opportunity.create({
      data: {
        code: 'OPP-E2E-004',
        companyId: company.id,
        sellerId: seller.id,
        stage: 'FOLLOW_UP',
        lastContactAt: new Date('2026-10-10T12:00:00.000Z'),
        customerEventAt: new Date('2026-11-30T00:00:00.000Z'),
      },
    });
    await prisma.reminder.createMany({
      data: [
        { opportunityId: opportunity.id, type: 'FOLLOW_UP_OVERDUE', dueAt: new Date('2026-10-13T00:00:00.000Z'), createdAt: new Date('2026-10-13T08:00:00.000Z') },
        { opportunityId: opportunity.id, type: 'FOLLOW_UP_OVERDUE', dueAt: new Date('2026-10-14T00:00:00.000Z'), createdAt: new Date('2026-10-14T08:00:00.000Z') },
      ],
    });

    const detail = await request(app.getHttpServer()).get(`/opportunities/${opportunity.id}`).expect(200);
    const list = await request(app.getHttpServer()).get('/opportunities?attentionStatus=CRITICAL').expect(200);

    expect(detail.body.opportunity.attentionStatus).toBe('CRITICAL');
    expect(list.body.opportunities).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: opportunity.id, attentionStatus: 'CRITICAL' }),
    ]));
  });
});
