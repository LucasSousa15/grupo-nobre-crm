import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator';
import { OpportunityStage } from 'src/modules/opportunities/domain/types/opportunity-stage';
import { OpportunityAttentionStatus } from 'src/modules/opportunities/domain/services/opportunity-attention.service';

export class FindOpportunitiesDto {
  @ApiPropertyOptional({ enum: OpportunityStage })
  @IsOptional()
  @IsEnum(OpportunityStage)
  stage?: OpportunityStage;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  sellerId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  companyId?: string;

  @ApiPropertyOptional({ enum: OpportunityAttentionStatus })
  @IsOptional()
  @IsEnum(OpportunityAttentionStatus)
  attentionStatus?: OpportunityAttentionStatus;

  @ApiPropertyOptional({ example: 'Tech Alpha' })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  search?: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Cursor retornado pela página anterior.' })
  @IsOptional()
  @IsUUID()
  cursor?: string;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 24 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
