export class UserAnswerDetailResponse {
  userAnswerId: number;
  questionId: number;
  userAnswer: string;
  position: number;
  tags: string[];
  audioUrl?: string;
  imageUrl?: string;
  passage?: string;
  transcript?: string;
  questionContent: string;
  options: (string | null)[];
  correctOption: string;
  explanation?: string;
}
