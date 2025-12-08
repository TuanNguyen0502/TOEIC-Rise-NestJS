import { ExamTypeFullTestResponse } from './exam-type-full-test-response.dto';

export class FullTestResultResponse {
  averageScore: number;
  highestScore: number;
  averageListeningScore: number;
  averageReadingScore: number;
  maxListeningScore: number;
  maxReadingScore: number;
  examTypeFullTestResponses: ExamTypeFullTestResponse[];
}
