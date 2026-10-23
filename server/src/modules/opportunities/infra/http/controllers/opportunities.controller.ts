import { Body, Controller, HttpCode, Param, Patch } from '@nestjs/common';
import { ApiNoContentResponse, ApiOperation, ApiParam, ApiTags, ApiUnprocessableEntityResponse } from '@nestjs/swagger';
import { ChangeOpportunityStageUseCase } from 'src/modules/opportunities/application/use-cases/change-opportunity-stage.use-case';
import { ChangeOpportunityStageDto } from '../dto/change-opportunity-stage.dto';

@ApiTags('Opportunities')
@Controller('opportunities')
export class OpportunitiesController {
  constructor(private readonly changeOpportunityStage: ChangeOpportunityStageUseCase) {}

  @Patch(':id/stage')
  @HttpCode(204)
  @ApiOperation({ summary: 'Move uma oportunidade pelo funil de vendas' })
  @ApiParam({ name: 'id', description: 'UUID da oportunidade' })
  @ApiNoContentResponse({ description: 'Estágio e histórico registrados com sucesso.' })
  @ApiUnprocessableEntityResponse({ description: 'Transição inválida ou pré-requisito não atendido.' })
  async changeStage(@Param('id') id: string, @Body() dto: ChangeOpportunityStageDto): Promise<void> {
    await this.changeOpportunityStage.execute({ opportunityId: id, ...dto });
  }
}
