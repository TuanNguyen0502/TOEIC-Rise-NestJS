import { Injectable } from '@nestjs/common';
import { QuestionGroup } from 'src/entities/question-group.entity';
import { Test } from 'src/entities/test.entity';
import { Part } from 'src/entities/part.entity';
import { QuestionExcelRequestDto } from 'src/test/dto/question-excel-request.dto';
import { LearnerTestQuestionGroupResponse } from 'src/user-test/dto/learner-test-question-group-response.dto';
import { QuestionGroupResponseDto } from '../dto/question-group-response.dto';
import { QuestionResponseDto } from 'src/question/dto/question-response.dto';

@Injectable()
export class QuestionGroupMapper {
  toQuestionGroup(
    test: Test,
    part: Part,
    excelRequest: QuestionExcelRequestDto,
  ): QuestionGroup {
    const qg = new QuestionGroup();

    qg.test = test;
    qg.part = part;
    qg.audioUrl = excelRequest.audioUrl || undefined;
    qg.imageUrl = excelRequest.imageUrl || undefined;
    qg.position = excelRequest.numberOfQuestions ?? 0;
    qg.passage = excelRequest.passageText || undefined;
    qg.transcript = excelRequest.transcript || undefined;

    return qg;
  }

  toLearnerTestQuestionGroupResponse(
    qg: QuestionGroup,
  ): LearnerTestQuestionGroupResponse {
    return {
      id: qg.id,
      audioUrl: qg.audioUrl,
      imageUrl: qg.imageUrl,
      passage: qg.passage,
      transcript: qg.transcript,
      position: qg.position,
      questions: [],
    };
  }

  toResponse(
    qg: QuestionGroup,
    questions: QuestionResponseDto[] = [],
  ): QuestionGroupResponseDto {
    return {
      id: qg.id,
      audioUrl: qg.audioUrl,
      imageUrl: qg.imageUrl,
      passage: qg.passage,
      transcript: qg.transcript,
      position: qg.position,
      // Map danh sách câu hỏi con từ parameter (corresponds to Java logic)
      questions: questions.map((q) => ({
        id: q.id,
        content: q.content,
        options: q.options,
        correctOption: q.correctOption,
        explanation: q.explanation,
        position: q.position,
        tags: q.tags || [],
      })),
    };
  }
}
