export class FlashcardItemDetailResponse {
  id: number;
  vocabulary: string;
  definition: string;
  audioUrl?: string;
  pronunciation?: string;
  createdAt: Date;
  updatedAt: Date;
}
