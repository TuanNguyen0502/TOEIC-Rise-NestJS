import { MiniTestQuestionGroupResponse } from './mini-test-question-group-response.dto';

export class MiniTestResponse {
  totalQuestions: number;
  questionGroups: MiniTestQuestionGroupResponse[];
}
