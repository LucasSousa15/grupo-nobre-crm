import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, MaxLength, Min, ValidateNested } from 'class-validator';
import { OpportunityItemDto } from './opportunity-item.dto';

export class CreateOpportunityDto {
  @ApiProperty({ example: 'OPP-2008' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  code!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  companyId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  sellerId!: string;

  @ApiPropertyOptional({ example: 4500.0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  estimatedValue?: number;

  @ApiPropertyOptional({ example: '2026-10-15T14:30:00.000Z' })
  @IsOptional()
  @IsDateString()
  lastContactAt?: string;

  @ApiPropertyOptional({ example: '2026-10-17T14:30:00.000Z' })
  @IsOptional()
  @IsDateString()
  nextFollowUpAt?: string;

  @ApiPropertyOptional({ example: '2026-10-22' })
  @IsOptional()
  @IsDateString()
  proposalValidUntil?: string;

  @ApiProperty({ example: '2026-11-30', description: 'Data do evento, prazo final comercial da oportunidade.' })
  @IsDateString()
  customerEventAt!: string;

  @ApiPropertyOptional({ type: [OpportunityItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OpportunityItemDto)
  items?: OpportunityItemDto[];
}
