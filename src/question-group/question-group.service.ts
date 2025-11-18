import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QuestionGroup } from 'src/entities/question-group.entity';
import { QuestionGroupMapper } from './mapper/question-group.mapper';
import { Test } from 'src/entities/test.entity';
import { Part } from 'src/entities/part.entity';
import { QuestionExcelRequestDto } from 'src/test/dto/question-excel-request.dto';
import { AppException } from 'src/exceptions/app.exception';
import { ErrorCode } from 'src/enums/ErrorCode.enum';

@Injectable()
export class QuestionGroupService {
  constructor(
    @InjectRepository(QuestionGroup)
    private readonly questionGroupRepo: Repository<QuestionGroup>,
    private readonly mapper: QuestionGroupMapper,
  ) {}

  async createQuestionGroup(
    test: Test,
    part: Part,
    excelRequest: QuestionExcelRequestDto,
  ): Promise<QuestionGroup> {
    const questionGroup = this.mapper.toQuestionGroup(test, part, excelRequest);

    return await this.questionGroupRepo.save(questionGroup);
    // save() của TypeORM = save + flush
  }

  async getQuestionGroup(id: number): Promise<QuestionGroup | null> {
    // TypeORM findOne() trả về entity | null
    return await this.questionGroupRepo.findOne({
      where: { id },
    });
  }

  async getQuestionGroupAsc(id: number): Promise<QuestionGroup[]> {
    const groups = await this.questionGroupRepo.find({
      where: { test: { id: id } },
      relations: ['part', 'questions', 'questions.tags'],
      order: {
        part: { id: 'ASC' }, // Order by part
        position: 'ASC', // Then by group position
        questions: { position: 'ASC' }, // Then by question position
      },
    });
    if (groups == null) {
      throw new AppException(ErrorCode.RESOURCE_NOT_FOUND, 'QuestionGroup');
    }
    return groups;
  }
}
