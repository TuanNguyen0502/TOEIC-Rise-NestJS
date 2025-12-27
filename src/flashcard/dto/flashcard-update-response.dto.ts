import { EAccessType } from 'src/enums/EAccessType.enum';

export class FlashcardUpdateResponse {
  id: number;
  authorFullName: string;
  name: string;
  accessType: EAccessType;
  itemCount: number;
  favouriteCount: number;
}
