import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions, Like } from 'typeorm';
import { Test } from '../entities/test.entity';
import { TestSet } from '../entities/test-set.entity';
import { Part } from '../entities/part.entity';
import { QuestionGroup } from '../entities/question-group.entity';
import { Question } from '../entities/question.entity';
import { Tag } from '../entities/tag.entity';
import { PageRequestDto } from './dto/page-request.dto';
import { ETestSetStatus } from '../enums/ETestSetStatus.enum';
import { ETestStatus } from '../enums/ETestStatus.enum';

@Injectable()
export class TestService {
  constructor(
    @InjectRepository(Test)
    private testRepository: Repository<Test>,
  ) {}

  /**
   * Corresponds to: testService.searchTestsByName(pageRequest)
   *
   * This implements the logic from TestServiceImpl.java:
   * - Filters by name (if provided)
   * - Filters by status: APPROVED
   * - Filters by testSet status: IN_USE
   * - Paginates results
   */
  async searchTestsByName(dto: PageRequestDto) {
    const { page, size, name } = dto;

    const whereOptions: FindManyOptions<Test>['where'] = {
      status: ETestStatus.APPROVED,
      testSet: {
        status: ETestSetStatus.IN_USE,
      },
    };

    if (name) {
      whereOptions.name = Like(`%${name}%`);
    }

    const [result, total] = await this.testRepository.findAndCount({
      where: whereOptions,
      relations: ['testSet'],
      order: { createdAt: 'DESC' },
      take: size,
      skip: page * size,
    });

    // Map to LearnerTestResponse format
    const learnerTestResponses = result.map((test) => ({
      id: test.id,
      testName: test.name,
      testSetName: test.testSet.name,
      numberOfLearnedTests: test.numberOfLearnerTests,
    }));

    // Format for PageResponse
    return {
      meta: {
        page: page,
        pageSize: size,
        pages: Math.ceil(total / size),
        total: total,
      },
      result: learnerTestResponses,
    };
  }

  /**
   * Corresponds to: testService.getLearnerTestDetailById(id)
   *
   * This translates the native SQL query from `TestRepository.java`
   * (`findListTagByIdOrderByPartName`) into a TypeORM QueryBuilder.
   */
  async getLearnerTestDetailById(id: number) {
    const testWithDetails = await this.testRepository
      .createQueryBuilder('t')
      .select([
        't.id AS testId',
        't.name AS testName',
        't.numberOfLearnerTests AS numberOfLearnedTests',
        'p.id AS partId',
        'p.name AS partName',
        // Use GROUP_CONCAT for aggregation, similar to the Java native query
        'GROUP_CONCAT(DISTINCT tg.name ORDER BY tg.name SEPARATOR "; ") AS tagNames',
      ])
      .innerJoin('t.questionGroups', 'qg')
      .innerJoin('qg.part', 'p')
      .leftJoin('qg.questions', 'q')
      .leftJoin('q.tags', 'tg')
      .where('t.id = :id', { id })
      .andWhere('t.status = :status', { status: ETestStatus.APPROVED })
      .groupBy('t.id, t.name, t.numberOfLearnerTests, p.name, p.id')
      .orderBy('p.id', 'ASC')
      .getRawMany();

    if (!testWithDetails || testWithDetails.length === 0) {
      throw new NotFoundException('Test not found');
    }

    // Process the raw query result
    const firstRow = testWithDetails[0];
    const response = {
      testId: firstRow.testId,
      testName: firstRow.testName,
      numberOfLearnedTests: firstRow.numberOfLearnedTests,
      learnerPartResponses: testWithDetails.map((row) => ({
        partId: row.partId,
        partName: row.partName,
        tagNames: row.tagNames ? row.tagNames.split('; ') : [],
      })),
    };

    return response;
  }
}
