import { LearnerPartResponse } from 'src/part/dto/learner-part-response.dto';

export class LearnerTestDetailResponse {
  testId: number;
  testName: string;
  numberOfLearnedTests: number;
  learnerPartResponses: LearnerPartResponse[];
}
