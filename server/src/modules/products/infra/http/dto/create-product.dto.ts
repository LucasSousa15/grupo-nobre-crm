import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateProductDto {
  @ApiProperty({ example: 'Caneca personalizada' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  name!: string;

  @ApiPropertyOptional({ example: 'Caneca de cerâmica com impressão personalizada.' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;
}
