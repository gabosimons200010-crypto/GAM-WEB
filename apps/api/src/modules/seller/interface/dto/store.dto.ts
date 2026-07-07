import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

const RUC_REGEX = /^\d{11}$/;
const PHONE_REGEX = /^(\+51)?9\d{8}$/;

export class SocialDto {
  @ApiProperty({ example: 'instagram' })
  @IsString()
  @MaxLength(30)
  platform!: string;

  @ApiProperty({ example: 'https://instagram.com/mitienda' })
  @IsUrl()
  url!: string;
}

export class RegisterStoreDto {
  @ApiProperty({ example: 'Modas Karla' })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  commercialName!: string;

  @ApiPropertyOptional({ example: 'Inversiones Karla S.A.C.' })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  legalName?: string;

  @ApiPropertyOptional({ example: '20123456789' })
  @IsOptional()
  @Matches(RUC_REGEX, { message: 'El RUC debe tener 11 dígitos' })
  ruc?: string;

  @ApiPropertyOptional({ example: 'Karla Ramírez', description: 'Persona que administra la tienda' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  contactName?: string;

  @ApiProperty({ example: 'contacto@modaskarla.pe' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: '987654321' })
  @Matches(PHONE_REGEX, { message: 'Número de celular peruano inválido' })
  phone!: string;

  @ApiPropertyOptional({ description: 'Id de la galería de Gamarra' })
  @IsOptional()
  @IsString()
  galleryId?: string;

  @ApiPropertyOptional({ example: '2' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  floor?: string;

  @ApiPropertyOptional({ example: 'A-123' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  stand?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  address?: string;

  @ApiPropertyOptional({ type: [String], description: 'Ids de categorías en que se especializa' })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  categoryIds?: string[];
}

export class UpdateStoreDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  logoUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  bannerUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({ type: [SocialDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => SocialDto)
  socials?: SocialDto[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  categoryIds?: string[];
}

export class UpdateStoreSettingsDto {
  @ApiPropertyOptional({ description: 'Horario por día (JSON libre)' })
  @IsOptional()
  schedule?: unknown;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(30)
  preparationDays?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  returnPolicy?: string;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1000)
  lowStockThreshold?: number;
}

export class ReasonDto {
  @ApiPropertyOptional({ example: 'Documentación incompleta' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  reason?: string;
}
