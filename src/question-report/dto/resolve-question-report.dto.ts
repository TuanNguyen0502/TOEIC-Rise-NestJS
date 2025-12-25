import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { EQuestionReportStatus } from 'src/enums/EQuestionReportStatus.enum';

// 1. DTO cập nhật Question
export class QuestionUpdateDto {
  @IsNotEmpty()
  id: number;

  @IsNotEmpty()
  questionGroupId: number;

  @IsOptional()
  content?: string;

  @IsOptional()
  options?: string[]; // Frontend gửi JSON array hoặc mảng string

  @IsNotEmpty()
  correctOption: string;

  @IsNotEmpty()
  explanation: string;

  @IsNotEmpty()
  tags: string; // Chuỗi tag phân cách bằng phẩy (giống Java)
}

// 2. DTO cập nhật Group (File sẽ xử lý riêng ở Controller)
export class QuestionGroupUpdateDto {
  @IsOptional()
  audioUrl?: string;

  @IsOptional()
  imageUrl?: string;

  @IsOptional()
  passage?: string;

  @IsNotEmpty()
  transcript: string;
}

// 3. DTO chính
export class ResolveQuestionReportDto {
  @IsNotEmpty()
  @IsEnum(EQuestionReportStatus)
  status: EQuestionReportStatus;

  @IsNotEmpty()
  @IsString()
  resolvedNote: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => QuestionUpdateDto)
  @Transform(({ value }) => {
    // Nếu gửi form-data dạng string JSON, parse nó ra object
    if (typeof value === 'string') return JSON.parse(value);
    return value;
  })
  questionUpdate?: QuestionUpdateDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => QuestionGroupUpdateDto)
  @Transform(({ value }) => {
    if (typeof value === 'string') return JSON.parse(value);
    return value;
  })
  questionGroupUpdate?: QuestionGroupUpdateDto;
}
