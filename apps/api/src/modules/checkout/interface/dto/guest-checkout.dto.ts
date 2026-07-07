import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { ShippingAddressDto } from './checkout.dto';

const PHONE_REGEX = /^9\d{8}$/;

export class GuestItemDto {
  @ApiProperty({ example: 'clx123abc' })
  @IsString()
  variantId!: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  @Max(20)
  quantity!: number;
}

export class GuestCheckoutDto {
  @ApiProperty({ type: [GuestItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => GuestItemDto)
  items!: GuestItemDto[];

  @ApiProperty({ type: ShippingAddressDto })
  @ValidateNested()
  @Type(() => ShippingAddressDto)
  address!: ShippingAddressDto;

  @ApiProperty({ example: 'cliente@correo.com', description: 'Correo para el pedido (obligatorio).' })
  @IsEmail()
  email!: string;

  @ApiPropertyOptional({ example: 'María Pérez' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional({ example: '987654321' })
  @IsOptional()
  @Matches(PHONE_REGEX, { message: 'Número de celular peruano inválido' })
  phone?: string;

  @ApiPropertyOptional({ example: '12345678' })
  @IsOptional()
  @Matches(/^\d{8}$/, { message: 'El DNI debe tener 8 dígitos' })
  dni?: string;

  @ApiPropertyOptional({ example: 'BIENVENIDA10' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  couponCode?: string;
}
