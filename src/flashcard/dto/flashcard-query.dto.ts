import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class FlashcardQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0, { message: 'Page index must be zero or greater.' })
  @Max(100, { message: 'Page index must be less than or equal to 100.' })
  page: number = 0;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1, { message: 'Size must be greater than zero.' })
  @Max(50, { message: 'Size must be less than or equal to 50.' })
  size: number = 10;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  sortBy: string = 'favouriteCount';

  @IsOptional()
  @IsString()
  direction: 'ASC' | 'DESC' = 'DESC';
}
