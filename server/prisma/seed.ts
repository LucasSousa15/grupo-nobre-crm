import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { OpportunityStage, PrismaClient } from '@prisma/client';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

interface SeedOpportunity {
  code: string;
  company: string;
  contact: string;
  contactEmail: string;
  contactPhone: string;
  seller: string;
  product: string;
  quantity: number;
  estimatedValue: number;
  lastContactAt: string;
  proposalValidUntil?: string;
  customerEventAt: string;
  stage: OpportunityStage;
  lossReason?: string;
}

const opportunities: SeedOpportunity[] = [
  { code: 'OPP-2001', company: 'Tech Alpha Ltda', contact: 'Mariana Alves', contactEmail: 'mariana@techalpha.local', contactPhone: '11987650001', seller: 'Ana', product: 'Caneca personalizada', quantity: 300, estimatedValue: 4500, lastContactAt: '2026-10-14', customerEventAt: '2026-11-30', stage: OpportunityStage.FIRST_CONTACT },
  { code: 'OPP-2002', company: 'Construtora Horizonte', contact: 'Ricardo Nunes', contactEmail: 'ricardo@horizonte.local', contactPhone: '11987650002', seller: 'Bruno', product: 'Kit escritório', quantity: 120, estimatedValue: 9800, lastContactAt: '2026-10-06', proposalValidUntil: '2026-10-13', customerEventAt: '2026-10-25', stage: OpportunityStage.QUOTE_PRESENTATION },
  { code: 'OPP-2003', company: 'Clínica Vida', contact: 'Fernanda Lima', contactEmail: 'fernanda@clinicavida.local', contactPhone: '11987650003', seller: 'Ana', product: 'Squeeze personalizado', quantity: 500, estimatedValue: 7200, lastContactAt: '2026-10-13', proposalValidUntil: '2026-10-20', customerEventAt: '2026-10-18', stage: OpportunityStage.FOLLOW_UP },
  { code: 'OPP-2004', company: 'Agência Pulso', contact: 'Gabriel Souza', contactEmail: 'gabriel@agenciapulso.local', contactPhone: '11987650004', seller: 'Carla', product: 'Camiseta estampada', quantity: 80, estimatedValue: 3900, lastContactAt: '2026-10-02', proposalValidUntil: '2026-10-10', customerEventAt: '2026-11-05', stage: OpportunityStage.FOLLOW_UP },
  { code: 'OPP-2005', company: 'Banco Norte', contact: 'Paula Martins', contactEmail: 'paula@banconorte.local', contactPhone: '11987650005', seller: 'Bruno', product: 'Agenda executiva', quantity: 1000, estimatedValue: 38000, lastContactAt: '2026-10-15', proposalValidUntil: '2026-10-22', customerEventAt: '2026-12-12', stage: OpportunityStage.FORECAST },
  { code: 'OPP-2006', company: 'Escola Saber', contact: 'Larissa Costa', contactEmail: 'larissa@escolasaber.local', contactPhone: '11987650006', seller: 'Carla', product: 'Mochila infantil', quantity: 250, estimatedValue: 11500, lastContactAt: '2026-10-09', proposalValidUntil: '2026-10-16', customerEventAt: '2026-10-17', stage: OpportunityStage.CLOSED },
  { code: 'OPP-2007', company: 'Padaria do Bairro', contact: 'João Santos', contactEmail: 'joao@padariadobairro.local', contactPhone: '11987650007', seller: 'Ana', product: 'Caneta promocional', quantity: 50, estimatedValue: 350, lastContactAt: '2026-10-01', proposalValidUntil: '2026-10-08', customerEventAt: '2026-10-20', stage: OpportunityStage.LOST, lossReason: 'Cliente optou por outro fornecedor.' },
];

async function main(): Promise<void> {
  for (const data of opportunities) {
    const seller = await prisma.seller.upsert({
      where: { email: `${data.seller.toLowerCase()}@nobrebrindes.local` },
      update: { name: data.seller, active: true },
      create: { name: data.seller, email: `${data.seller.toLowerCase()}@nobrebrindes.local` },
    });
    const company = await prisma.company.upsert({
      where: { id: `seed-company-${data.code}` },
      update: { code: data.company.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toUpperCase(), companyName: data.company, contactName: data.contact, contactEmail: data.contactEmail, contactPhone: data.contactPhone },
      create: { id: `seed-company-${data.code}`, code: data.company.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toUpperCase(), companyName: data.company, contactName: data.contact, contactEmail: data.contactEmail, contactPhone: data.contactPhone },
    });
    const product = await prisma.product.upsert({
      where: { id: `seed-product-${data.code}` },
      update: { name: data.product, unitPrice: data.estimatedValue / data.quantity, active: true },
      create: { id: `seed-product-${data.code}`, name: data.product, unitPrice: data.estimatedValue / data.quantity },
    });

    await prisma.opportunity.upsert({
      where: { code: data.code },
      update: {
        companyId: company.id,
        sellerId: seller.id,
        stage: data.stage,
        estimatedValue: data.estimatedValue,
        lastContactAt: new Date(`${data.lastContactAt}T12:00:00.000Z`),
        proposalValidUntil: data.proposalValidUntil ? new Date(`${data.proposalValidUntil}T12:00:00.000Z`) : null,
        customerEventAt: new Date(`${data.customerEventAt}T12:00:00.000Z`),
        lossReason: data.lossReason ?? null,
      },
      create: {
        code: data.code,
        companyId: company.id,
        sellerId: seller.id,
        stage: data.stage,
        estimatedValue: data.estimatedValue,
        lastContactAt: new Date(`${data.lastContactAt}T12:00:00.000Z`),
        proposalValidUntil: data.proposalValidUntil ? new Date(`${data.proposalValidUntil}T12:00:00.000Z`) : null,
        customerEventAt: new Date(`${data.customerEventAt}T12:00:00.000Z`),
        lossReason: data.lossReason ?? null,
        items: { create: { productId: product.id, quantity: data.quantity } },
      },
    });
  }
}

main()
  .then(() => console.info('Seed concluído.'))
  .finally(async () => { await prisma.$disconnect(); await pool.end(); });
