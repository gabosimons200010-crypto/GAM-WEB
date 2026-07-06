import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class AddFavoriteDto {
  @ApiProperty({ example: 'clx123abc' })
  @IsString()
  productId!: string;
}
