import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEmail, IsEnum, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export enum SubOrderStatusDto {
  PREPARING = 'PREPARING',
  READY_FOR_PICKUP = 'READY_FOR_PICKUP',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  RETURNED = 'RETURNED',
  DELIVERY_FAILED = 'DELIVERY_FAILED',
}

export class PageQueryDto {
  @ApiPropertyOptional({ description: 'Cursor (id del último elemento de la página previa).' })
  @IsOptional()
  @IsString()
  cursor?: string;

  @ApiPropertyOptional({ example: 20, maximum: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;
}

export class StoreOrdersQueryDto extends PageQueryDto {
  @ApiPropertyOptional({ enum: SubOrderStatusDto, description: 'Filtra la cola por estado.' })
  @IsOptional()
  @IsEnum(SubOrderStatusDto)
  status?: SubOrderStatusDto;
}

/** Rastreo público de pedido: número + correo. */
export class TrackOrderDto {
  @ApiProperty({ example: 'GG-A5EBB38C', description: 'Número del pedido.' })
  @IsString()
  @MaxLength(40)
  number!: string;

  @ApiProperty({ example: 'tu@correo.com', description: 'Correo con el que se hizo el pedido.' })
  @IsEmail()
  email!: string;
}

export class AdvanceStatusDto {
  @ApiPropertyOptional({ enum: SubOrderStatusDto, description: 'Nuevo estado de la suborden.' })
  @IsEnum(SubOrderStatusDto)
  to!: SubOrderStatusDto;

  @ApiPropertyOptional({ description: 'Nota interna del cambio (opcional).' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  note?: string;

  @ApiPropertyOptional({ description: 'Código de seguimiento al despachar (opcional).' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  trackingCode?: string;
}
