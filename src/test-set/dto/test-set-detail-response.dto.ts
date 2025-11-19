import { ETestSetStatus } from 'src/enums/ETestSetStatus.enum';
import { PageResponse } from './page-response.dto';

export interface TestSetDetailResponse {
  id: number;
  name: string;
  status: ETestSetStatus;
  createdAt: string | null;
  updatedAt: string | null;
  testResponses: PageResponse<any>;
}
