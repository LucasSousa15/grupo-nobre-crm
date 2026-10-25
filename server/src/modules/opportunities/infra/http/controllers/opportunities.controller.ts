import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiConflictResponse, ApiCreatedResponse, ApiNoContentResponse, ApiOkResponse, ApiOperation, ApiParam, ApiTags, ApiUnprocessableEntityResponse } from '@nestjs/swagger';
import { ChangeOpportunityStageUseCase } from 'src/modules/opportunities/application/use-cases/change-opportunity-stage.use-case';
import { CreateOpportunityUseCase } from 'src/modules/opportunities/application/use-cases/create-opportunity.use-case';
import { DeleteOpportunityUseCase } from 'src/modules/opportunities/application/use-cases/delete-opportunity.use-case';
import { FindOpportunitiesUseCase } from 'src/modules/opportunities/application/use-cases/find-opportunities.use-case';
import { UpdateOpportunityUseCase } from 'src/modules/opportunities/application/use-cases/update-opportunity.use-case';
import { ChangeOpportunityStageDto } from '../dto/change-opportunity-stage.dto';
import { CreateOpportunityDto } from '../dto/create-opportunity.dto';
import { FindOpportunitiesDto } from '../dto/find-opportunities.dto';
import { UpdateOpportunityDto } from '../dto/update-opportunity.dto';
import { OpportunityViewModel } from '../view-models/opportunity.view-model';
import { OpportunityStageHistoryViewModel } from '../view-models/opportunity-stage-history.view-model';
import { ReminderRepository } from 'src/modules/reminders/domain/repositories/reminder.repository';
import { ResourceNotFoundError } from 'src/core/shared/errors/resource-not-found.error';

@ApiTags('Opportunities')
@Controller('opportunities')
export class OpportunitiesController {
  constructor(
    private readonly createOpportunity: CreateOpportunityUseCase,
    private readonly findOpportunities: FindOpportunitiesUseCase,
    private readonly updateOpportunity: UpdateOpportunityUseCase,
    private readonly deleteOpportunity: DeleteOpportunityUseCase,
    private readonly changeOpportunityStage: ChangeOpportunityStageUseCase,
    private readonly reminders: ReminderRepository,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Lista oportunidades para o Kanban' })
  @ApiOkResponse({ description: 'Oportunidades encontradas.' })
  async findAll(@Query() filters: FindOpportunitiesDto) {
    const page = await this.findOpportunities.all(filters);
    return {
      opportunities: page.opportunities.map(OpportunityViewModel.toHTTP),
      nextCursor: page.nextCursor,
      total: page.total,
      attentionSummary: page.attentionSummary,
    };
  }

  @Get(':id/history')
  @ApiOperation({ summary: 'Lista a linha do tempo de mudanças de etapa' })
  @ApiParam({ name: 'id', description: 'UUID da oportunidade' })
  async findHistory(@Param('id') id: string) {
    const history = await this.findOpportunities.history(id);
    return { history: history.map(OpportunityStageHistoryViewModel.toHTTP) };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca os detalhes de uma oportunidade' })
  @ApiParam({ name: 'id', description: 'UUID da oportunidade' })
  async findById(@Param('id') id: string) {
    return { opportunity: OpportunityViewModel.toHTTP(await this.findOpportunities.byId(id)) };
  }

  @Get(':id/reminders')
  @ApiOperation({ summary: 'Lista lembretes da oportunidade' })
  async findReminders(@Param('id') id: string) {
    return { reminders: await this.reminders.findByOpportunityId(id) };
  }

  @Patch(':id/reminders/:reminderId/dismiss')
  @HttpCode(204)
  @ApiOperation({ summary: 'Conclui um lembrete aberto' })
  async dismissReminder(@Param('id') id: string, @Param('reminderId') reminderId: string): Promise<void> {
    if (!(await this.reminders.dismiss(reminderId, id))) throw new ResourceNotFoundError('Lembrete');
  }

  @Post()
  @ApiOperation({ summary: 'Cria uma oportunidade em Primeiro Contato' })
  @ApiCreatedResponse({ description: 'Oportunidade criada.' })
  @ApiConflictResponse({ description: 'Código já cadastrado.' })
  async create(@Body() dto: CreateOpportunityDto) {
    const opportunity = await this.createOpportunity.execute({
      ...dto,
      lastContactAt: this.toDate(dto.lastContactAt),
      nextFollowUpAt: this.toDate(dto.nextFollowUpAt),
      proposalValidUntil: this.toDate(dto.proposalValidUntil),
      customerEventAt: new Date(dto.customerEventAt),
    });
    return { opportunity: OpportunityViewModel.toHTTP(opportunity) };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza dados e itens sem alterar o estágio' })
  @ApiParam({ name: 'id', description: 'UUID da oportunidade' })
  @ApiUnprocessableEntityResponse({ description: 'Referência inválida ou dados incompatíveis com o estágio atual.' })
  async update(@Param('id') id: string, @Body() dto: UpdateOpportunityDto) {
    const opportunity = await this.updateOpportunity.execute(id, {
      ...dto,
      lastContactAt: this.toNullableDate(dto.lastContactAt),
      nextFollowUpAt: this.toNullableDate(dto.nextFollowUpAt),
      proposalValidUntil: this.toNullableDate(dto.proposalValidUntil),
      customerEventAt: this.toDate(dto.customerEventAt),
    });
    return { opportunity: OpportunityViewModel.toHTTP(opportunity) };
  }

  @Patch(':id/stage')
  @HttpCode(204)
  @ApiOperation({ summary: 'Move uma oportunidade pelo funil de vendas' })
  @ApiParam({ name: 'id', description: 'UUID da oportunidade' })
  @ApiNoContentResponse({ description: 'Estágio e histórico registrados com sucesso.' })
  @ApiUnprocessableEntityResponse({ description: 'Transição inválida ou pré-requisito não atendido.' })
  async changeStage(@Param('id') id: string, @Body() dto: ChangeOpportunityStageDto): Promise<void> {
    await this.changeOpportunityStage.execute({ opportunityId: id, ...dto });
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Exclui uma oportunidade ainda em Primeiro Contato' })
  @ApiParam({ name: 'id', description: 'UUID da oportunidade' })
  @ApiNoContentResponse({ description: 'Oportunidade excluída.' })
  @ApiUnprocessableEntityResponse({ description: 'Oportunidade já avançou no funil.' })
  async delete(@Param('id') id: string): Promise<void> {
    await this.deleteOpportunity.execute(id);
  }

  private toDate(value: string | undefined): Date | undefined {
    return value === undefined ? undefined : new Date(value);
  }

  private toNullableDate(value: string | null | undefined): Date | null | undefined {
    if (value === undefined || value === null) return value;
    return new Date(value);
  }
}
