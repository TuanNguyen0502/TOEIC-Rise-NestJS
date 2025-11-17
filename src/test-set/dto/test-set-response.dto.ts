import { ETestSetStatus } from 'src/enums/ETestSetStatus.enum';

export class TestSetResponse {
  id: number;
  name: string;
  status: ETestSetStatus;
  createdAt: string;
  updatedAt: string;
}
