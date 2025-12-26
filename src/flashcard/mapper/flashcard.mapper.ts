import { Injectable } from '@nestjs/common';
import { Flashcard } from 'src/entities/flashcard.entity';

@Injectable()
export class FlashcardMapper {
  toFlashcardPublicResponse(flashcard: Flashcard, isFavourite: boolean) {
    return {
      id: flashcard.id,
      authorFullName: flashcard.user.fullName,
      name: flashcard.name,
      accessType: flashcard.accessType,
      itemCount: flashcard.items?.length || 0,
      favouriteCount: flashcard.favouriteCount,
      isFavourite,
    };
  }
}
