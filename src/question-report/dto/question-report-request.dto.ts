import { IsArray, ArrayNotEmpty, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { EQuestionReportReason } from 'src/enums/EQuestionReportReason.enum';

export class QuestionReportRequestDto {
  @IsNumber({}, { message: 'Question ID must be a number' })
  questionId: number;

  @IsArray({ message: 'Reasons must be an array' })
  @ArrayNotEmpty({ message: 'Reasons must not be empty' })
  @IsEnum(EQuestionReportReason, { each: true, message: 'Invalid reason' })
  reasons: EQuestionReportReason[];

  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  description?: string;
}
