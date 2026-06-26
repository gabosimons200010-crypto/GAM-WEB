import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { GenderDto } from '../../../catalog/interface/dto/product.dto';

export enum SortDto {
  relevance = 'relevance',
  newest = 'newest',
  price_asc = 'price_asc',
  price_desc = 'price_desc',
  best_selling = 'best_selling',
}

/** Parámetros de la búsqueda pública del catálogo (RF-MKT-001). */
export class SearchQueryDto {
  @ApiPropertyOptional({ description: 'Texto libre: busca en nombre, descripción y tags.', example: 'polo oversize' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  q?: string;

  @ApiPropertyOptional({ description: 'Slug de la categoría.', example: 'polos' })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  category?: string;

  @ApiPropertyOptional({ enum: GenderDto })
  @IsOptional()
  @IsEnum(GenderDto)
  gender?: GenderDto;

  @ApiPropertyOptional({ example: 20, description: 'Precio mínimo (PEN).' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  minPrice?: number;

  @ApiPropertyOptional({ example: 150, description: 'Precio máximo (PEN).' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  maxPrice?: number;

  @ApiPropertyOptional({ enum: SortDto, default: SortDto.relevance })
  @IsOptional()
  @IsEnum(SortDto)
  sort?: SortDto;

  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ example: 24, default: 24, maximum: 48 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(48)
  pageSize?: number;
}

/** Parámetros de paginación/orden para la página de una tienda. */
export class StorePageQueryDto {
  @ApiPropertyOptional({ enum: SortDto, default: SortDto.newest })
  @IsOptional()
  @IsEnum(SortDto)
  sort?: SortDto;

  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ example: 24, default: 24, maximum: 48 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(48)
  pageSize?: number;
}
