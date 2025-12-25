import { EQuestionReportReason } from 'src/enums/EQuestionReportReason.enum';
import { EQuestionReportStatus } from 'src/enums/EQuestionReportStatus.enum';

export class QuestionReportDetailResponseDto {
  // --- Report Info ---
  questionReportId: number;
  reasons: EQuestionReportReason[];
  description: string;
  status: EQuestionReportStatus;
  resolvedNote: string;

  // --- Question Info ---
  questionId: number;
  questionPosition: number;
  questionContent: string;
  questionOptions: string[];
  questionCorrectOption: string;
  questionExplanation: string;
  questionTags: string[]; // List<String> tên các tag

  // --- Group Info ---
  questionGroupId: number;
  questionGroupAudioUrl: string | null;
  questionGroupImageUrl: string | null;
  questionGroupPassage: string | null;
  questionGroupTranscript: string | null;
  
  // --- Part Info ---
  partName: string;

  // --- Reporter Info ---
  reporterId: number;
  reporterFullName: string;
  reporterEmail: string;

  // --- Resolver Info ---
  resolverId: number | null;
  resolverFullName: string | null;
  resolverEmail: string | null;
}