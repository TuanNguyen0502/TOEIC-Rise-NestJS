import { MiniTestQuestionResponse } from './mini-test-question-response.dto';

export class MiniTestQuestionGroupResponse {
  id: number;
  index: number;
  position: number;
  audioUrl?: string;
  imageUrl?: string;
  passage?: string;
  questions: MiniTestQuestionResponse[];
}
