import { PageResponse } from 'src/test-set/dto/page-response.dto';
import { TestHistoryResponse } from './dto/test-history-response.dto';
import { FullTestResultResponse } from './dto/full-test-result-response.dto';

export interface IAnalysisService {
  getAllTestHistory(
    page: number,
    size: number,
    email: string,
  ): Promise<PageResponse<TestHistoryResponse[]>>;

  getFullTestResult(
    email: string,
    size: number,
  ): Promise<FullTestResultResponse>;
}
