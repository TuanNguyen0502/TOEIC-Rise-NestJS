import { QuestionResponseDto } from 'src/question/dto/question-response.dto';

export class QuestionGroupResponseDto {
  id: number;
  audioUrl?: string;
  imageUrl?: string;
  passage?: string;
  transcript?: string;
  position: number;
  questions: QuestionResponseDto[];
}
