import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, Min } from 'class-validator';

export class ValidateCouponDto {
  @ApiProperty({ example: 'BIENVENIDA10' })
  @IsString()
  code!: string;

  @ApiProperty({ example: 149.9 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  subtotal!: number;
}
