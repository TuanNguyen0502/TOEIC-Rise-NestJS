import { IsNumber, IsString, IsOptional } from 'class-validator';

export class FlashcardItemUpdateRequest {
  @IsOptional()
  @IsNumber({}, { message: 'Item ID must be a number' })
  id?: number;

  @IsString({ message: 'Vocabulary must be a string' })
  vocabulary: string;

  @IsString({ message: 'Definition must be a string' })
  definition: string;

  @IsOptional()
  @IsString({ message: 'Audio URL must be a string' })
  audioUrl?: string;

  @IsOptional()
  @IsString({ message: 'Pronunciation must be a string' })
  pronunciation?: string;
}
