import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

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
}
