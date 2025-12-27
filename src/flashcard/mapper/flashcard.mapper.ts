import { Injectable } from '@nestjs/common';
import { Flashcard } from 'src/entities/flashcard.entity';
import { FlashcardItem } from 'src/entities/flashcard-item.entity';
import { FlashcardDetailResponse } from '../dto/flashcard-detail-response.dto';
import { FlashcardItemDetailResponse } from '../dto/flashcard-item-detail-response.dto';

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
      favourite: isFavourite,
    };
  }

  toFlashcardDetailResponse(
    flashcard: Flashcard,
    isOwner: boolean,
    isFavourite: boolean,
    items: FlashcardItemDetailResponse[],
  ): FlashcardDetailResponse {
    return {
      id: flashcard.id,
      authorFullName: flashcard.user.fullName,
      name: flashcard.name,
      description: flashcard.description,
      accessType: flashcard.accessType,
      favouriteCount: flashcard.favouriteCount,
      itemCount: items.length,
      updatedAt: flashcard.updatedAt,
      items,
      isFavourite: isFavourite,
      isOwner: isOwner,
    };
  }

  toFlashcardItemDetailResponse(item: FlashcardItem): FlashcardItemDetailResponse {
    return {
      id: item.id,
      vocabulary: item.vocabulary,
      definition: item.definition,
      audioUrl: item.audioUrl,
      pronunciation: item.pronunciation,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }
}
