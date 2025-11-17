import {
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

export class QuestionRequestDto {
  @IsInt()
  @IsNotEmpty({ message: 'Question must not be null.' })
  id: number;

  @IsInt()
  @IsNotEmpty({ message: 'Question group must not be null.' })
  questionGroupId: number;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsObject()
  options?: Record<string, string>;

  @IsString()
  @IsNotEmpty({ message: 'Correct option must not be blank.' })
  correctOption: string;

  @IsString()
  @IsNotEmpty({ message: 'Explain must not be blank.' })
  explanation: string;

  @IsString()
  @IsNotEmpty({ message: 'Tag must not be empty.' })
  tags: string; // Will be a semicolon-separated string, e.g., "tag1;tag2"
}
