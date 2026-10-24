import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateProductDto {
  @ApiPropertyOptional({ example: 'Caneca personalizada' })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  name?: string;

  @ApiPropertyOptional({ example: 'Caneca de cerâmica com impressão personalizada.', nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string | null;

  @ApiPropertyOptional({ example: false, description: 'Desativa o produto sem removê-lo do histórico.' })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
