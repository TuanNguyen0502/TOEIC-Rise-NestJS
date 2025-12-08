import { PageResponse } from 'src/test-set/dto/page-response.dto';
import { TestHistoryResponse } from './dto/test-history-response.dto';

export interface IAnalysisService {
  getAllTestHistory(
    page: number,
    size: number,
    email: string,
  ): Promise<PageResponse<TestHistoryResponse[]>>;
}
