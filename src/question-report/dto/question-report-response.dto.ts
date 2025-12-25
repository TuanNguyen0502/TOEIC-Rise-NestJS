import { EQuestionReportStatus } from 'src/enums/EQuestionReportStatus.enum';
import { EQuestionReportReason } from 'src/enums/EQuestionReportReason.enum';

export class QuestionReportResponseDto {
  id: number;
  testName: string;
  reporterName: string;
  resolverName: string;
  status: EQuestionReportStatus;
  reasons: EQuestionReportReason[];
}
