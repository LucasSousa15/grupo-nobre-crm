import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateSellerDto {
  @ApiProperty({ example: 'Ana Martins' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name!: string;

  @ApiProperty({ example: 'ana@nobrebrindes.com.br' })
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @ApiPropertyOptional({ example: '+55 11 99999-9999' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;
}
