import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateAddressDto {
  @ApiProperty({ example: 'Lima' })
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  department!: string;

  @ApiProperty({ example: 'Lima' })
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  province!: string;

  @ApiProperty({ example: 'Miraflores' })
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  district!: string;

  @ApiProperty({ example: 'Av. Larco 123, dpto 4B' })
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  line!: string;

  @ApiPropertyOptional({ example: 'Frente al parque' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  reference?: string;

  @ApiPropertyOptional({ example: '987654321' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
