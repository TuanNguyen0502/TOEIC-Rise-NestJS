import {
  IsOptional,
  IsString,
  IsInt,
  Min,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ERole } from 'src/enums/ERole.enum';

export class GetUsersQueryDto {
  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  isActive?: string;

  @IsOptional()
  @IsEnum(ERole)
  role?: ERole;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  page?: number = 0;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  size?: number = 10;

  @IsOptional()
  @IsString()
  sortBy?: string = 'updatedAt';

  @IsOptional()
  @IsString()
  direction?: 'ASC' | 'DESC' = 'DESC';
}
