import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class ChatAboutQuestionRequestDto {
  @IsOptional()
  @IsString()
  conversationId?: string;

  @IsNotEmpty()
  @IsString()
  message: string;

  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  userAnswerId: number;
}
