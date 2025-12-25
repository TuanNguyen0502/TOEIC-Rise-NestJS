import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { EQuestionReportStatus } from 'src/enums/EQuestionReportStatus.enum';

export class GetQuestionReportsQueryDto {
  @IsOptional()
  @IsEnum(EQuestionReportStatus)
  questionReportStatus?: EQuestionReportStatus;

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
}
