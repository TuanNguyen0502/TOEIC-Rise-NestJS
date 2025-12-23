import { IsOptional, IsString, IsUrl } from 'class-validator';

export class QuestionGroupUpdateRequestDto {
  @IsOptional()
  @IsString()
  audioUrl?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsString()
  passage?: string;

  @IsOptional()
  @IsString()
  transcript?: string;
}
