import { ExamTypeStatsResponse } from './exam-type-stats-response.dto';

export class AnalysisResultResponse {
  numberOfTests: number;
  numberOfSubmissions: number;
  totalTimes: number;
  examList: ExamTypeStatsResponse[];
}
