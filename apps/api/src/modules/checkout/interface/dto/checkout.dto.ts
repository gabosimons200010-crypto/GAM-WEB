import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEmail, IsOptional, IsString, Matches, MaxLength, MinLength, ValidateNested } from 'class-validator';

const PHONE_REGEX = /^9\d{8}$/;

export class ShippingAddressDto {
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

  @ApiProperty({ example: 'La Victoria' })
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  district!: string;

  @ApiProperty({ example: 'Jr. Gamarra 123, Galería Central' })
  @IsString()
  @MinLength(4)
  @MaxLength(200)
  line!: string;

  @ApiPropertyOptional({ example: 'Frente al paradero' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  reference?: string;

  @ApiPropertyOptional({ example: '987654321' })
  @IsOptional()
  @Matches(PHONE_REGEX, { message: 'Número de celular peruano inválido' })
  phone?: string;
}

export class CheckoutDto {
  @ApiProperty({ type: ShippingAddressDto })
  @ValidateNested()
  @Type(() => ShippingAddressDto)
  address!: ShippingAddressDto;

  @ApiPropertyOptional({ example: 'María Pérez', description: 'Nombre de quien recibe.' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  buyerName?: string;

  @ApiPropertyOptional({ example: 'maria@example.com' })
  @IsOptional()
  @IsEmail()
  buyerEmail?: string;

  @ApiPropertyOptional({ example: '987654321' })
  @IsOptional()
  @Matches(PHONE_REGEX, { message: 'Número de celular peruano inválido' })
  buyerPhone?: string;

  @ApiPropertyOptional({ example: '12345678', description: 'DNI para la boleta.' })
  @IsOptional()
  @Matches(/^\d{8}$/, { message: 'El DNI debe tener 8 dígitos' })
  buyerDni?: string;
}
