// src/question/question.mapper.ts
import { Injectable } from '@nestjs/common';
import { Question } from 'src/entities/question.entity';
import { QuestionGroup } from 'src/entities/question-group.entity';
import { QuestionExcelRequestDto } from 'src/test/dto/question-excel-request.dto';
import { LearnerTestQuestionResponse } from 'src/user-test/dto/learner-test-question-response.dto';

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

  toLearnerTestQuestionResponse(
    question: Question,
  ): LearnerTestQuestionResponse {
    const normalizedOptions =
      !question.options || question.options.length === 0
        ? [null, null, null, null]
        : question.options.map((o) => (o === 'null' || o === '' ? null : o));
    return {
      id: question.id,
      position: question.position,
      content: question.content,
      options: normalizedOptions,
    };
  }
}
