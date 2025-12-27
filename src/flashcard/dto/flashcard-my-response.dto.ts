import { EAccessType } from 'src/enums/EAccessType.enum';

export class FlashcardMyResponse {
  id: number;

  name: string;

  description?: string;

  accessType: EAccessType;

  itemCount: number;

  favouriteCount: number;

  favourite: boolean;

  createdAt: Date;

  updatedAt: Date;
}
