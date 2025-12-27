import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class FlashcardItemCreateRequest {
  @IsNotEmpty({ message: 'Vocabulary is required' })
  @IsString({ message: 'Vocabulary must be a string' })
  vocabulary: string;

  @IsNotEmpty({ message: 'Definition is required' })
  @IsString({ message: 'Definition must be a string' })
  definition: string;

  @IsOptional()
  @IsString({ message: 'Audio URL must be a string' })
  audioUrl?: string;

  @IsOptional()
  @IsString({ message: 'Pronunciation must be a string' })
  pronunciation?: string;
}
