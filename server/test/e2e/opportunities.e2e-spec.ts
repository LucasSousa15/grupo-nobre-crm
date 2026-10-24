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
      prisma.company.create({ data: { companyName: 'Empresa E2E', contactName: 'Mariana E2E' } }),
      prisma.seller.create({ data: { name: 'Ana E2E', email: 'ana.e2e@nobrebrindes.local' } }),
      prisma.product.create({ data: { name: 'Caneca E2E' } }),
    ]);
    return { company, seller, product };
  }

  it('creates an opportunity with validated references and persists its item', async () => {
    const { company, seller, product } = await createReferences();

    const response = await request(app.getHttpServer())
      .post('/opportunities')
      .send({
        code: 'opp-e2e-001',
        companyId: company.id,
        sellerId: seller.id,
        estimatedValue: 4500,
        items: [{ productId: product.id, quantity: 300 }],
      })
      .expect(201);

    expect(response.body.opportunity).toMatchObject({ code: 'OPP-E2E-001', stage: 'FIRST_CONTACT' });
    const persisted = await prisma.opportunity.findUnique({ where: { id: response.body.opportunity.id }, include: { items: true } });
    expect(persisted?.items).toHaveLength(1);
    expect(persisted?.items[0]).toMatchObject({ productId: product.id, quantity: 300 });
  });

  it('moves an opportunity to quote presentation and appends its stage history in the test database', async () => {
    const { company, seller, product } = await createReferences();
    const created = await request(app.getHttpServer())
      .post('/opportunities')
      .send({ code: 'OPP-E2E-002', companyId: company.id, sellerId: seller.id, estimatedValue: 9800, items: [{ productId: product.id, quantity: 120 }] })
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
      data: { code: 'OPP-E2E-003', companyId: company.id, sellerId: seller.id },
    });

    const response = await request(app.getHttpServer())
      .patch(`/opportunities/${opportunity.id}/stage`)
      .send({ stage: 'CLOSED' })
      .expect(422);

    expect(response.body).toMatchObject({ code: 'INVALID_STAGE_TRANSITION' });
    expect(await prisma.stageHistory.count({ where: { opportunityId: opportunity.id } })).toBe(0);
  });
});
