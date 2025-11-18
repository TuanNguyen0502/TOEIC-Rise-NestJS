export class QuestionExcelRequestDto {
  partNumber: number | null;
  questionGroupId: string | null;
  numberOfQuestions: number | null;
  passageText: string | null;
  question: string | null;
  optionA: string | null;
  optionB: string | null;
  optionC: string | null;
  optionD: string | null;
  correctAnswer: string | null;
  audioUrl: string | null;
  imageUrl: string | null;
  explanation: string | null;
  transcript: string | null;
  tags: string | null;
}
