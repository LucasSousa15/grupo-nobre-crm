import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateSellerDto {
  @ApiPropertyOptional({ example: 'Ana Martins' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional({ example: 'ana@nobrebrindes.com.br' })
  @IsOptional()
  @IsEmail()
  @MaxLength(254)
  email?: string;

  @ApiPropertyOptional({ example: '+55 11 99999-9999', nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string | null;

  @ApiPropertyOptional({ example: false, description: 'Desativa o vendedor sem excluir seu histórico.' })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
