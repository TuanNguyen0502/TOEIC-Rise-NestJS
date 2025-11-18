// src/question/question.mapper.ts
import { Injectable } from '@nestjs/common';
import { Question } from 'src/entities/question.entity';
import { QuestionGroup } from 'src/entities/question-group.entity';
import { QuestionExcelRequestDto } from 'src/test/dto/question-excel-request.dto';

@Injectable()
export class QuestionMapper {
  toEntity(
    excelRequest: QuestionExcelRequestDto,
    questionGroup: QuestionGroup,
  ): Question {
    const options = [
      excelRequest.optionA,
      excelRequest.optionB,
      excelRequest.optionC,
      excelRequest.optionD,
    ].filter((opt): opt is string => opt != null);

    const q = new Question();
    q.questionGroup = questionGroup;
    q.position = excelRequest.numberOfQuestions ?? 0;
    q.content = excelRequest.question || '';
    q.options = options;
    q.correctOption = excelRequest.correctAnswer || '';
    q.explanation = excelRequest.explanation || undefined;

    return q;
  }
}
