export class QuestionResponseDto {
  id: number;
  position: number;
  content: string;
  options: string[];
  correctOption: string;
  explanation?: string;
  tags: string[];
}
