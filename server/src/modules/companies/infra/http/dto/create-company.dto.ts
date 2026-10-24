import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateCompanyDto {
  @ApiProperty({ example: 'Tech Alpha Ltda' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  companyName!: string;

  @ApiProperty({ example: 'Mariana Silva' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  contactName!: string;

  @ApiPropertyOptional({ example: 'mariana@techalpha.com.br' })
  @IsOptional()
  @IsEmail()
  @MaxLength(254)
  contactEmail?: string;

  @ApiPropertyOptional({ example: '+55 11 99999-9999' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  contactPhone?: string;
}
