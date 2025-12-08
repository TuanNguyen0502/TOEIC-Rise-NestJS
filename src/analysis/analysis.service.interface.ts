import { PageResponse } from 'src/test-set/dto/page-response.dto';
import { TestHistoryResponse } from './dto/test-history-response.dto';
import { FullTestResultResponse } from './dto/full-test-result-response.dto';
import { AnalysisResultResponse } from './dto/analysis-result-response.dto';
import { EDays } from 'src/enums/EDays.enum';

export interface IAnalysisService {
  getAnalysisResult(
    email: string,
    days: EDays,
  ): Promise<AnalysisResultResponse>;

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
