import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ETestStatus } from 'src/enums/ETestStatus.enum';

export class GetTestSetDetailQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  page: number = 0;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  size: number = 10;

  @IsOptional()
  @IsString()
  sortBy: string = 'updatedAt';

  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  direction: 'ASC' | 'DESC' = 'DESC';

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(ETestStatus)
  status?: ETestStatus;
}
