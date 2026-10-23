import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength, ValidateIf } from 'class-validator';
import { OpportunityStage } from 'src/modules/opportunities/domain/types/opportunity-stage';

export class ChangeOpportunityStageDto {
  @ApiProperty({ enum: OpportunityStage, example: OpportunityStage.FORECAST })
  @IsEnum(OpportunityStage)
  stage!: OpportunityStage;

  @ApiPropertyOptional({ example: 'Cliente escolheu outro fornecedor.' })
  @ValidateIf((dto: ChangeOpportunityStageDto) => dto.stage === OpportunityStage.LOST)
  @IsString()
  @MaxLength(500)
  @IsOptional()
  lossReason?: string;
}
