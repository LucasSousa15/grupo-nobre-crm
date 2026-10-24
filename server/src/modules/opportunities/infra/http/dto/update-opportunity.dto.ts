import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsDateString, IsNumber, IsOptional, IsUUID, Min, ValidateIf, ValidateNested } from 'class-validator';
import { OpportunityItemDto } from './opportunity-item.dto';

export class UpdateOpportunityDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  companyId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  sellerId?: string;

  @ApiPropertyOptional({ example: 4500.0, nullable: true })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  estimatedValue?: number | null;

  @ApiPropertyOptional({ example: '2026-10-15T14:30:00.000Z', nullable: true })
  @IsOptional()
  @IsDateString()
  lastContactAt?: string | null;

  @ApiPropertyOptional({ example: '2026-10-17T14:30:00.000Z', nullable: true })
  @IsOptional()
  @IsDateString()
  nextFollowUpAt?: string | null;

  @ApiPropertyOptional({ example: '2026-10-22', nullable: true })
  @IsOptional()
  @IsDateString()
  proposalValidUntil?: string | null;

  @ApiPropertyOptional({ example: '2026-11-30', description: 'Data do evento; não pode ser removida.' })
  @ValidateIf((_, value) => value !== undefined)
  @IsDateString()
  customerEventAt?: string;

  @ApiPropertyOptional({ type: [OpportunityItemDto], description: 'Substitui integralmente os itens quando informado.' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OpportunityItemDto)
  items?: OpportunityItemDto[];
}
