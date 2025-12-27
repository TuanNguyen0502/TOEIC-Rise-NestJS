import { EAccessType } from 'src/enums/EAccessType.enum';
import { FlashcardItemDetailResponse } from './flashcard-item-detail-response.dto';

export class FlashcardDetailResponse {
  id: number;
  authorFullName: string;
  name: string;
  description?: string;
  accessType: EAccessType;
  favouriteCount: number;
  itemCount: number;
  updatedAt: Date;
  items: FlashcardItemDetailResponse[];
  isFavourite: boolean;
  isOwner: boolean;
}
