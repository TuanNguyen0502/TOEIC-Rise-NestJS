import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
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
      relations: ['part', 'questions'],
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

  async checkQuestionGroupsExistByIds(ids: number[]) {
    const groups = await this.questionGroupRepo.find({
      where: { id: In(ids) },
      select: ['id'],
    });
    const existing = groups.map((g) => g.id);
    for (const id of ids) {
      if (!existing.includes(id)) {
        throw new AppException(ErrorCode.RESOURCE_NOT_FOUND, 'Question group');
      }
    }
  }

  async findAllByIdInFetchQuestions(ids: number[]): Promise<QuestionGroup[]> {
    const qg = await this.questionGroupRepo
      .createQueryBuilder('qg')
      .leftJoinAndSelect('qg.part', 'part') // <- đảm bảo part được load
      .leftJoinAndSelect('qg.questions', 'questions')
      .where('qg.id IN (:...ids)', { ids })
      .getMany();
    return qg;
  }

  isListeningPart(part: Part): boolean {
    return ['1', '2', '3', '4'].some((p) => part.name.includes(p));
  }

  async getQuestionGroupsByTestIdGroupByParts(
    testId: number,
    partIds: number[],
  ) {
    // Find question groups for the test and specified parts
    const questionGroups = await this.questionGroupRepo.find({
      where: {
        test: { id: testId },
        part: { id: In(partIds) },
      },
      relations: ['part', 'questions', 'questions.tags'],
      order: {
        position: 'ASC',
        questions: { position: 'ASC' },
      },
    });

    // Group by Part
    const groupedByPart = new Map();
    questionGroups.forEach((group) => {
      const part = group.part;
      if (!groupedByPart.has(part.id)) {
        groupedByPart.set(part.id, { part, groups: [] });
      }
      groupedByPart.get(part.id).groups.push(group);
    });

    return Array.from(groupedByPart.values());
  }

  async getPartNameByQuestionGroupId(questionGroupId: number): Promise<string> {
    const questionGroup = await this.questionGroupRepo.findOne({
      where: { id: questionGroupId },
      relations: ['part'],
    });

    if (!questionGroup) {
      throw new AppException(
        ErrorCode.RESOURCE_NOT_FOUND,
        `Question group with ID ${questionGroupId}`,
      );
    }

    return questionGroup.part.name;
  }
}
