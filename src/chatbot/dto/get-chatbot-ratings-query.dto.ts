import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { EChatbotRating } from 'src/enums/EChatbotRating.enum';

export class GetChatbotRatingsQueryDto {
  @IsOptional()
  @IsEnum(EChatbotRating)
  rating?: EChatbotRating;

  @IsOptional()
  @IsString()
  conversationTitle?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  page: number = 0;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  size: number = 10;

  @IsOptional()
  @IsString()
  sortBy: string = 'updatedAt';

  @IsOptional()
  @IsString()
  direction: 'ASC' | 'DESC' = 'DESC';
}

