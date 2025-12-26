import { EAccessType } from 'src/enums/EAccessType.enum';

export class FlashcardPublicResponse {
  id: number;
  authorFullName: string;
  name: string;
  accessType: EAccessType;
  itemCount: number;
  favouriteCount: number;
  isFavourite: boolean;
}
