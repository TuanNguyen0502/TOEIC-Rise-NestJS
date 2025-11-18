import { Injectable } from '@nestjs/common';
import { QuestionGroup } from 'src/entities/question-group.entity';
import { Test } from 'src/entities/test.entity';
import { Part } from 'src/entities/part.entity';
import { QuestionExcelRequestDto } from 'src/test/dto/question-excel-request.dto';

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
}
