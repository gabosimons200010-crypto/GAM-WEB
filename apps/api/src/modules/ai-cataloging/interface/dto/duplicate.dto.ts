import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';

export enum DuplicateActionDto {
  merge = 'merge',
  update_stock = 'update_stock',
  ignore = 'ignore',
}

export class ResolveDuplicateDto {
  @ApiProperty({ enum: DuplicateActionDto })
  @IsEnum(DuplicateActionDto)
  action!: DuplicateActionDto;

  @ApiPropertyOptional({ description: 'Stock a sumar (solo update_stock)' })
  @IsOptional()
  @IsInt()
  @Min(0)
  stock?: number;
}
