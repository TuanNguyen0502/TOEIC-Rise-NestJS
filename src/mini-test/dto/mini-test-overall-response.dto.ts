import { MiniTestQuestionGroupAnswerResponse } from './mini-test-question-group-answer-response.dto';

export class MiniTestOverallResponse {
  correctAnswers: number;
  totalQuestions?: number;
  questionGroups: MiniTestQuestionGroupAnswerResponse[];
}
