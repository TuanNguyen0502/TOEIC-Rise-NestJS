import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { EChatbotRating } from 'src/enums/EChatbotRating.enum';

export class ChatbotRatingRequestDto {
  @IsString()
  @IsNotEmpty()
  messageId: string;

  @IsEnum(EChatbotRating)
  @IsNotEmpty()
  rating: EChatbotRating;
}

