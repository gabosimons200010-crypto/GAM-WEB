import { ApiProperty } from '@nestjs/swagger';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsString } from 'class-validator';

export class CreateBatchDto {
  @ApiProperty({
    type: [String],
    description: 'Claves de objetos ya subidos (vía URL prefirmada). 1 a 500 (IA-003).',
    example: ['stores/st_1/uploads/abc.jpg', 'stores/st_1/uploads/def.webp'],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(500)
  @IsString({ each: true })
  imageKeys!: string[];
}
