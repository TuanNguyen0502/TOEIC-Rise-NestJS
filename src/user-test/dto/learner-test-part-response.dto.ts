import { LearnerTestQuestionGroupResponse } from './learner-test-question-group-response.dto';

export class LearnerTestPartResponse {
  id: number;
  partName: string;
  questionGroups: LearnerTestQuestionGroupResponse[];
}
