import { MiniTestAnswerQuestionResponse } from './mini-test-answer-question-response.dto';

export class MiniTestQuestionGroupAnswerResponse {
  id: number;
  index: number;
  position: number;
  audioUrl?: string;
  imageUrl?: string;
  passage?: string;
  questions: MiniTestAnswerQuestionResponse[];
}
