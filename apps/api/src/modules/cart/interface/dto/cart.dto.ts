import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, Max, Min } from 'class-validator';

export class AddItemDto {
  @ApiProperty({ description: 'ID de la variante (talla/color) a agregar.', example: 'clv123abc' })
  @IsString()
  variantId!: string;

  @ApiProperty({ example: 1, minimum: 1, maximum: 50 })
  @IsInt()
  @Min(1)
  @Max(50)
  quantity!: number;
}

export class UpdateItemDto {
  @ApiProperty({ example: 2, minimum: 0, maximum: 50, description: '0 elimina la línea.' })
  @IsInt()
  @Min(0)
  @Max(50)
  quantity!: number;
}
