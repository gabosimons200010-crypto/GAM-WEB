import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateGalleryDto {
  @ApiProperty({ example: 'Galería La Mundial' })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @ApiProperty({ example: 'Jr. Gamarra 123, La Victoria, Lima' })
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  address!: string;

  @ApiPropertyOptional({ description: 'Horario por día (JSON libre).' })
  @IsOptional()
  schedule?: unknown;

  @ApiPropertyOptional({ example: -12.0664 })
  @IsOptional()
  @IsLatitude()
  latitude?: number;

  @ApiPropertyOptional({ example: -77.0184 })
  @IsOptional()
  @IsLongitude()
  longitude?: number;

  @ApiPropertyOptional({ example: 'https://maps.google.com/...' })
  @IsOptional()
  @IsUrl()
  mapUrl?: string;
}
