import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class CreateReviewDto {
  @ApiProperty({ example: 5, minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @ApiProperty({ required: false, example: 'Buena calidad, la talla calza bien.' })
  @IsOptional()
  @IsString()
  @MaxLength(600)
  comment?: string;
}
