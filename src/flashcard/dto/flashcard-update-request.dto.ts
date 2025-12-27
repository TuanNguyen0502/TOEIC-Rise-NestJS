import { IsNotEmpty, IsString, IsOptional, IsEnum, IsArray, ValidateNested } from 'class-validator';
import { EAccessType } from 'src/enums/EAccessType.enum';
import { Type } from 'class-transformer';
import { FlashcardItemUpdateRequest } from './flashcard-item-update-request.dto';

export class FlashcardUpdateRequest {
  @IsNotEmpty({ message: 'Flashcard name is required' })
  @IsString({ message: 'Flashcard name must be a string' })
  name: string;

  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  description?: string;

  @IsNotEmpty({ message: 'Access type is required' })
  @IsEnum(EAccessType, { message: 'Access type must be PUBLIC or PRIVATE' })
  accessType: EAccessType;

  @IsOptional()
  @IsArray({ message: 'Items must be an array' })
  @ValidateNested({ each: true })
  @Type(() => FlashcardItemUpdateRequest)
  items?: FlashcardItemUpdateRequest[];
}
