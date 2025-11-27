import { LearnerTestPartResponse } from './learner-test-part-response.dto';

export class LearnerTestPartsResponse {
  id: number;
  testName: string;
  partResponses: LearnerTestPartResponse[];
}
