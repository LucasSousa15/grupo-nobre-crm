import { describe, expect, it } from 'vitest';
import { OpportunityAttentionStatus } from 'src/modules/opportunities/domain/services/opportunity-attention.service';
import { OpportunityStage } from 'src/modules/opportunities/domain/types/opportunity-stage';
import { OpportunityViewModel } from 'src/modules/opportunities/infra/http/view-models/opportunity.view-model';

describe('OpportunityViewModel', () => {
  it('exposes company contact details for the opportunity workspace', () => {
    const response = OpportunityViewModel.toHTTP({
      id: 'opportunity-id',
      code: 'OPP-2001',
      companyId: 'company-id',
      companyName: 'Tech Alpha',
      companyContactName: 'Mariana Alves',
      companyContactEmail: 'mariana@techalpha.local',
      companyContactPhone: '11987650001',
      sellerId: 'seller-id',
      sellerName: 'Ana',
      stage: OpportunityStage.FIRST_CONTACT,
      estimatedValue: 4500,
      lastContactAt: null,
      nextFollowUpAt: null,
      proposalValidUntil: null,
      customerEventAt: new Date('2026-11-30T00:00:00.000Z'),
      lossReason: null,
      attentionStatus: OpportunityAttentionStatus.NORMAL,
      items: [],
      createdAt: new Date('2026-10-15T12:00:00.000Z'),
      updatedAt: new Date('2026-10-15T12:00:00.000Z'),
    });

    expect(response.company).toEqual({
      id: 'company-id',
      name: 'Tech Alpha',
      contactName: 'Mariana Alves',
      contactEmail: 'mariana@techalpha.local',
      contactPhone: '11987650001',
    });
    expect(response.transitionOptions).toEqual([
      expect.objectContaining({
        stage: OpportunityStage.QUOTE_PRESENTATION,
        enabled: false,
        requirements: expect.arrayContaining(['Inclua ao menos um item de brinde.', 'Informe a validade da proposta.']),
      }),
      expect.objectContaining({ stage: OpportunityStage.LOST, enabled: true, requiresLossReason: true }),
    ]);
  });
});
