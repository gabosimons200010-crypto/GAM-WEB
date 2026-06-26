import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export enum PaymentMethodDto {
  YAPE = 'YAPE',
  PLIN = 'PLIN',
  CARD = 'CARD',
  TRANSFER = 'TRANSFER',
}

export class CreatePaymentDto {
  @ApiProperty({ example: 'clord123', description: 'ID de la orden a pagar.' })
  @IsString()
  orderId!: string;

  @ApiProperty({ enum: PaymentMethodDto, example: PaymentMethodDto.YAPE })
  @IsEnum(PaymentMethodDto)
  method!: PaymentMethodDto;

  @ApiPropertyOptional({ description: 'Token de tarjeta (solo método CARD).' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  cardToken?: string;
}

export enum WebhookOutcomeDto {
  CONFIRMED = 'CONFIRMED',
  FAILED = 'FAILED',
  EXPIRED = 'EXPIRED',
}

/**
 * Cuerpo del webhook del proveedor. En el stub lo envías tú para simular la
 * confirmación de Yape/Plin; un proveedor real manda su propio formato y este
 * adaptador lo traduciría.
 */
export class PaymentWebhookDto {
  @ApiProperty({ description: 'ID único del evento en el proveedor (idempotencia).', example: 'evt_001' })
  @IsString()
  externalId!: string;

  @ApiProperty({ description: 'Referencia del cobro devuelta al crear el pago.', example: 'ref_ab12cd34' })
  @IsString()
  providerRef!: string;

  @ApiProperty({ enum: WebhookOutcomeDto, example: WebhookOutcomeDto.CONFIRMED })
  @IsEnum(WebhookOutcomeDto)
  outcome!: WebhookOutcomeDto;
}
