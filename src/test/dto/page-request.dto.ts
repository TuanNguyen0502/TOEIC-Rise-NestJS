import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class PageRequestDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0, { message: 'Page index must be zero or greater.' })
  @Max(100, { message: 'Page index must be less than or equal to 100.' })
  page: number = 0;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(10, { message: 'Size must be greater than ten.' })
  @Max(50, { message: 'Size must be less than or equal to 50.' })
  size: number = 10;

  @IsOptional()
  @IsString()
  name?: string;

  // In Java, 'sort' was List<Long>. In NestJS, we can pass this as a
  // comma-separated string and transform it, or adjust as needed.
  // For simplicity, we'll keep it simple here.
  @IsOptional()
  sort?: string;
}
